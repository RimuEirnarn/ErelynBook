from os import environ, urandom
from os.path import exists
from dotenv import load_dotenv
from flask import Flask, flash, jsonify, redirect, render_template, request
from pymongo import MongoClient
import requests
from datetime import datetime
from bson import ObjectId
import gzip
import csv

load_dotenv()
app = Flask(__name__)
app.secret_key = urandom(256)
app.config['SESSION_COOKIE_SAMESITE'] = "Lax"
API_KEY = environ.get("API_KEY")

profanity_filter = []

if exists("google-profanity-filter.csv.gz"):
    with open('google-profanity-filter.csv.gz', 'rb') as f:
        data = gzip.decompress(f.read()).decode('utf-8')
        reader = csv.reader(data)
        previous = ""
        for row in reader:
            if row == ['', '']:
                profanity_filter.append(previous)
                previous = ""
                continue
            previous += ''.join(row)

def compose(status, message):
    return jsonify({'status': status, 'message': message})

if environ.get("MONGODB_URI", None) and environ.get("environment", None) in ("prod", "testprod"):
    client = MongoClient(environ["MONGODB_URI"])
    database = client[environ["DB_NAME"]]
    book = database[environ.get("CL_NAME", "erelynbook")]
    examples = database[environ.get("CL_EX_NAME", "erelynexamples")]
else:
    print("Tidak ditemukan URI database serta environment tidak production.")
    raise SystemExit(1)

@app.add_template_filter
def format_it(value):
    return value.replace("{it}", "[").replace("{/it}", "]")

@app.route('/')
def home():
    findwords = book.find({}, {'_id': False})
    words = []
    for word in findwords:
        definition = word['definition']
        words.append({
            'word': word['word'],
            'definition': definition,
        })
    return render_template(
        'index.html',
        words=words
    )

@app.route("/detail/<keyword>")
def detail(keyword):
    # Mantap! collegiate butuh key yang beda tapi key-ku untuk hal lainnya!
    # Terimakasih!
    url = f'https://www.dictionaryapi.com/api/v3/references/ithesaurus/json/{keyword}?key={API_KEY}'
    response = requests.get(url)
    definitions = response.json()

    if keyword in profanity_filter:
        flash(f"Your word is... on my filter. You cannot search it, sorry.", "error")
        return redirect("/")

    if not definitions:
        flash(f"word {keyword} is undefined, try another. Perhaps it's a typo?", "error")
        return redirect("/")

    if isinstance(definitions[0], str):
        flash(f"word {keyword} is undefined. Try {', '.join(definitions)}.", "typo")
        return redirect("/")

    return render_template(
        'detail.html',
        word=keyword,
        definitions=definitions,
        status=request.args.get('status', 'new')
    )

@app.post("/api/word")
def save_word():
    data = request.get_json()
    word = data.get('word')
    def_ = data.get('definition')
    if not word:
        return compose("error", "word is empty"), 400
    if not def_:
        return compose("error", "definition is empty"), 400

    book.insert_one({
        'word': word,
        'definition': def_,
        'timestamp': datetime.utcnow().timestamp()
    })
    return compose("success", f"word {word!r} is saved")

@app.delete("/api/word")
@app.post("/api/word/delete")
def delete_word():
    word = request.form.get('word')
    if not word:
        return compose("error", "word is empty"), 400
    book.delete_one({'word': word})
    examples.delete_many({'key': word})
    return compose('success', f"Word {word!r} has been deleted")

@app.get("/api/examples")
def get_examples():
    word: str = request.args.get('word', "")
    if not word:
        return compose("error", f"User example word of {word!r} does not exists"), 400
    data = examples.find({'key': word})
    example_data = []
    for example in data:
        example_data.append({
            "example": example.get('example'),
            'id': str(example.get('_id'))
        })
    return jsonify({'status': 'success', 'data': example_data})

@app.post("/api/examples")
def save_example():
    word = request.form.get('word', '')
    example = request.form.get('example','')
    if not word or not example:
        return compose('error', "either word or example is empty"), 400
    if word not in example:
        return compose('error', "user's example does not have a matching word."), 400

    for i in profanity_filter:
        if i in example:
            return compose('error', "Your example word may violate my profanity filter."), 400

    examples.insert_one({
        'key': word,
        'example': example
    })
    return compose("success", f"Example is saved. word={word!r}")

@app.delete("/api/examples")
@app.post("/api/examples/delete")
def delete_examples():
    identity = request.form.get('id', '')
    word = request.form.get('word', '')
    if not word or not identity:
        return compose('error', "Either example id or word is empty"), 400
    examples.delete_one({'_id': ObjectId(identity)})
    return compose("success", f"Example is deleted. word={word!r}")

if __name__ == '__main__':
    try:
        app.run('0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("Keyboard interrupt", type(book))

