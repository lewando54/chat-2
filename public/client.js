//połączenie z serwerem
const socket = io()

let prosbaOPokoje
let prosbaOUsers

//złapane elementy strony głównej
let roomForm = document.querySelector("#roomForm")
let newRoomName = document.querySelector("#roomName")
let roomCont = document.querySelector('#roomCont')

//złapane elementy rejestracji
let regForm = document.querySelector('#regForm')
let regEmail = document.querySelector('#email')
let regUser = document.querySelector('#login')

//odświeżenie listy pokoi po wejściu na stronę
updateRooms()

//wysłanie prośby do serwera co 1000ms o odświeżenie listy pokoi
if (roomForm != undefined) {
    prosbaOPokoje = setInterval(updateRooms, 1000)

    //utworzenie nowego pokoju
    roomForm.addEventListener('submit', e => {
        e.preventDefault()
        socket.emit('new-room-update', newRoomName.value)
    })

    //aktualizacja listy pokoi z danymi z serwera
    socket.on('update', data => {
        roomCont.innerHTML = ''
        Object.keys(data).forEach(key => {
            var row = data[key]
            appendRoom(row.room_name)
        })
    })
}


//
if (regForm != undefined)
    prosbaOUsers = setInterval(updateUser, 2000)

//wykrycie tej samej nazwy pokoju przez serwer
socket.on('duplicate', info => {
    alert(info)
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

function updateUser() {
    socket.emit('new-user-update', regEmail.value, regUser.value)
}