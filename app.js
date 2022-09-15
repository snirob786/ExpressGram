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
const redis = require('redis');
const connectRedis = require('connect-redis');
const RedisStore = connectRedis(session);

//Configure redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379,
    legacyMode: true
});
redisClient.connect().catch(console.error)
redisClient.on('error', (err) => {
    console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', (err) => {
    console.log('Connected to redis successfully');
});
app.set("view engine", "ejs");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('trust proxy', 1) // trust first proxy

app.use(session({
    secret: 'expressgramRedis',
    resave: false,
    saveUninitialized: true,
    store: new RedisStore({ client: redisClient }),
    cookie: {
        secure: false, //if true then need https
        httpOnly: true, // if true prevents client site from accessing
        maxAge: 1000 * 60 //session time in milliseconds
    }
}))

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
    console.log(req.session);
    res.render("index", { title: "Express Gram Homepage", pageName: 'home' })
})

// Register: get
app.get('/register', isLoggedIn, (req, res) => {
    res.render("register", { title: "Express Gram Register", pageName: 'register' })
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
    res.render("login", { title: "Express Gram Login", pageName: 'login' })
})

// Login: post
app.post('/login', passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/profile' }))

// Profile: get
app.get('/profile', isUserAuthenticated, (req, res) => {
    res.render("profile", { title: `Welcome ${req.user.name}`, pageName: 'profile' })
})

// Profile: post
app.post('/profile', (req, res) => {
    console.log("profile page")
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