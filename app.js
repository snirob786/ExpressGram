const express = require('express');
const cors = require('cors');
const ejs = require('ejs');
const app = express();
const bcrypt = require('bcrypt');
require('dotenv').config();
require('./config/database');
require('./config/passport');
const User = require("./models/user.model");
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.set("view engine", "ejs");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: `mongodb://localhost:27017/${process.env.MONGO_DB_NAME}`,
        collectionName: "sessions",
        ttl: 60
    })
    //   cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

// Middlewares
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile')
    }
    next();
}

const isUserAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}

// Homepage
app.get('/', (req, res) => {
    res.render("index", { title: "Express Gram Homepage" })
})

// Register: get
app.get('/register', isLoggedIn, (req, res) => {
    res.render("register", { title: "Express Gram Register" })
})

// Register: post
app.post('/register', async (req, res) => {
    try {
        console.log(req.body)
        const user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).send("User is already exist")
        bcrypt.hash(req.body.password, 10, async (err, hash) => {

            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hash
            });
            await newUser.save();
            // res.status(201).send(newUser)
            res.status(201).redirect('/login')
        });
    } catch (error) {
        res.status(500).send(error.message)
        res.redirect('/register')
    }
})

// Login: get
app.get('/login', isLoggedIn, (req, res) => {
    res.render("login", { title: "Express Gram Login" })
})

// Login: post
app.post('/login', passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/profile' }))

// Profile: get
app.get('/profile', isUserAuthenticated, (req, res) => {
    res.render("profile", { title: `Welcome ${req.user.name}`})
})

// Logout: get
app.get('/logout', (req, res) => {
    try {
        req.logout((error) => {
            if (error) {
                return next(error);
            }
            res.redirect("/")
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
})

module.exports = app;