//połączenie z serwerem
const socket = io()

let prosbaOPokoje
let prosbaOWiadomosci

//złapane elementy strony głównej
let roomForm = document.querySelector("#roomForm")
let newRoomName = document.querySelector("#roomName")
let roomCont = document.querySelector('#roomCont')

//złapane elementy logowania
let logForm = document.querySelector('logForm')
let logUser = document.querySelector('logLogin')
let logPass = document.querySelector('logPass')

//złapane elementy rejestracji
let regForm = document.querySelector('#regForm')
let regEmail = document.querySelector('#email')
let regUser = document.querySelector('#login')
let regEmailErr = document.querySelector('#email-err')
let regLoginErr = document.querySelector('#login-err')

//złapane elementy pokoju
let msgCont = document.querySelector('#msgCont')
let msgForm = document.querySelector('#msgForm')
let msgTresc = document.querySelector('#msgInput')
let roomName = document.querySelector('#roomName')
let userName = document.querySelector('#userName')

//odświeżenie listy pokoi po wejściu na stronę
updateRooms()

//wysłanie prośby do serwera co 1000ms o odświeżenie listy pokoi
if (roomCont != undefined) {
    prosbaOPokoje = setInterval(updateRooms, 2000)

    //utworzenie nowego pokoju
    if (roomForm != undefined) {
        roomForm.addEventListener('submit', e => {
        e.preventDefault()
        socket.emit('new-room-update', newRoomName.value)
        })
    }
    

    //aktualizacja listy pokoi z danymi z serwera
    socket.on('update', data => {
        roomCont.innerHTML = ''
        Object.keys(data).forEach(key => {
            var row = data[key]
            appendRoom(row.room_name)
        })
    })
}

if (msgCont != undefined) {
    updateMsgs()
    socket.emit('user-join', roomName.innerHTML, userName.innerHTML)
    console.log('Test')
    msgForm.addEventListener('submit', e => {
        e.preventDefault()
        socket.emit("new-msg", roomName.innerHTML, userName.innerHTML, msgTresc.value)
        msgTresc.value = ''
    })
    socket.on('msgs-update-client', data => {
        msgCont.innerHTML = "" 
        Object.keys(data).forEach((key) => {
            var row = data[key];
            appendMsg(row.tresc);
        });
    })
}


//sprawdzanie czy użytkownik istnieje w bazie
if (regForm != undefined) {
    regEmail.addEventListener('keyup', e => {
        updateUser()
    })

    regUser.addEventListener('keyup', e => {
        updateUser()
    })
}

//wykrycie tej samej nazwy
socket.on('duplicate', info => {
    if (info === 'email') {
        regEmailErr.innerHTML = "Ten email jest już zajęty!"
    } else if (info === 'login') {
        regLoginErr.innerHTML = "Ta nazwa jest już zajęta!"
    } else {
        alert(info)
    }
})

socket.on('unduplicate', info => {
    if (info === 'email') {
        regEmailErr.innerHTML = ""
    } else if (info === 'login') {
        regLoginErr.innerHTML = ""
    }
})

//dołączenie nowego pokoju do listy po stronie klienta
function appendRoom(roomName) {
    let roomWindow = document.createElement('div')
    roomWindow.innerHTML = `<p>${roomName}</p><a href="/${roomName}">Wejdź</a>`
    roomCont.appendChild(roomWindow)
}

//wysłanie prośby do serwera o pokoje
function updateRooms() {
    socket.emit('room-update')
}

function updateMsgs() {
    socket.emit('msgs-update', roomName.innerHTML)
}

function appendMsg(msg) {
    let msgWindow = document.createElement("div");
    msgWindow.innerHTML = msg;
    msgCont.appendChild(msgWindow);
}

function updateUser() {
    socket.emit('new-user-update', regEmail.value, regUser.value)
    if (/\b[\w.!#$%&’*+\/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)\b/.test(regEmail.value) === false) {
        regEmailErr.innerHTML = 'Niepoprawny adres email!'
    }
    else {
        regEmailErr.innerHTML = "";
    }
}