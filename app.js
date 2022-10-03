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
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },

    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const fileName = file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") + "-" + Date.now();
        cb(null, fileName + fileExt);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000 * 1000 // filesize in kb
    },
    fileFilter: (req, file, cb) => {
        (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") ?
            cb(null, true) :
            cb({ message: "Only png,jpg and jpeg files are allowed" })
    }
})

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
    try {
        const userInfo = User.findOne({ email: req.user.email });
    } catch (error) {

    }
    res.render("profile", { title: `Welcome ${req.user.name}`, pageName: 'profile' })
})

// Profile: post
app.post('/profile', upload.single('imageUpload'), async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const userUpdate = await User.updateOne(
            { email: req.user.email },
            {
                $set: {
                    profilePic: req.file.path
                }
            },
            );
            console.log("user info: ",user)
        console.log("Data update testing: ", userUpdate);
        res.status(200).redirect('/profile');
    } catch (error) {
        // res.status(500).send("File not uploaded").redirect('/profile')
        res.status(500).send(error).redirect('/profile')
    }
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