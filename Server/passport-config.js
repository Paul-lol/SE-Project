const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const UserInfo = require('./models/UserInfo')

function initialize(passport){
    passport.use(
        new LocalStrategy({usernameField: 'username' }, (inputUsername, inputPassword, done) => {
            UserInfo.findOne({username: inputUsername})
                .then(user => {
                    if(!user) { 
                        return done(null, false, { message: 'User does not exist' })
                    }

                    // Match Password 
                    bcrypt.compare(inputPassword, user.password, (err, isMatch) => {
                        if(err) throw err; 

                        if(isMatch) { 
                            return done(null, user); 
                        }
                        else { 
                            return done(null, false, {message: 'Password is incorrect'})
                        }
                    });
                })
                .catch(err=> console.log(err));
        })
    )
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser((id, done) => {
        UserInfo.findById(id, function(err, user) {
        return done(err, user)
        })
    })
}

module.exports = initialize