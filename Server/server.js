if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    inputUsername  => users.find(user => user.inputUsername  === inputUsername ),
    id => users.find(user => user.id === id)
)

const users = []


app.use(express.static('public'));
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// HOME PAGE
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.inputUsername })
})

// LOGIN
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

// REGISTER
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.inputPassword, 10) 
      users.push({
          id: Date.now().toString(),
          inputUsername : req.body.inputUsername,
          inputPassword : hashedPassword
      })
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }

})

// GUEST FORM
app.get('/guestForm', (req, res) => {
    res.render('guestForm.ejs')
})

app.post('/guestForm', (req,res) => {
    //console.log(req.user.username);
    // const filter = { username: req.user.username }
    // if(req.user.first_time){
    //     const update = { first_time: false }
    //     await UserInfo.findOneAndUpdate(filter, update)
    // }
    // let fuel = new Fuel_quote(req.body.gallons_requested,
    //     req.body.delivery_address,
    //     req.body.delivery_date,
    //     req.body.price_per_gallon, 
    //     req.body.total_due);
    // const fuelQuote = new FuelQuote({
    //     gallons: fuel.gallons,
    //     delivery_address: fuel.d_address,
    //     delivery_date: fuel.d_date,
    //     price_per: fuel.price_per,
    //     total: fuel.total,
    //     username: req.user.username
    // })
    // await fuelQuote.save();
    res.redirect('/guestPreConfirm')
})

// GUEST CONFIRMATION
app.get('/guestPreConfirm', (req, res) => {
    res.render('guestPreConfirm.ejs')
})

// USER FORM
app.get('/userForm', checkAuthenticated, async (req, res) => {
    res.render('userForm.ejs')
})

app.post('/userForm', checkAuthenticated, async (req,res) => {
    res.redirect('/confirmation')
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

// CONFIRMATION
app.get('/confirmation', checkAuthenticated, async(req, res) => {
    res.render('confirmation.ejs')
})

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

app.listen(3000)