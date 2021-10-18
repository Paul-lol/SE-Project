if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const mongoose = require('mongoose')
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

// Connect to MongoDB Database with Mongoose
mongoose.connect('mongodb+srv://SEAdmin:SEAdmin@se-cluster.yazhn.mongodb.net/SE_Project_Database?retryWrites=true&w=majority').then(result => {
    console.log('Connected to Database!');
}).catch(err => console.log(err));

// User Profile Information
const userSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    mail_street1: { type: String, required: true },
    mail_street2: String,
    bill_street1: { type: String, required: true },
    bill_street2: String,
    city: { type: String, required: true }, 
    zip: { type: Number, required: true },
    state: { type: String, required: true },
    points: { type: Number, required: true },
    preferred_payment: { type: String, required: true },
    username: { type: String, required: true }
});
// User Reservation Information
const reservationSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    phone_num: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    num_guests: { type: Number, required: true },
    table_num: { type: Number, required: true },
    username: { type: String, required: true }
});
// User Login Information
const UserInfo = require('./models/UserInfo')
const User = mongoose.model("User", userSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);

const users = []
const hist = []
let userInfo = {
    name: '',
    mail_street1: '',
    mail_street2: '',
    bill_street1: '',
    bill_street2: '',
    city: '',
    zip: '',
    state: '',
    points: 0,
    preferred_payment: 'Cash'
};
// TODO - CHANGE TO FIT RESERVATIONS SCHEMA
// function Reservation_(gallons, d_address, d_date, price_per) { 
//     this.gallons = gallons; 
//     this.d_address = d_address;
//     this.d_date = d_date;
//     this.price_per = price_per;
//     this.total = gallons * price_per;
// }
let reservation = {
    name: '',
    phone_num: '',
    email: '',
    date: '01-01-2021',
    time: '00:00',
    num_guests: '0',
    table_num: '0'
};


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
app.get('/', checkAuthenticated, async (req, res) => {
    const filter = { username: req.user.username }
    //console.log(filter)
    if(req.user.new_user){
        ///////// BEGIN - THIS CODE should be in edit profile (in case user never finishes profile registration)
        const update = { new_user: false }
        await UserInfo.findOneAndUpdate(filter, update)
        //////// END
        res.redirect('/editProfile')
    }
    else{
        //console.log(filter)
        await UserInfo.find(filter).then(async (info) => {
            //console.log(info);
            // TO-DO
            // userInfo = { 
            //     full_name: info[0].full_name[0] + " " + info[0].full_name[1],
            //     street1: info[0].street1,
            //     street2: info[0].street2,
            //     state: info[0].state,
            //     city: info[0].city,
            //     zip: info[0].zip
            // };
        })
        res.render('index.ejs', {name: req.user.username});
    }
    //res.render('index.ejs', {name: req.user.username});
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
      await UserInfo.find({ username: req.body.inputUsername }).then((users) =>{
        if (users.length > 0){
            // console.log(users.length);
            //users.splice(0, users.length);
            res.redirect('/register');
        } else{
            const userInfo = new UserInfo ({
                username: req.body.inputUsername,
                password: hashedPassword,
                new_user: true
            })
            userInfo.save();
            console.log(userInfo);
            res.redirect('/login')
        }
    })
    } catch(error) {
        console.error(error);
        res.redirect('/register')
    }
})

// PROFILE
app.get('/profile', checkAuthenticated, (req,res) => {
    res.render('profile.ejs', {full_name: userInfo.full_name, 
    street1: userInfo.street1, 
    street2: userInfo.street2,
    state: userInfo.state,
    city: userInfo.city,
    zip: userInfo.zip});
})

// EDIT PROFILE
app.get('/editProfile', checkAuthenticated, (req, res) => {
    res.render('editProfile.ejs');
})

// POST PROFILE INFO
app.post('/editProfile', checkAuthenticated, async (req,res) => {
    // console.log(req.body);
    const filter = { username: req.user.username };
    userInfo = {
        name: req.body.full_name[0] + " " + req.body.full_name[1],
        mail_street1: req.body.street1,
        mail_street2: req.body.street2,
        bill_street1: '',
        bill_street2: '',   
        city: req.body.city,
        zip: req.body.zip,
        state: req.body.state,
        // TODO - DONT UPDATE POINTS, KEEP THE SAME
        // Fetch points beforehand first from database then set points to that before updating in database
        points: 9999,
        preferred_payment: req.body.paymentmethod,
        username: req.user.username
    }
    // checkbox value is 'on' or undefined
    // console.log(req.body.bill_same)
    if(req.body.bill_same == 'on'){
        userInfo.bill_street1 = userInfo.mail_street1;
        userInfo.bill_street2 = userInfo.mail_street2;
    }
    // Insert into database
    const user = await User.updateOne(filter, {
        name: userInfo.name,
        mail_street1: userInfo.mail_street1,
        mail_street2: userInfo.mail_street2,
        bill_street1: userInfo.bill_street1,
        bill_street2: userInfo.bill_street2,
        city: userInfo.city,
        zip: userInfo.zip,
        state: userInfo.state,
        points: userInfo.points,
        preferred_payment: userInfo.preferred_payment,
        username: userInfo.username
    }, { upsert: true });
    console.log(userInfo)
    res.redirect('/profile');
})

