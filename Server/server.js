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
const lib = require('./helper')

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

// User Login Information
const UserInfo = require('./models/UserInfo')
const User = require('./models/User')
const Reservation = require('./models/Reservation')
const Preference = require('./models/preference')
const PastaPoint = require('./models/pastaPointSchema')
const InitialReservation = require('./models/initialReservation')
const HoldFee = require('./models/holdFee')

const singleTables = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]
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
    preferred_payment: 'Cash'
};
let reservation = {
    name: 'No Reservation Found',
    phone_num: 'N/A',
    email: 'N/A',
    date: 'N/A',
    time: 'N/A',
    num_guests: 'N/A',
    table_num: 'N/A',
}

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
    // req.user has 3 attributes: username, password, new_user }
    if(req.user.new_user){
        res.redirect('/editProfile')
    }
    else{
        await User.findOne({ username: req.user.username }, 'name').then(async (info) => {
            res.render('index.ejs', { name: lib.getFirstName(info.name) });
        })
        await InitialReservation.deleteMany({ username: req.user.username, didFinalize: false }).then((deleted) => {
            console.log("Deleted initial reservations(didFinalize == false)")
        });
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
        const registeredCount = await UserInfo.countDocuments({ username: req.body.inputUsername })
        if (registeredCount > 0) {
            console.log('Username already exists')
            // TODO: make register page display error if the username already exists
            res.redirect('/register');
        } else {
            // save new user info to db
            await new UserInfo ({
                username: req.body.inputUsername,
                password: hashedPassword,
                new_user: true
            }).save()
            // create and save preferences table
            const emptyArr = new Array(20).fill(0);
            await new Preference ({
                username: req.body.inputUsername,
                tables: emptyArr
            }).save()
            // create and save pasta points for new user
            await new PastaPoint({
                username: req.body.inputUsername,
                pasta_points: 0
            }).save()
            res.redirect('/login')
        }
    } catch(error) {
        console.error(error);
        res.redirect('/register')
    }
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
        const registeredCount = await UserInfo.countDocuments({ username: req.body.inputUsername })
        if (registeredCount > 0) {
            console.log('Username already exists')
            // TODO: make register page display error if the username already exists
            res.redirect('/register');
        } else {
            // save new user info to db
            await new UserInfo ({
                username: req.body.inputUsername,
                password: hashedPassword,
                new_user: true
            }).save()
            // create and save preferences table
            const emptyArr = new Array(20).fill(0);
            await new Preference ({
                username: req.body.inputUsername,
                tables: emptyArr
            }).save()
            // create and save pasta points for new user
            await new PastaPoint({
                username: req.body.inputUsername,
                pasta_points: 0
            }).save()
            res.redirect('/guestConfirmation')
        }
    } catch(error) {
        console.error(error);
        res.redirect('/guestRegister')
    }
})


// PROFILE
app.get('/profile', checkAuthenticated, async (req,res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        // find profile info using username
        const filter = { username: req.user.username };
        const profileInfo = await User.findOne(filter)
        const f_name = lib.getFirstName(profileInfo.name)
        const l_name = lib.getLastName(profileInfo.name)
        // create object with information
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
        }
        // find table preferences
        const preference = await Preference.findOne(filter)
        const preferredTable = lib.getPreferredTable(preference.tables);
        // get pasta points
        const points = await PastaPoint.findOne(filter)
        // render view
        res.render('profile.ejs', { data: information, preferredTable: preferredTable + 1, points: Math.floor(points.pasta_points)})
    }
})


