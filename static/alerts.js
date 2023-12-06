// Alerts

function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}

function randint(max) {
  return Math.floor(Math.random() * max);
}


const ALERT_CONFIG = {
    target: "#alerts"
}


function _reparse(name) {
    switch (name) {
        case "error":
        case "err":
            return "danger"
        case "warn":
            return "warning"
        case "primary":
        case "secondary":
        case "success":
        case "info":
        case "danger":
        case "light":
        case "dark":
        case "warning":
            return name
        default:
            return "primary"
    }
}

function _fetchIcon(type) {
    switch (type) {
        case "danger":
            return '<i class="bi bi-x-circle-fill"></i>'
        case "warning":
            return '<i class="bi bi-exclamation-circle-fill"></i>'
        case "success":
            return '<i class="bi bi-check-circle-fill"></i>'
        default:
            return '<i class="bi bi-info-circle-fill"></i>'
    }
}

function showAlert(config) {
    let title = config.title === undefined ? "" : `${sanitize(config.title)}`
    let body = config.body === undefined ? "Content" : `${sanitize(config.body)}`
    let delay = config.delay === undefined ? 2000 : config.delay
    let aType = _reparse(config.type)
    let toastId = `liveToast-${randint(999999)}`

    body = body.replace("\n", "<br>")
    let html = `<div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}"><div class="toast-header"><div class='text-${aType} me-1'>${_fetchIcon(aType)}</div><strong class="me-auto">${title}</strong><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div><div class="toast-body">${body}</div></div>`
    $(ALERT_CONFIG.target).prepend(html)
    
    const toastLiveExample = document.getElementById(toastId)
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample, {delay: delay})
    toastBootstrap.show()
}

const error = (text) => showAlert({title: "Error", body: text, type: "error"})
const info = (text) => showAlert({title: "Hey!", body: text, type: "info"})
const warning = (text) => showAlert({title: "warn", body: text, type: "warning"})