// GUEST FORM
app.get('/guestForm', async (req, res) => {
    let min_date = getMinDate()
    res.render('guestForm.ejs', {user: userInfo, min_date});
})
app.post('/guestForm', async (req,res) => {
    reservation = {
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.time,
        num_guests: req.body.guest,
        table_num: req.body.tablenum
    }
    const newReservation = new Reservation({
        name: reservation.name,
        phone_num: reservation.phone_num,
        email: reservation.email,
        date: reservation.date,
        time: reservation.time,
        num_guests: reservation.num_guests,
        table_num: reservation.table_num,
        username: "guest"
    })
    console.log("\nGuest Reservation")
    console.log(reservation)
    await newReservation.save();
    res.redirect('/guestPreConfirm')
})

// USER FORM
app.get('/userForm', checkAuthenticated, async (req, res) => {
    let min_date = getMinDate()
    //res.render('fuel_quote.ejs', {user: userInfo, min_date});
    res.render('userForm.ejs', {user: userInfo, min_date});
})
app.post('/userForm', checkAuthenticated, async (req,res) => {
    reservation = {
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.time,
        num_guests: req.body.guest,
        table_num: req.body.tablenum
    }
    const newReservation = new Reservation({
        name: reservation.name,
        phone_num: reservation.phone_num,
        email: reservation.email,
        date: reservation.date,
        time: reservation.time,
        num_guests: reservation.num_guests,
        table_num: reservation.table_num,
        username: req.user.username
    })
    console.log("\nUser Reservation")
    console.log(reservation)
    await newReservation.save();
    res.redirect('/confirmation');
})

// CONFIRMATION
app.get('/confirmation', checkAuthenticated, async(req, res) => {
    await Reservation.findOne({ username: req.user.username }).sort({ _id: -1 }).then((lastReservation) => {
        const p_date = parseDate(lastReservation.date);
        reservation = {
            name: lastReservation.name,
            phone_num: lastReservation.phone_num,
            email: lastReservation.email,
            date: p_date,
            time: lastReservation.time,
            num_guests: lastReservation.num_guests,
            table_num: lastReservation.table_num,
        }
    })
    // console.log("\napp.get('/confirmation') reservation")
    // console.log(reservation);
    res.render('confirmation.ejs', { data: reservation });
})
// GUEST CONFIRMATION
app.get('/guestPreConfirm', async(req, res) => {
    await Reservation.findOne({ username: 'guest' }).sort({ _id: -1 }).then((lastReservation) => {
        const p_date = parseDate(lastReservation.date);
        reservation = {
            name: lastReservation.name,
            phone_num: lastReservation.phone_num,
            email: lastReservation.email,
            date: p_date,
            time: lastReservation.time,
            num_guests: lastReservation.num_guests,
            table_num: lastReservation.table_num,
        }
    })
    console.log("\napp.get('/guestPreconfirmation') reservation")
    console.log(reservation);
    res.render('guestPreConfirm.ejs', { data: reservation });
})

// LOGOUT
app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})
app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})





function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next()}
    res.redirect('/login')}
function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/')}
    next()}

// MINIMUM DATE
function getMinDate(){
    let currentDate = new Date();
    let cDay = currentDate.getDate()
    let cMonth = currentDate.getMonth() + 1
    let cYear = currentDate.getFullYear()
    let min_date = cYear + '-' + cMonth + '-' + cDay
    if(cMonth < 10){
        min_date = cYear + '-0' + cMonth
        if(cDay < 10){
            min_date = min_date + '-0' + cDay
        } else{
            min_date = min_date + '-' + cDay
        }
    } else{
        min_date = cYear + '-' + cMonth
        if(cDay < 10){
            min_date = min_date + '-0' + cDay
        } else{
            min_date = min_date + '-' + cDay
        }
    }
    return min_date;
}

// PARSE DATE
// Notes: getMonth() start from 0
//        getDay() -> The value returned by getDay is an integer corresponding to the day of the week: 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on.
//        use getDate to return the day date
function parseDate(isoDate){
    var date = new Date(isoDate);
    console.log("day: " + date.getDate());
    var parsedDate = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getDate();
    console.log("\nparsedDate: " + parsedDate);
    return parsedDate;
}

app.listen(3000)