// EDIT PROFILE
app.get('/editProfile', checkAuthenticated, (req, res) => {
    res.render('editProfile.ejs');
})
app.post('/editProfile', checkAuthenticated, async (req,res) => {
    const filter = { username: req.user.username };
    userInfo = {
        name: req.body.full_name,
        mail_street1: req.body.street1,
        mail_street2: req.body.street2,
        bill_street1: req.body.bill_street1,
        bill_street2: req.body.bill_street2,   
        city_mail: req.body.city,
        city_bill: req.body.bill_city,
        zip_mail: req.body.zip,
        zip_bill: req.body.bill_zip,
        state_mail: req.body.state,
        state_bill: req.body.bill_state,
        preferred_payment: req.body.paymentmethod,
        username: req.user.username
    }
    // checkbox value is 'on' or undefined
    if(req.body.bill_same == 'on'){
        userInfo.bill_street1 = userInfo.mail_street1;
        userInfo.bill_street2 = userInfo.mail_street2;
        userInfo.zip_bill = userInfo.zip_mail;
        userInfo.state_bill = userInfo.state_mail;
        userInfo.city_bill = userInfo.city_mail;
    }
    // Insert into database
    await User.updateOne(filter, {
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
        preferred_payment: userInfo.preferred_payment,
        username: userInfo.username
    }, { upsert: true });
    const update = { new_user: false }
    await UserInfo.findOneAndUpdate(filter, update)
    console.log(userInfo)
    res.redirect('/profile');
})


// bool for guestForm and userForm
let isGuest = false
// GUEST FORM
app.get('/guestForm', async (req, res) => {
    isGuest = true
    let min_date = lib.getMinDate()
    res.render('guestForm.ejs', { min_date: min_date });
})
app.post('/guestForm', async (req,res) => {
    await new InitialReservation({
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        username: 'guest',
        didFinalize: false
    }).save()
    res.redirect('/selectGuestTables');
})


// USER FORM
app.get('/userForm', checkAuthenticated, async (req, res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        let min_date = lib.getMinDate()
        res.render('userForm.ejs', { min_date: min_date });
    }
})
app.post('/userForm', checkAuthenticated, async (req,res) => {
    await new InitialReservation({
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        username: req.user.username,
        didFinalize: false
    }).save()
    res.redirect('/selectUserTables');
})


// TABLE SELECTION (Reservation page 2)
// SELECT USER TABLES
app.get('/selectUserTables', checkAuthenticated, async(req,res) => {
    if(req.user.new_user){
        res.redirect('/userForm')
    }
    var min_max = [], usedSingles = [], usedCombinations = [], usedTables = [], availableSingleTables = []
    var tablesOfEight = [], tablesOfSix = [], tablesOfFour = [], tablesOfTwo = []

    // find initial reservation
    let initialReservation = await InitialReservation.findOne({ 
        username: req.user.username
    }).sort({ _id: -1 })
    // set min_max based on number of guests
    min_max = lib.tableMinMax(initialReservation.num_guests)

    // query Reservations for single table reservations
    let singleReservations = await Reservation.find({ 
        date: initialReservation.date, 
        time: initialReservation.time, 
        table_num: { $in: singleTables }}, 
        'table_num')
    usedSingles = lib.identifyUsedSingleTables(singleReservations)

    // query Reservations for combined table reservations
    let combinedReservations = await Reservation.find({ 
        date: initialReservation.date, 
        time: initialReservation.time, 
        table_num: { $nin: singleTables }}, 
        'table_num')
    usedCombinations = lib.identifyUsedCombinedTables(combinedReservations)

    // combine usedSingles and usedCombinations
    usedTables = usedSingles.concat(usedCombinations);
    // get available single tables
    availableSingleTables = (singleTables.filter(x => !usedTables.includes(x)));

    // separate single tables by capacity
    tablesOfEight = lib.identifyTablesOfEight(availableSingleTables)
    tablesOfSix = lib.identifyTablesOfSix(availableSingleTables)
    tablesOfFour = lib.identifyTablesOfFour(availableSingleTables)
    tablesOfTwo = lib.identifyTablesOfTwo(availableSingleTables)

    // combine tables
    var tables = []
    switch(min_max[0]){
    // tables of eight combinations
    case 17:
        if(tablesOfEight.length > 0){
            tables = tablesOfEight
        } else if (tablesOfFour.length >= 2){
            tables = lib.combineFourX2(tablesOfFour)
        } else if (tablesOfSix.length >= 1 && tablesOfTwo.length >= 1){
            tables = lib.combineSixAndTwo(tablesOfSix, tablesOfTwo)
        } else if (tablesOfFour.length == 1 && tablesOfTwo.length >= 2) {
            tables = lib.combineFourAndTwoX2(tablesOfFour, tablesOfTwo)
        } else if (tablesOfTwo.length >= 4) {
            tables = lib.combineTwoX4(tablesOfTwo)
        } else {
            console.log("No possible combinations: EIGHT")
        }
        break;
    // tables of six combinations
    case 12:
        if (tablesOfSix.length > 0){
            tables = tablesOfSix
        } else if (tablesOfFour.length >= 1 && tablesOfTwo.length >= 1){
            tables = lib.combineFourAndTwo(tablesOfFour, tablesOfTwo)
        } else if (tablesOfFour.length == 0 && tablesOfTwo.length >= 3) {
            tables = lib.combineTwoX3(tablesOfTwo)
        } else {
            console.log("No possible combinations: SIX")
        }
        break;
    // tables of four combinations
    case 6:
        if (tablesOfFour.length > 0){
            tables = tablesOfFour
        } else if (tablesOfTwo.length >= 2) {
            tables = lib.combineTwoX2(tablesOfTwo)
        } else {
            console.log("No possible combinations: FOUR")
        }
        break;
    // tables of two
    default:
        if (tablesOfTwo.length > 0){
            tables = tablesOfTwo
        } else {
            console.log("No possible combinations for TWO")
        }
        break;
    }
    // if there are available seats
    if (tables.length > 0){
        res.render('selectUserTables.ejs', { availableTables: tables });
    // No available reservations, redirect user back to page 1 of reservation form
    } else {
        res.redirect('/userForm');
    }
})

