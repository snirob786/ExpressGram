const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require("../models/user.model");

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
    async (username, password, done) => {
        try {
            const user = await User.findOne({ email: username });
            if (!user) { return done(null, false, {message: "Incorrect Email address"}); }

            if(!bcrypt.compare(password, user.password)){ return done(null, false, {message: "Incorrect Password"}); }
            return done(null, user);
        } catch (error) {
            return done(err);
        }
    }
));


// Serialize user
passport.serializeUser((user, done)=>{
    done(null, user.id);
})


// Find session info user session id

passport.deserializeUser(async (id, done) =>{
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, false);
    }
})