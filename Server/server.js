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
    city_mail: { type: String, required: true },
    city_bill: { type: String, required: true }, 
    zip_mail: { type: Number, required: true },
    zip_bill: { type: Number, required: true },
    state_mail: { type: String, required: true },
    state_bill: { type: String, required: true },
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
// Preferred Diner/Table
const preferredTablesSchema = new mongoose.Schema({
    username: { type: String, required: true },
    tables: [Number]
});
// User Login Information
const UserInfo = require('./models/UserInfo')
const User = mongoose.model("User", userSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);
const Preference = mongoose.model("Preference", preferredTablesSchema);

const users = []
let userInfo = {
    name: '',
    mail_street1: '',
    mail_street2: '',
    bill_street1: '',
    bill_street2: '',
    city_mail: '',
    city_bill: '',
    zip_mail: '',
    zip_bill: '',
    state_mail: '',
    state_bill: '',
    points: 0,
    preferred_payment: 'Cash'
};
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
    // req.user = { username, password, new_user }
    if(req.user.new_user){
        res.redirect('/editProfile')
    }
    else{
        // Say "Welcome, NAME" instead of "Welcome, username"
        await User.findOne({ username: req.user.username }, 'name').then(async (info) => {
            // console.log("First Name: " + getFirstName(info.name))
            // userInfo = { 
            //     full_name: info[0].full_name[0] + " " + info[0].full_name[1],
            //     street1: info[0].street1,
            //     street2: info[0].street2,
            //     state: info[0].state,
            //     city: info[0].city,
            //     zip: info[0].zip
            // };
            res.render('index.ejs', { name: getFirstName(info.name) });
        })
    }
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
            console.log('Username already exists')
            res.redirect('/register');
        } else{
            const userInfo = new UserInfo ({
                username: req.body.inputUsername,
                password: hashedPassword,
                new_user: true
            })
            userInfo.save();
            const emptyArr = new Array(20).fill(0);
            const userTables = new Preference ({
                username: req.body.inputUsername,
                tables: emptyArr
            })
            userTables.save();
            console.log(userInfo);
            res.redirect('/login')
        }
    })
    } catch(error) {
        console.error(error);
        res.redirect('/register')
    }
})

//VIEW TABLES
app.get('/viewTables', (req, res) => {
    res.render('viewTables.ejs')
})

// GUEST REGISTER 
app.get('/guestRegister', checkNotAuthenticated, (req, res) => {
    res.render('guestRegister.ejs')
})
app.post('/guestRegister', checkNotAuthenticated, async (req, res) => {
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
              console.log('Username already exists')
              res.redirect('/guestRegister');
          } else{
              const userInfo = new UserInfo ({
                  username: req.body.inputUsername,
                  password: hashedPassword,
                  new_user: true 
              })
              userInfo.save();
              console.log(userInfo);
              //TODO: Redirect guestPreConfirm to guestConfirm
              res.redirect('/guestPreConfirm')
          }
      })
      } catch(error) {
          console.error(error);
          res.redirect('/guestRegister')
      }
})
// }, passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/login',
//     failureFlash: true
// }))

// PROFILE
app.get('/profile', checkAuthenticated, async (req,res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        const filter = { username: req.user.username };
        await User.findOne(filter).then(async (profileInfo) => {
            let f_name = getFirstName(profileInfo.name)
            let l_name = getLastName(profileInfo.name)
            var information = {
                first_name: f_name,
                last_name: l_name,
                mailing_address: profileInfo.mail_street1 + " " + profileInfo.mail_street2,
                billing_address: profileInfo.bill_street1 + " " + profileInfo.bill_street2,
                city_mailing: profileInfo.city_mail,
                city_billing: profileInfo.city_bill,
                zip_mailing: profileInfo.zip_mail,
                zip_billing: profileInfo.zip_bill,
                state_mailing: profileInfo.state_mail,
                state_billing: profileInfo.state_bill,
                preferred_payment: profileInfo.preferred_payment,

                // TODO - FIX POINTS
                points: profileInfo.points
            }
            // console.log("\nInformation: ")
            // console.log(information)
            await Preference.findOne(filter).then((info) => {
                const tableArr = info.tables
                const preferredTable = getPreferredTable(tableArr);
                res.render('profile.ejs', { data: information, preferredTable: preferredTable })
            });
        })
    }
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
        city_mail: req.body.city,
        city_bill: '',
        zip_mail: req.body.zip,
        zip_bill: '',
        state_mail: req.body.state,
        state_bill: '',
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
        userInfo.zip_bill = userInfo.zip_mail;
        userInfo.state_bill = userInfo.state_mail;
        userInfo.city_bill = userInfo.city_mail;
    }
    // Insert into database
    const user = await User.updateOne(filter, {
        name: userInfo.name,
        mail_street1: userInfo.mail_street1,
        mail_street2: userInfo.mail_street2,
        bill_street1: userInfo.bill_street1,
        bill_street2: userInfo.bill_street2,
        city_mail: userInfo.city_mail,
        city_bill: userInfo.city_bill,
        zip_mail: userInfo.zip_mail,
        zip_bill: userInfo.zip_bill,
        state_mail: userInfo.state_mail,
        state_bill: userInfo.state_bill,
        points: userInfo.points,
        preferred_payment: userInfo.preferred_payment,
        username: userInfo.username
    }, { upsert: true });
    const update = { new_user: false }
    await UserInfo.findOneAndUpdate(filter, update)
    console.log(userInfo)
    res.redirect('/profile');
})