app.post('/selectUserTables', checkAuthenticated, async(req,res) => {
    // find initial reservation
    const initialReservation = await InitialReservation.findOne({ username: req.user.username}).sort({ _id: -1 })
    // create new reservation
    const reservation = new Reservation({
        name: initialReservation.name,
        phone_num: initialReservation.phone_num,
        email: initialReservation.email,
        date: initialReservation.date,
        time: initialReservation.time,
        num_guests: initialReservation.num_guests,
        username: req.user.username,
        table_num: req.body.tables + ""
    })
    // save reservation to db
    reservation.save();

    // update Pasta Points
    const points = await PastaPoint.findOne({ username: req.user.username }, 'pasta_points')
    var randomNum = Math.floor(Math.random() * (25 - 10) + 10)
    const prevPastaPoints = points.pasta_points
    await PastaPoint.updateOne({ username: req.user.username }, {
        username: req.user.username,
        pasta_points: prevPastaPoints + randomNum
    });
    // update preferred diner
    await Preference.findOne({ username: req.user.username }).then(async (info) => {
        var arr = info.tables, tables = []
        // req.body.table_num: parse the string (two cases: "2" & multi "2 + 1 + 3")
        tables = lib.parseTableNum(reservation.table_num)
        // update arr[tables[i] - 1] += 1
        for (var i = 0; i < tables.length; i++){
            arr[tables[i]-1] += 1
        }
        await Preference.updateOne({ username: req.user.username }, {
            username: req.body.username,
            tables: arr
        });
    });

    // update didFinalize flag
    await InitialReservation.updateOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
        didFinalize: true
    });
    // delete initial reservation after finalizing
    await InitialReservation.deleteOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
    
    // highTraffic validations
    const highTraffic = lib.isHighTraffic(reservation.date);
    if (highTraffic) {
        res.redirect('/highTraffic');
    } else {
        res.redirect('/confirmation');
    }
})


