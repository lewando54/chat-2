//połączenie z serwerem
const socket = io()

let prosbaOPokoje
let userUpdate

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
let disconnect = document.querySelector('#disconnect')
let burger = document.querySelector('#burger')
let nav = document.querySelector('nav')

//odświeżenie listy pokoi po wejściu na stronę
updateRooms()

//wysłanie prośby do serwera co 1000ms o odświeżenie listy pokoi
if (roomCont != undefined) {
    nav.style.display = 'flex'
    nav.style.position = 'relative'
    nav.style.top = '0'
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
} else {
    clearInterval(prosbaOPokoje)
}



if (msgCont != undefined) {
    socket.emit('user-join', roomName.innerHTML, userName.innerHTML)

    updateMsgs()

    msgForm.addEventListener('submit', e => {
        e.preventDefault()
        socket.emit("new-msg", roomName.innerHTML, userName.innerHTML, msgTresc.value)
        msgTresc.value = ''
    })

    socket.on('msgs-update-client', data => {
        msgCont.innerHTML = "" 
        Object.keys(data).forEach((key) => {
            var row = data[key];
            appendMsg(row.tresc, row.login, row.avatar_url);
        });
    })

    disconnect.addEventListener('click', e => {
        socket.emit('user-disconnect', roomName.innerHTML, userName.innerHTML)
    })

    burger.addEventListener("click", e => {
        if(nav.style.display === 'none')
            nav.style.display = 'flex'
        else
            nav.style.display = 'none'
    })
}


//sprawdzanie czy użytkownik istnieje w bazie
if (regForm != undefined) {
    userUpdate = setInterval(updateUser, 1000)
} else {
    clearInterval(userUpdate)
}

//wykrycie tej samej nazwy
socket.on('duplicate', info => {
    if (info === 'email') {
        regEmailErr.innerHTML = "Ten email jest już zajęty!"
    } else if (info === 'login') {
        regLoginErr.innerHTML = "Ta nazwa jest już zajęta!"
    } else if (info === 'emailErr') {
        regLoginErr.innerHTML = "Ta nazwa jest już zajęta!";
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
    roomWindow.setAttribute('class', 'roomWindow')
    roomWindow.innerHTML = `<p>${roomName}</p><a href="/${roomName}" class="enterRoom">Wejdź</a>`
    roomCont.appendChild(roomWindow)
}

//wysłanie prośby do serwera o pokoje
function updateRooms() {
    socket.emit('room-update')
}

function updateMsgs() {
    socket.emit('msgs-update', roomName.innerHTML)
}

function appendMsg(msg, autor, avatarURL) {
    let msgWindow = document.createElement("div")
    let msgTrescWindow = document.createElement("div")
    let avatar = document.createElement("img")
    let autorTag = document.createElement("p")
    let autorCont = document.createElement("div")

    autorTag.innerHTML = autor
    autorTag.setAttribute('class', 'autor')

    avatar.setAttribute('src', avatarURL)
    avatar.setAttribute('class', 'avatar')

    msgTrescWindow.innerHTML = urlify(msg)
    msgTrescWindow.setAttribute('class', 'wraptext')

    autorCont.appendChild(avatar)
    autorCont.appendChild(autorTag)
    msgWindow.appendChild(autorCont)
    msgWindow.appendChild(msgTrescWindow)

    autorCont.setAttribute('class', 'autorCont')
    msgWindow.setAttribute('class', 'msgWindow')

    msgCont.appendChild(msgWindow)
}

function updateUser() {
    socket.emit('new-user-update', regEmail.value, regUser.value)
}

function checkImg(text) {
    return /\.(gif|jpe?g|tiff|png|webp|bmp)/i.test(text);
}

function urlify(text) {
    let urlRegex = /(https?:\/\/[^\s]+)/gi;
    return text.replace(urlRegex, function (url) {
        if (checkImg(url))
            return (
                '<a target="_blank" class="wraptext" href="' + url + '">' + url + '</a><img src="' + url + '"><span class="wraptext">'
            );
        
        return '<a target="_blank" class="wraptext" href="' + url + '">' + url + '</a><span class="wraptext">';
    })
}