// bool for guestForm and userForm
let reservationMessage = ""
let reservationUnavailable = false
// GUEST FORM
app.get('/guestForm', async (req, res) => {
    if (!reservationUnavailable){
        reservationMessage = "";
    } else if (reservationUnavailable){
        // TODO: Insert validations here if the reservation is unavailable - display message in view
        reservationMessage = "The selected table, date, and time are unavailable.\nPlease select a different reservation."
        reservationUnavailable = false;
    }
    let min_date = getMinDate()
    res.render('guestForm.ejs', { min_date: min_date, reservationMessage: reservationMessage});
})
app.post('/guestForm', async (req,res) => {
    reservation = {
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        table_num: req.body.tablenum
    }
    await Reservation.countDocuments({ date: reservation.date, time: reservation.time, table_num: reservation.table_num }).then(async (count) => {
        // console.log("Count: " + count)
        if (count >= 1) {
            reservationUnavailable = true
            res.redirect('/guestForm')
        } else {
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
            console.log("\nnewReservation")
            console.log(newReservation)
            const highTraffic = isHighTraffic(newReservation.date);
            await newReservation.save();
            reservationMessage = ""
            res.redirect('/guestPreConfirm');
        }
    })
})

// USER FORM
app.get('/userForm', checkAuthenticated, async (req, res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        if (!reservationUnavailable){
            reservationMessage = "";
        } else if (reservationUnavailable){
            // TODO: Insert validations here if the reservation is unavailable - display message in view
            reservationMessage = "The selected table, date, and time are unavailable.\nPlease select a different reservation."
            reservationUnavailable = false;
        }
        let min_date = getMinDate()
        //res.render('fuel_quote.ejs', {user: userInfo, min_date});
        res.render('userForm.ejs', { min_date: min_date, reservationMessage: reservationMessage });
    }
})
// possible solution: when reservation slot is already taken, redirect/refresh userForm page and show a message.
//                    use local global boolean to set a flag (reservationUnavailable initially set to false) 
//                    to be used in .get(/userform) to check before displaying error message
//                    On redirection, change flag back to false as user attempts to find another available reservation
//                    Maybe prepopulate fields with previous information
app.post('/userForm', checkAuthenticated, async (req,res) => {
    reservation = {
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        table_num: req.body.tablenum
    }
    await Preference.findOne({ username: req.user.username }).then(async (info) => {
        console.log(info)
        var arr = info.tables
        arr[reservation.table_num - 1] = arr[reservation.table_num - 1] + 1
        const updateCount = await Preference.updateOne({ username: req.user.username }, {
            username: req.body.username,
            tables: arr
        });
    });
    await Reservation.countDocuments({ date: reservation.date, time: reservation.time, table_num: reservation.table_num }).then(async (count) => {
        // console.log("Count: " + count)
        if (count >= 1) {
            reservationUnavailable = true
            res.redirect('/userForm')
        } else {
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
            console.log("\nnewReservation")
            console.log(newReservation)
            const highTraffic = isHighTraffic(newReservation.date);
            await newReservation.save();
            reservationMessage = ""
            res.redirect('/confirmation');
        }
    })
})

