//Konfiguracja serwera
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
const session = require('express-session')
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//połączenie z mysql
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: null,
    database: 'chat'
})

con.connect(function(err) {
    if (err) throw err;
    console.log("Połączono z mysql")
})

//zmienne: czy istnieje użytkownik, którego próbujemy zarejestrować i sesji
let userIstnieje = false
var sess;

//dalsza konfiguracja
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "lewando54chat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

//przechwytywanie żądań socket.io i odpowiedzi
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
        con.query(`SELECT * FROM tusers WHERE login='${login}' OR email='${email}'`, (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].email === email) {
                    socket.emit('duplicate', 'email')
                    console.log('email istnieje')
                } else {
                    socket.emit('unduplicate', 'email')
                    console.log("email nieistnieje");
                }
                if (result[0].login === login) {
                  socket.emit("duplicate", "login");
                  console.log("login istnieje");
                } else {
                  socket.emit("unduplicate", "login");
                  console.log("login nieistnieje");
                }
                if (result[0].login === login && result[0].email == email)
                  userIstnieje = true;
            } else {
                userIstnieje = false;
            }
        })
    })
})

//żądania http i odpowiedzi
app.get('/', (req, res) => {
    sess = req.session
    res.render('index')
})

app.get('/register', (req, res) => {
    sess = req.session;
    if (sess.user != undefined)
        return res.redirect('/')
    res.render('register')
})

app.get('/login', (req, res) => {
    sess = req.session;
    if (sess.user != undefined)
        return res.redirect("/");
    res.render('login')
})

app.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
});

app.post('/register', upload.single('avatar'), (req, res) => {
    if (!userIstnieje && /\b[\w.!#$%&’*+\/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)\b/.test(req.body.email)) {
        let fileName = 'defaultAvatarL54.png'
        if (req.file != undefined)
            fileName = req.file.originalname
        con.query(`INSERT INTO tusers VALUES (NULL, '${req.body.email}', '${req.body.login}', '${req.body.password}', '${req.protocol}://${req.hostname}/uploads/images/${fileName}')`, err => {
            if (err) throw err;
        })
    } else {
        return res.redirect(`/register`)
    }
    res.redirect('/login')
})

app.post('/login', (req, res) => {
    sess = req.session
    let istnieje = false
    con.query(`SELECT * FROM tusers WHERE login='${req.body.login}'`, (err, result) => {
        if (result.length > 0) {
            if (result[0].login === req.body.login)
            {
                if (!sess.user && req.body.password === result[0].pass)
                    sess.user = req.body.login
                else if (req.body.password != result[0].pass) {
                    sess.destroy();
                    return res.render("login_failed.ejs")
                }    
                else
                    sess.destroy();
                return res.redirect('/')
            }
            else {
                return res.redirect('/login')
            }
        } else {
            sess.destroy();
            res.render('login_failed.ejs')
        }
    })
})

app.get('/:room', (req, res) => {
    sess = req.session
    con.query('SELECT * FROM trooms', (err, result) => {
        let istnieje = false
        if (err) throw err;
        Object.keys(result).forEach(key => {
            var row = result[key]
            if (row.room_name === req.params.room) {
                istnieje = true
            }
        })
        if (istnieje && sess.user != undefined) {
            res.render('room', { roomName: req.params.room })
        } else if (sess.user === undefined) {
            return res.redirect('/login')
        } else {
            res.redirect('/')
        }
    })
})

server.listen(80)