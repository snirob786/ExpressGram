const express = require('express');
require('dotenv').config();
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const port = process.env.PORT || 3000;
const initializePassport = require('./passport-config');
initializePassport(passport, email => {
    return users.find(user => user.email === email)},
    id => {
        return users.find(user => user.id === id)
})

const users = [];

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session())

app.get('/', (req, res) => {
    res.render('index', { title: "Login System" })
})

app.get('/login', (req, res) => {
    res.render('login.ejs', { title: "Login Page" })
})

app.get('/register', (req, res) => {
    res.render('register.ejs', { title: "Register Page" })
})

// Post API

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        console.log("Profile: ", users);
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

app.post('/login', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }))



app.listen(port, () => { console.log("Listening to port: ", port) })