// CONFIRMATION
app.get('/confirmation', checkAuthenticated, async(req, res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        await Reservation.findOne({ username: req.user.username }).sort({ _id: -1 }).then((lastReservation) => {
            // console.log("\nLatest Reservation")
            // console.log(lastReservation)
            if(lastReservation == null){
                reservation = {
                    name: 'No Reservation Found',
                    phone_num: 'N/A',
                    email: 'N/A',
                    date: 'N/A',
                    time: 'N/A',
                    num_guests: 'N/A',
                    table_num: 'N/A',
                }
            } else {
                const p_date = parseDate(lastReservation.date);
                reservation = {
                    name: lastReservation.name,
                    phone_num: lastReservation.phone_num,
                    email: lastReservation.email,
                    date: p_date,
                    time: lastReservation.time,
                    num_guests: lastReservation.num_guests,
                    table_num: lastReservation.table_num
                }
            }
        })
        res.render('confirmation.ejs', { data: reservation });
    }
})

// GUEST PRE-CONFIRMATION
app.get('/guestPreConfirm', async(req, res) => {
    // guest1234 
    await Reservation.findOne({ username: 'guest' }).sort({ _id: -1 }).then((lastReservation) => {
        console.log("\nLatest Reservation")
        console.log(lastReservation)
        if(lastReservation == null){
            reservation = {
                name: 'No Reservation Found',
                phone_num: 'N/A',
                email: 'N/A',
                date: 'N/A',
                time: 'N/A',
                num_guests: 'N/A',
                table_num: 'N/A',
            }
        } else {
            const p_date = parseDate(lastReservation.date);
            reservation = {
                name: lastReservation.name,
                phone_num: lastReservation.phone_num,
                email: lastReservation.email,
                date: p_date,
                time: lastReservation.time,
                num_guests: lastReservation.num_guests,
                table_num: lastReservation.table_num
            }
        }
    })
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

// PARSE DATE - 
// Notes: getMonth() start from 0
//        getDay() -> The value returned by getDay is an integer corresponding to the day of the week: 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on.
//        use getDate to return the day date
function parseDate(isoDate){
    var date = new Date(isoDate);
    var parsedDate = (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + "-" + date.getUTCFullYear();
    if (parsedDate.length == 8) {
        parsedDate = "0" + (date.getUTCMonth() + 1) + "-0" + date.getUTCDate() + "-" + date.getUTCFullYear();
    } else if (parsedDate.length == 9){
        const arr = parsedDate.split("-");
        if (arr[0].length == 1){
            parsedDate = "0" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + "-" + date.getUTCFullYear();
        } else {
            parsedDate = (date.getUTCMonth() + 1) + "-0" + date.getUTCDate() + "-" + date.getUTCFullYear();
        }
    }
    return parsedDate
}

// PARSE FIRST NAME
function getFirstName(full_name){
    const nameArr = full_name.split(" ");
    var first_name = nameArr[0];
    for (var i = 1; i < nameArr.length - 2; i++){
        first_name = first_name + " " + nameArr[i]
    }
    // console.log("first name: " + first_name);
    return first_name;
}
// PARSE LAST NAME
function getLastName(full_name){
    const nameArr = full_name.split(" ");
    const last_name = nameArr[nameArr.length - 1];
    // console.log("last name: " + last_name);
    return last_name;
}

// HIGH TRAFFIC DAY? Assumption: Weekends and Holidays and Observances are 'High Traffic Days'
const highTrafficDays = ["1-1", "2-14", "5-8", "5-31", "6-20", "7-4", "9-6", "9-11", "11-11", "11-25", "12-25"]
function isHighTraffic(date){
    const month_and_day = (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
    if(date.getUTCDay() == 6 || date.getUTCDay() == 0){
        return true
    } else {
        if (highTrafficDays.indexOf(month_and_day) >= 0){
            return true
        }
        return false
    }
}
// Holidays and Observances in United States in 2021
// Date	 	Name
// 01-01	New Year's Day
// 02-14    Valentine's
// 05-08    Mother's Day
// 05-31	Memorial Day
// 06-20    Father's Day 2021
// 07-04	Independence Day
// 09-06	Labor Day	
// 09-11    9/11 Memorial	  	 
// 11-11	Veterans Day
// 11-25	Thanksgiving Day	 	 
// 12-25	Christmas Day	

function getPreferredTable(arr){
    var maxTable = Math.max(...arr)
    return arr.indexOf(maxTable)
}

app.listen(3000);
