const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt')

const initialize = (passport, getUserByEmail) => {
    const authenticateuser = async (email, password, done) => {
        const user = getUserByEmail(email)
        if (user == null) {
            return done(null, false, { message: "No user with the email" })
        }

        try {
            if (await bcrypt.compare(passport, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: "Passowrd Missmatch" })
            }
        } catch (e) {
            return done(null, false, { message: e })
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateuser))
    passport.serializeUser((user, done) => { 
       return done(null, user.id)
    })
    passport.deserializeUser((id, done) => { 
        returndone(null, getUserById(id))
    })
}

module.exports = initialize;