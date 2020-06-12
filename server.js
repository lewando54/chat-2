const express = require('express')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (/(.jpeg|.png|.jpg)$/.test(file.originalname))
            cb(null, 'uploads/images/')
        else
            cb(null, 'uploads/files/')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })
const app = express()
const server = require('http').Server(app)
const mysql = require('mysql');
const io = require('socket.io')(server)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

var con = mysql.createConnection({
    host: process.env.DATABASE_URL,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_DBNAME
})

con.connect(function(err) {
    if (err) throw err;
    console.log("Połączono z mysql")
})

let userIstnieje = false

io.on('connection', socket => {
    socket.on('new-room-update', newRoomName => {
        con.query('SELECT * FROM trooms', (err, result) => {
            let duplicate = false;
            if (err) throw err;
            Object.keys(result).forEach(key => {
                var row = result[key]
                if (row.room_name === newRoomName | newRoomName === 'register' | newRoomName === 'login') {
                    duplicate = true;
                }
            })
            if (!duplicate) {
                con.query(`INSERT INTO trooms VALUES (NULL, '${newRoomName}' )`, (err) => {
                    if (err) throw err;
                })
            } else {
                socket.emit('duplicate', 'Pokój już istnieje bądź nazwa jest niedozwolona!')
            }
        })
    })

    socket.on('room-update', () => {
        con.query('SELECT * FROM trooms', (err, result) => {
            if (err) throw err;
            socket.emit('update', result)
        })
    })

    socket.on('new-user-update', (email, login) => {
        con.query(`SELECT * FROM tusers`, (err, result) => {
            if (err) throw err;
            Object.keys(result).forEach(key => {
                var row = result[key]
                if (row.email === email) {
                    userIstnieje = true
                    socket.emit('duplicate', 'Email jest już zajęty!')
                } else if (row.login === login) {
                    userIstnieje = true
                    socket.emit('duplicate', 'Nazwa użytkownika jest zajęta!')
                }
            })
        })
    })
})

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/register', upload.single('avatar'), (req, res, next) => {

    if (!userIstnieje) {
        let fileName = 'defaultAvatarL54.png'
        if (req.file != undefined)
            fileName = req.file.originalname
        con.query(`INSERT INTO tusers VALUES (NULL, '${req.body.email}', '${req.body.login}', '${req.body.password}', '${req.protocol}://${req.hostname}/uploads/images/${fileName}')`, err => {
            if (err) throw err;
        })
    } else {
        res.redirect(`/register`)
    }
    res.redirect('/login')
})

app.get('/:room', (req, res) => {
    con.query('SELECT * FROM trooms', (err, result) => {
        let istnieje = false
        if (err) throw err;
        Object.keys(result).forEach(key => {
            var row = result[key]
            if (row.room_name === req.params.room) {
                istnieje = true
            }
        })
        if (istnieje) {
            res.render('room', { roomName: req.params.room })
        } else {
            res.redirect('/')
        }
    })
})

server.listen(80)