//SELECT GUEST TABLES
app.get('/selectGuestTables', async (req, res) => {
    var min_max = [], usedSingles = [], usedCombinations = [], usedTables = [], availableSingleTables = []
    var tablesOfEight = [], tablesOfSix = [], tablesOfFour = [], tablesOfTwo = []

    // find initial reservation
    let initialReservation = await InitialReservation.findOne({ 
        username: "guest"
    }).sort({ _id: -1 })
    // set min_max based on number of guests
    min_max = lib.tableMinMax(initialReservation.num_guests)

    // query Reservations for single table reservations
    let singleReservations = await Reservation.find({ 
        date: initialReservation.date, 
        time: initialReservation.time, 
        table_num: { $in: singleTables }}, 
        'table_num')
    usedSingles = lib.identifyUsedSingleTables(singleReservations)

    // query Reservations for combined table reservations
    let combinedReservations = await Reservation.find({ 
        date: initialReservation.date, 
        time: initialReservation.time, 
        table_num: { $nin: singleTables }}, 
        'table_num')
    usedCombinations = lib.identifyUsedCombinedTables(combinedReservations)

    // combine usedSingles and usedCombinations
    usedTables = usedSingles.concat(usedCombinations);
    // get available single tables
    availableSingleTables = (singleTables.filter(x => !usedTables.includes(x)));

    // separate single tables by capacity
    tablesOfEight = lib.identifyTablesOfEight(availableSingleTables)
    tablesOfSix = lib.identifyTablesOfSix(availableSingleTables)
    tablesOfFour = lib.identifyTablesOfFour(availableSingleTables)
    tablesOfTwo = lib.identifyTablesOfTwo(availableSingleTables)

    // combine tables
    var tables = []
    switch(min_max[0]){
    // tables of eight combinations
    case 17:
        if(tablesOfEight.length > 0){
            tables = tablesOfEight
        } else if (tablesOfFour.length >= 2){
            tables = lib.combineFourX2(tablesOfFour)
        } else if (tablesOfSix.length >= 1 && tablesOfTwo.length >= 1){
            tables = lib.combineSixAndTwo(tablesOfSix, tablesOfTwo)
        } else if (tablesOfFour.length == 1 && tablesOfTwo.length >= 2) {
            tables = lib.combineFourAndTwoX2(tablesOfFour, tablesOfTwo)
        } else if (tablesOfTwo.length >= 4) {
            tables = lib.combineTwoX4(tablesOfTwo)
        } else {
            console.log("No possible combinations: EIGHT")
        }
        break;
    // tables of six combinations
    case 12:
        if (tablesOfSix.length > 0){
            tables = tablesOfSix
        } else if (tablesOfFour.length >= 1 && tablesOfTwo.length >= 1){
            tables = lib.combineFourAndTwo(tablesOfFour, tablesOfTwo)
        } else if (tablesOfFour.length == 0 && tablesOfTwo.length >= 3) {
            tables = lib.combineTwoX3(tablesOfTwo)
        } else {
            console.log("No possible combinations: SIX")
        }
        break;
    // tables of four combinations
    case 6:
        if (tablesOfFour.length > 0){
            tables = tablesOfFour
        } else if (tablesOfTwo.length >= 2) {
            tables = lib.combineTwoX2(tablesOfTwo)
        } else {
            console.log("No possible combinations: FOUR")
        }
        break;
    // tables of two
    default:
        if (tablesOfTwo.length > 0){
            tables = tablesOfTwo
        } else {
            console.log("No possible combinations for TWO")
        }
        break;
    }
    // if there are available seats
    if (tables.length > 0){
        res.render('selectGuestTables.ejs', { availableTables: tables });
    // No available reservations, redirect guest back to page 1 of reservation form
    } else {
        res.redirect('/guestForm');
    }
})
app.post('/selectGuestTables', async (req, res) => {
    // find initial reservation
    const initialReservation = await InitialReservation.findOne({ username: "guest"}).sort({ _id: -1 })
    // create new reservation
    const reservation = new Reservation({
        name: initialReservation.name,
        phone_num: initialReservation.phone_num,
        email: initialReservation.email,
        date: initialReservation.date,
        time: initialReservation.time,
        num_guests: initialReservation.num_guests,
        username: "guest",
        table_num: req.body.tables + ""
    })
    // save reservation to db
    reservation.save();

    // update didFinalize flag
    await InitialReservation.updateOne({ username: "guest", date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
        didFinalize: true
    });
    // delete initial reservation after finalizing
    await InitialReservation.deleteOne({ username: "guest", date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
    
    // highTraffic validations
    const highTraffic = lib.isHighTraffic(reservation.date);
    if (highTraffic) {
        res.redirect('/highTraffic');
    } else {
        res.redirect('/guestPreConfirm');
    }
})


// CONFIRMATION
app.get('/confirmation', checkAuthenticated, async(req, res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        // find latest reservation by the user
        const lastReservation = await Reservation.findOne({ username: req.user.username }).sort({ _id: -1 })
        // if there is no reservation (a.k.a new user w/ no reservations yet)
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
            const p_date = lib.parseDate(lastReservation.date);
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
        res.render('confirmation.ejs', { data: reservation });
    }
})


// GUEST PRE-CONFIRMATION
app.get('/guestPreConfirm', async(req, res) => {
    // find latest reservation by the guest
    const lastReservation = await Reservation.findOne({ username: 'guest' }).sort({ _id: -1 })
    // if there is no reservation (a.k.a new user w/ no reservations yet)
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
        const p_date = lib.parseDate(lastReservation.date);
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
    res.render('guestPreConfirm.ejs', { data: reservation });
})


//GUEST CONFIRMATION
app.get('/guestConfirmation', async(req, res) => {
    // find latest reservation by guest
    const lastReservation = await Reservation.findOne({ username: 'guest' }).sort({ _id: -1 })
    // if there is no reservation (a.k.a new user w/ no reservations yet)
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
        const p_date = lib.parseDate(lastReservation.date);
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
    res.render('guestConfirmation.ejs', { data: reservation });
})


// HIGH TRAFFIC - hold fee during high traffic days
app.get('/highTraffic', async (req, res) => {
    if(isGuest) {
        await Reservation.findOne({ username: 'guest' }).sort({ _id: -1 }).then((lastReservation) => {
            const parsedDate = lib.parseDate(lastReservation.date)
            res.render('highTraffic.ejs', { data: parsedDate })
        })
    } else {
        await Reservation.findOne({ username: req.user.username }).sort({ _id: -1 }).then((lastReservation) => {
            const parsedDate = lib.parseDate(lastReservation.date)
            res.render('highTraffic.ejs', { data: parsedDate })
        })
    }
})
app.post('/highTraffic', async (req, res) => {
    // save holdFee to db
    await new HoldFee({
        card_name: req.body.card_name,
        card_num: req.body.card_number,
        expiry_date: req.body.set_month + "/" + req.body.set_year,
        security_code: req.body.security_code,
        zip: req.body.zip
    }).save()
    if (isGuest) {
        isGuest = false
        res.redirect('/guestPreConfirm')
    } else {
        res.redirect('/confirmation')
    }
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
    next()
}

module.exports = {
    checkAuth: function(){
        return checkAuthenticated;
    },
    checkUsername: function(){
        return users.inputUsername;
    },
    checkPassword: function(){
        return users.inputPassword;
    },
    user: function() {
        return userInfo;
    },
    server: app.listen(3000)
    // localhost:3000
    // mongodb compass string: (change ***** to password)
    // mongodb+srv://SEAdmin:*****@se-cluster.yazhn.mongodb.net/SE_Project_Database?authSource=admin&replicaSet=atlas-skcewq-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true
}



/* DO NOT DELETE THIS - tips & tricks for callbacks


// FIRST WAY 
let promises = []
await Reservation.find({ time: "10:00", table_num: { $nin: singleTables }}, 'table_num').then((results) => {
    promises.push(results)
})
await Reservation.find({ time: "10:00", table_num: { $in: singleTables }}, 'table_num').then((results) => {
    promises.push(results)
})

Promise.all(promises).then(([a, b]) => {
    console.log("a:" + a)
    console.log("b:" + b)
})

// SECOND WAY
let a = await Reservation.find({ time: "10:00", table_num: { $nin: singleTables }}, 'table_num')
let b = await Reservation.find({ time: "10:00", table_num: { $in: singleTables }}, 'table_num')

console.log("a: " + a + "\nb: " + b)


*/
