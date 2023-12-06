const DATA = {data: null, word: null}
const DATA_SELECTOR = "#jsdata[type='application/json']"
const FLASH_SELECTOR = "#flashes[type='application/json']"

function get_definitions() {
    let api_key = 'SCRUBBED';
    let url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${api_key}`;
    $.ajax({
        type: 'GET',
        url: url,
        data: {},
        success(response) {
            let def = response[0];
            let category = def.fl;
            let shortdef = def.shortdef[0];
            let date = def.date;
            let temp_html = `
          <div style="padding: 10px">
            <i>${category}</i>
            <br />
            ${shortdef}
            <br />
            <span class="example">${date}</span>
          </div>`;
            let container = $('#definition');
            container.empty();
            container.append(temp_html);
        }
    });
}

function save_word() {
    let defs = DATA.data[0].shortdef[0]
    let word = DATA.word
    let data = {
        word: word,
        definition: defs,
    }
    $.ajax({
        type: 'POST',
        url: '/api/word',
        data: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
        success: function(response) {
            if (response.status === 'success') {
                window.location.href = `/detail/${word}?status=old`;
                return
            }
            // Since we knew only error left.
            showAlert({
                title: "Error",
                body: response.message,
                type: 'error',
                delay: 5000
            })
        },
        statusCode: {
            400: (jqXHR) => {
                showAlert({
                    title: "Error",
                    body: jqXHR.responseJSON.message,
                    type: 'error',
                    delay: 5000
                })
            }
        }
    });
}

function delete_word() {
    $.ajax({
        type: 'DELETE',
        url: '/api/word',
        data: {
            word: DATA.word,
        },
        success(response) {
            if (response.status === 'success') {
                window.location.href = `/detail/${DATA.word}?status=new`;
                return
            }
            showAlert({
                title: "Error",
                body: response.message,
                type: 'error',
                delay: 5000
            })
        },
        statusCode: {
            400: (jqXHR) => {
                showAlert({
                    title: "Error",
                    body: jqXHR.responseJSON.message,
                    type: 'error',
                    delay: 5000
                })
            }
        }
    });
}

function find_word() {
  let word = $('#input-word').val().toLowerCase().trim();
  if (!word) {
    error('Please type a word');
    return;
  }
  if (DATA.word.includes(word)) {
    let row = $(`#word-${word}`);
    row.addClass('highlight');
    row.siblings().removeClass('highlight');
    row[0].scrollIntoView();
  } else {
    location.href = `/detail/${word}?status=new`;
  }
}

function executeFlashes(){
    const rawE = $(FLASH_SELECTOR)
    const raw = rawE.text().trim()
    if (!raw) return null;
    let flashes = JSON.parse(raw)
    const config = JSON.parse(rawE.attr('data-config')) || { title: "Hey!"}
    for (let i of flashes) {
        let j = {type: i[0]}
        Object.assign(j, config)
        j.body = i[1]
        j.title = "RimuAerisya#SYSTEM"
        if (i[0] == 'typo') { j.delay = 20000, j.type= 'error' }
        showAlert(j)
    }
}

function get_examples() {
    $("#example-list").empty()
    let path = location.pathname.split('/')
    const word = path[path.length-1]
    $.ajax({
        type: "GET",
        url: `/api/examples?word=${word}`,
        success: function (response) {
            const examples = response.data
            const container = $("#example-list")
            for (let i of examples) {
                container.prepend(`<li data-id="${i.id}">${i.example} <button type='button' class='btn btn-danger btn-sm'><i class="bi bi-trash-fill"></i></button></li>`)
                $(`li[data-id="${i.id}"]>button`).on('click', (e) => {
                    delete_example(e.target.parentElement.attributes['data-id'].value)
                })
            }
        }
    });
}

function add_example() {
    let new_ex = $('#new-example').val();
    let path = location.pathname.split('/')
    const word = path[path.length-1]
    $.ajax({
        type: "POST",
        url: `/api/examples`,
        data: {
            word: word,
            example: new_ex
        },
        success: function () {
            get_examples()
        },
        statusCode: {
            400: (jqXHR) => {
                showAlert({
                    title: "Error",
                    body: jqXHR.responseJSON.message,
                    type: 'error',
                    delay: 5000
                })
            }
        }

    });


}

function delete_example(id) {
    let path = location.pathname.split('/')
    const word = path[path.length-1]
    $.ajax({
        type: "DELETE",
        url: `/api/examples`,
        data: {
            word: word,
            id: id
        },
        success: function () {
            get_examples()
        },
        statusCode: {
            400: (jqXHR) => {
                showAlert({
                    title: "Error",
                    body: jqXHR.responseJSON.message,
                    type: 'error',
                    delay: 5000
                })
            }
        }

    });
}

$(document).ready(function() {
    //get_definitions();
    executeFlashes()
    let rawData = $(DATA_SELECTOR)
    if (!rawData) return null;
    DATA.data = JSON.parse(rawData.text().trim())
    DATA.word = rawData.attr('data-word')

    let savebtn = document.querySelector("#btn-save")
    let delbtn = document.querySelector("#btn-delete")
    if (savebtn) savebtn.onclick = save_word;
    if (delbtn) delbtn.onclick = delete_word;

    if (location.pathname.includes('/detail')) get_examples()
});

window.onerror = (event, source, lineno, colno, error) => {
    console.log(event)
    showAlert({
        type: "error",
        title: "Uh no, there's an error~",
        body: `${error} at ${lineno}:${colno}\n${source}`,
        delay: 10000
    })
}
