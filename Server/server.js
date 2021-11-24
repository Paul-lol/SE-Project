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

// Preferred Diner/Table
const preferredTablesSchema = new mongoose.Schema({
    username: { type: String, required: true },
    tables: [Number]
});
const pastaPointSchema = new mongoose.Schema({
    username: { type: String, required: true },
    pasta_points: Number
});
const initialReservationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone_num: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    num_guests: { type: Number, required: true },
    username: { type: String, required: true },
    didFinalize: { type: Boolean, required: true }
});
const holdFeeSchema = new mongoose.Schema({
    card_name: { type: String, required: true },
    card_num: { type: String, required: true },
    expiry_date: { type: String, required: true },
    security_code: { type: String, required: true },
    zip: { type: Number, required: true }
})

// User Login Information
const UserInfo = require('./models/UserInfo')
const User = require('./models/User')
const Reservation = require('./models/Reservation')
const Preference = mongoose.model("Preference", preferredTablesSchema);
const PastaPoint = mongoose.model("PastaPoint", pastaPointSchema);
const InitialReservation = mongoose.model("InitialReservation", initialReservationSchema);
const HoldFee = mongoose.model("HoldFee", holdFeeSchema)

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
let initReservation = {
    name: '',
    phone_num: '',
    email: '',
    date: '01-01-2021',
    time: '00:00',
    num_guests: '0'
}
const singleTables = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]

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
        await UserInfo.countDocuments({ username: req.body.inputUsername }).then((registeredCount) =>{
            // console.log(registeredCount)
            if (registeredCount > 0) {
            console.log('Username already exists')
            // TODO: make register page display error if the username already exists
            res.redirect('/register');
            } else {
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
                const userPoints = new PastaPoint({
                    username: req.body.inputUsername,
                    pasta_points: 0
                })
                userPoints.save();
                console.log(userInfo);
                res.redirect('/login')
            }
        })
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
        await UserInfo.countDocuments({ username: req.body.inputUsername }).then((registeredCount) =>{
            // console.log(registeredCount)
            if (registeredCount > 0){
                console.log('Username already exists')
                // TODO: make guestRegister page display error if the username already exists
                res.redirect('/guestRegister');
            } else {
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
                const userPoints = new PastaPoint({
                    username: req.body.inputUsername,
                    pasta_points: 0
                })
                userPoints.save();
                console.log(userInfo);
                res.redirect('/guestConfirmation')
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
            let f_name = lib.getFirstName(profileInfo.name)
            let l_name = lib.getLastName(profileInfo.name)
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
            await Preference.findOne(filter).then(async (info) => {
                const tableArr = info.tables
                const preferredTable = lib.getPreferredTable(tableArr);
                await PastaPoint.findOne(filter).then((pointInfo) => {
                    res.render('profile.ejs', { data: information, preferredTable: preferredTable + 1, points: Math.floor(pointInfo.pasta_points) })
                })
            });
        })
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
let isGuest = false
// GUEST FORM
app.get('/guestForm', async (req, res) => {
    isGuest = true
    if (!reservationUnavailable){
        reservationMessage = "";
    } else if (reservationUnavailable){
        // Validation if the reservation is unavailable - display message in view
        reservationMessage = "The selected table, date, and time are unavailable.\nPlease select a different reservation."
        reservationUnavailable = false;
    }
    let min_date = lib.getMinDate()
    res.render('guestForm.ejs', { min_date: min_date, reservationMessage: reservationMessage});
})
app.post('/guestForm', async (req,res) => {
    const initialReservation = new InitialReservation({
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        username: 'guest',
        didFinalize: false
    })

    console.log("\nInitial Reservation: ")
    console.log(initialReservation)
    await initialReservation.save();

    reservationMessage = ""

    res.redirect('/selectGuestTables');
})


// USER FORM
app.get('/userForm', checkAuthenticated, async (req, res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        if (!reservationUnavailable){
            reservationMessage = "";
        } else if (reservationUnavailable){
            // Validation if the reservation is unavailable - display message in view
            reservationMessage = "The selected table, date, and time are unavailable.\nPlease select a different reservation."
            reservationUnavailable = false;
        }
        let min_date = lib.getMinDate()
        //res.render('fuel_quote.ejs', {user: userInfo, min_date});
        res.render('userForm.ejs', { min_date: min_date, reservationMessage: reservationMessage });
    }
})
app.post('/userForm', checkAuthenticated, async (req,res) => {
    // TODO: remove/update validation for unavailable reservation
    // await Reservation.countDocuments({ date: req.body.date_res, time: req.body.set_hr + ":" + req.body.set_min, table_num: req.body.tablenum }).then(async (count) => {
    //     // console.log("Count: " + count)
    //     if (count >= 1) {
    //         reservationUnavailable = true
    //         res.redirect('/userForm')
    //     } else {
    const initialReservation = new InitialReservation({
        name: req.body.name,
        phone_num: req.body.phone,
        email: req.body.email,
        date: req.body.date_res,
        time: req.body.set_hr + ":" + req.body.set_min,
        num_guests: req.body.guest,
        username: req.user.username,
        didFinalize: false
    })
    // console.log("\nInitial Reservation: ")
    // console.log(initialReservation)
    await initialReservation.save();
    reservationMessage = ""

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
    var combination = ""
    var tables = []
    switch(min_max[0]){
    case 17:
        if(tablesOfEight.length > 0){
            tables = tablesOfEight
        } else if (tablesOfFour.length >= 2){
            tables = tablesOfFour.flatMap((v, i) => tablesOfFour.slice(i + 1).map( w => v + ' + ' + w ))
        } else if (tablesOfSix.length >= 1 && tablesOfTwo.length >= 1){
            for (var i = 0; i < tablesOfSix.length; i++) {
                for (var j = 0; j < tablesOfTwo.length; j++) {
                    combination = tablesOfSix[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        } else if (tablesOfTwo.length >= 2 && tablesOfFour.length == 1) {
            for (var i = 0; i < tablesOfTwo.length; i++) {
                for (var j = i + 1; j < tablesOfTwo.length; j++){
                    combination = tablesOfTwo[i] + " + " + tablesOfTwo[j] + " + " + tablesOfFour[0]
                    tables.push(combination)
                }
            }
        } else if (tablesOfTwo.length >= 4) {
            if (tablesOfTwo.length == 4){
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3])
            } else {
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
            }
        } else {
            console.log("No possible combinations")
        }
        break;
    case 12:
        if (tablesOfSix.length > 0){
            tables = tablesOfSix
        } else if (tablesOfFour.length >= 1 && tablesOfTwo.length >= 1){
            for (var i = 0; i < tablesOfFour.length; i++){
                for (var j = 0; j < tablesOfTwo.length; j++){
                    combination = tablesOfFour[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        } else if (tablesOfFour.length == 0 && tablesOfTwo.length >= 3) {
            for (var i = 0; i < tablesOfTwo.length; i++){
                for (var j = i+1; j < tablesOfTwo.length; j++){
                    for (var k = j+1; k < tablesOfTwo.length; k++){
                        combination = tablesOfTwo[i] + " + " + tablesOfTwo[j] + " + " + tablesOfTwo[k]
                        tables.push(combination)
                    }
                }
            }
        } else {
            console.log("No possible combinations")
        }
        break;
    case 6:
        if (tablesOfFour.length > 0){
            tables = tablesOfFour
        } else if (tablesOfTwo.length >= 2) {
            for (var i = 0; i < tablesOfTwo.length; i++){
                for (var j = i+1; j < tablesOfTwo.length; j++){
                    combination = tablesOfTwo[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        }
        break;
    default:
        break;
    }
    console.log("available tables: " + tables)
    if (tables.length > 0){
        res.render('selectUserTables.ejs', { availableTables: tables });
    // If there are no available tables
    } else {
        // TODO: if registered user return to userForm
        // TODO: return user to guestForm if guest

        // redirect user back to beginning of reservation form
        res.redirect('/userForm');
    }
})
app.post('/selectUserTables', checkAuthenticated, async(req,res) => {
    await InitialReservation.findOne({ username: req.user.username}).sort({ _id: -1 }).then(async(initialReservation) => {
        console.log("Initial Reservation: \n" + initialReservation);
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
        // console.log(req.body.tables)
        reservation.save();
        console.log(reservation)
        await PastaPoint.findOne({ username: req.user.username }).then(async (info) => {
            // console.log(info)
            var randomNum = Math.floor(Math.random() * (25 - 10) + 10)
            const prevPastaPoints = info.pasta_points
            await PastaPoint.updateOne({ username: req.user.username }, {
                username: req.user.username,
                pasta_points: prevPastaPoints + randomNum
            });
        });
        // TODO: Change preferred tables logic to accommodate for table combinations (arrays)
        // await Preference.findOne({ username: req.user.username }).then(async (info) => {
        //     // console.log(info)
        //     var arr = info.tables
        //     arr[reservation.table_num - 1] = arr[reservation.table_num - 1] + 1
        //     const updateCount = await Preference.updateOne({ username: req.user.username }, {
        //         username: req.body.username,
        //         tables: arr
        //     });
        // });

        // TODO: change initial reservation did finalize to true
        await InitialReservation.updateOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
            didFinalize: true
        });
        // clean up initial reservation
        await InitialReservation.deleteOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
        
        const highTraffic = lib.isHighTraffic(reservation.date);
        if (highTraffic) {
            res.redirect('/highTraffic');
        } else {
            res.redirect('/confirmation');
        }
    })
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
    var combination = ""
    var tables = []
    switch(min_max[0]){
    case 17:
        if(tablesOfEight.length > 0){
            tables = tablesOfEight
        } else if (tablesOfFour.length >= 2){
            tables = tablesOfFour.flatMap((v, i) => tablesOfFour.slice(i + 1).map( w => v + ' + ' + w ))
        } else if (tablesOfSix.length >= 1 && tablesOfTwo.length >= 1){
            for (var i = 0; i < tablesOfSix.length; i++) {
                for (var j = 0; j < tablesOfTwo.length; j++) {
                    combination = tablesOfSix[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        } else if (tablesOfTwo.length >= 2 && tablesOfFour.length == 1) {
            for (var i = 0; i < tablesOfTwo.length; i++) {
                for (var j = i + 1; j < tablesOfTwo.length; j++){
                    combination = tablesOfTwo[i] + " + " + tablesOfTwo[j] + " + " + tablesOfFour[0]
                    tables.push(combination)
                }
            }
        } else if (tablesOfTwo.length >= 4) {
            if (tablesOfTwo.length == 4){
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3])
            } else {
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[0] + " + " + tablesOfTwo[1] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
                tables.push(tablesOfTwo[1] + " + " + tablesOfTwo[2] + " + " + tablesOfTwo[3] + " + " + tablesOfTwo[4])
            }
        } else {
            console.log("No possible combinations")
        }
        break;
    case 12:
        if (tablesOfSix.length > 0){
            tables = tablesOfSix
        } else if (tablesOfFour.length >= 1 && tablesOfTwo.length >= 1){
            for (var i = 0; i < tablesOfFour.length; i++){
                for (var j = 0; j < tablesOfTwo.length; j++){
                    combination = tablesOfFour[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        } else if (tablesOfFour.length == 0 && tablesOfTwo.length >= 3) {
            for (var i = 0; i < tablesOfTwo.length; i++){
                for (var j = i+1; j < tablesOfTwo.length; j++){
                    for (var k = j+1; k < tablesOfTwo.length; k++){
                        combination = tablesOfTwo[i] + " + " + tablesOfTwo[j] + " + " + tablesOfTwo[k]
                        tables.push(combination)
                    }
                }
            }
        } else {
            console.log("No possible combinations")
        }
        break;
    case 6:
        if (tablesOfFour.length > 0){
            tables = tablesOfFour
        } else if (tablesOfTwo.length >= 2) {
            for (var i = 0; i < tablesOfTwo.length; i++){
                for (var j = i+1; j < tablesOfTwo.length; j++){
                    combination = tablesOfTwo[i] + " + " + tablesOfTwo[j]
                    tables.push(combination)
                }
            }
        }
        break;
    default:
        break;
    }
    console.log("available tables: " + tables)
    if (tables.length > 0){
        res.render('selectGuestTables.ejs', { availableTables: tables });
    // If there are no available tables
    } else {
        // TODO: if registered user return to userForm
        // TODO: return user to guestForm if guest

        // redirect user back to beginning of reservation form
        res.redirect('/guestForm');
    }
})
app.post('/selectGuestTables', async (req, res) => {
    await InitialReservation.findOne({ username: 'guest'}).sort({ _id: -1 }).then(async(initialReservation) => {
        console.log("Initial Reservation: \n" + initialReservation);
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
        // console.log(req.body.tables)
        reservation.save();
        // console.log(reservation)

        // TODO: change initial reservation did finalize to true
        await InitialReservation.updateOne({ username: 'guest', date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
            didFinalize: true
        });
        // clean up initial reservation
        await InitialReservation.deleteOne({ username: 'guest', date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
        
        const highTraffic = lib.isHighTraffic(reservation.date);
        if (highTraffic) {
            res.redirect('/highTraffic');
        } else {
            res.redirect('/guestPreConfirm');
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
    })
    res.render('guestPreConfirm.ejs', { data: reservation });
})


//GUEST CONFIRMATION
app.get('/guestConfirmation', async(req, res) => {
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
    })
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
    const holdFee = new HoldFee({
        card_name: req.body.card_name,
        card_num: req.body.card_number,
        expiry_date: req.body.set_month + "/" + req.body.set_year,
        security_code: req.body.security_code,
        zip: req.body.zip
    })
    holdFee.save()

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
    checkHist: function(){
        return hist;
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
