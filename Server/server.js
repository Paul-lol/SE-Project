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
            console.log("Deleted initial reservations(didFinalize == false): " + deleted)
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
            // console.log("\nInformation: ")
            // console.log(information)
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

    console.log("\nInitial Reservation: ")
    console.log(initialReservation)
    await initialReservation.save();

    reservationMessage = ""

    res.redirect('/selectUserTables');
})


/*
Tables of 2: 1, 2, 3, 4, 5
Tables of 4: 6, 7, 8, 9, 10, 11
Tables of 6: 12, 13, 14, 15, 16
Tables of 8: 17, 18, 19, 20
*/
/* let initReservation = {
    name: '',
    phone_num: '',
    email: '',
    date: '01-01-2021',
    time: '00:00',
    num_guests: '0'
} */
// TABLE SELECTION (Reservation page 2)
// SELECT USER TABLES
function combineTablesForSix(){}
function combineTablesForFour(){}
app.get('/selectUserTables', checkAuthenticated, async(req,res) => {
    if(req.user.new_user){
        res.redirect('/editProfile')
    } else {
        var min_max = []
        var availableTables = []
        await InitialReservation.findOne({ username: req.user.username}).sort({ _id: -1 }).then(async(startReservation) => {
            console.log("Initial Reservation Information: ")
            console.log(startReservation)
            initReservation = {
                name: startReservation.name,
                phone_num: startReservation.phone_num,
                date: startReservation.date,
                time: startReservation.time,
                num_guests: startReservation.num_guests
            }
            min_max = lib.tableMinMax(initReservation.num_guests)
            console.log(min_max)
            // find reservations within table_num range on same date and time
            await Reservation.find({ date: initReservation.date, time: initReservation.time, table_num: { $gte: min_max[0], $lte: min_max[1]}}).then(async (results) => {
                console.log("Reservations: " + results)
                availableTables = lib.identifyAvailableSingleTables(results, min_max)
                console.log("Available tables:\n" + availableTables)
                // if there are available non-combined tables
                if (availableTables.length > 0) {

                // ELSE, COMBINE TABLES
                } else {
                    switch (min_max[0]){
                        case 17:
                            var result = []
                            // find tables of 4
                            await Reservation.find({ date: initReservation.date, time: initReservation.time, table_num: { $gte: 6, $lte: 11}}).then(async (reservedTablesOfFour) => {

                                var availableTablesOfFour = lib.identifyAvailableSingleTables(reservedTablesOfFour, [6, 11]);
                                console.log("availableTablesOfFour: " + availableTablesOfFour)
                                var tables = []
                                var tableOfFour = 0
                                var combination = ""

                                if (availableTablesOfFour.length == 1){
                                    tableOfFour = availableTablesOfFour[0];
                                }
                                if (availableTablesOfFour.length >= 2){
                                    result = availableTablesOfFour.flatMap(
                                        (v, i) => availableTablesOfFour.slice(i + 1).map( w => v + ' + ' + w )
                                    );
                                    console.log("4Table + 4Table: " + result)
                                    availableTables = result

                                } else if (availableTablesOfFour.length == 0){

                                    // find tables of 6 VVV
                                    await Reservation.find({ date: initReservation.date, time: initReservation.time, table_num: { $gte: 12, $lte: 16}}).then(async (reservedTablesOfSix) => {
                                        var availableTablesOfSix = lib.identifyAvailableSingleTables(reservedTablesOfSix, [12, 16])

                                        // find tables of 2  VVV
                                        await Reservation.find({ date: initReservation.date, time: initReservation.time, table_num: { $gte: 1, $lte: 5}}).then(async (reservedTablesOfTwo) => {
                                            var availableTablesOfTwo = lib.identifyAvailableSingleTables(reservedTablesOfTwo, [1, 5])

                                            // if availableTablesOfTwo == 0, there are no possible combinations left for party of 8
                                            if (availableTablesOfTwo.length == 0){
                                                console.log("No possible combinations left")
                                                // no possible combinations for table for eight left
                                                // delete initial reservation and redirect user back to reservation form page 1 to select another time and date
                                                res.redirect('/userForm');
                                            // else if availableTablesOfSix >= 1, combine table of 6 + 2
                                            } else if (availableTablesOfSix.length >= 1){
                                                for (var i = 0; i < availableTablesOfSix.length; i++) {
                                                    for (var j = 0; j < availableTablesOfTwo.length; i++) {
                                                        combination = availableTablesOfSix[i] + " + " + availableTablesOfTwo[j]
                                                        tables.push(combination)
                                                        console.log("Table6 + Table2: " + tables)
                                                    }
                                                }
                                                availableTables = tables
                                                res.render('selectUserTables.ejs', { availableTables: availableTables })

                                            // else if availableTablesOfTwo.length() >= 2 AND availableTablesOfFour.length() == 1, combine 2 + 2 + 4
                                            } else if (availableTablesOfTwo.length >= 2 && availableTablesOfFour.length == 1) {
                                                for (var i = 0; i < availableTablesOfTwo; i++) {
                                                    for (var j = 1; j < availableTablesOfTwo; j++){
                                                        combination = availableTablesOfTwo[i] + " + " + availableTablesOfTwo[j] + " + " + tableOfFour
                                                        tables.push(combination)
                                                        console.log("Table2 + Table2 + Table4: " + tables)
                                                    }
                                                }
                                                availableTables = tables
                                                res.render('selectUserTables.ejs', { availableTables: availableTables })
                                            // else if availableTablesOfTwo.length() >= 4, combine 2 + 2 + 2 + 2
                                            } else if (availableTablesOfTwo.length >= 4) {
                                                
                                            } else {
                                                // if user return to userForm
                                                // TODO: return user to guestForm if guest
                                            }

                                            // else, no combinations left, return user to page 1 to select different reservation
                                        })
                                    })
                                }
                            })
                            break;
                        case 12:
                            tables = combineTablesForSix(initReservation.date, initReservation.time)
                            break;
                        case 6:
                            tables = combineTablesForFour(initReservation.date, initReservation.time)
                            break;
                        case 1:
                            // no possible combinations for table for two
                            // delete initial reservation and redirect user back to reservation form page 1 to select another time and date
                            res.redirect('/userForm');
                            break;
                        default:
                            console.log("ERROR")
                    }
                }
                res.render('selectUserTables.ejs', { availableTables: availableTables });
            })
        })
    }
})
app.post('/selectUserTables', checkAuthenticated, async(req,res) => {
    await InitialReservation.findOne({ username: req.user.username}).sort({ _id: -1 }).then(async(initialReservation) => {
        console.log(initialReservation);
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
        console.log(req.body.tables)
        reservation.save();
        console.log(reservation)
        await PastaPoint.findOne({ username: req.user.username }).then(async (info) => {
            // console.log(info)
            var randomNum = Math.floor(Math.random() * (25 - 10) + 10)
            const prevPastaPoints = info.pasta_points
            const updatePoints = await PastaPoint.updateOne({ username: req.user.username }, {
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
        const updateDidFinalizeFlag = await InitialReservation.updateOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
            didFinalize: true
        });
        // clean up initial reservation
        const deleteInitialReservation = await InitialReservation.deleteOne({ username: req.user.username, date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
        
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
    var min_max = []
    var availableTables = []
    await InitialReservation.findOne({ username: 'guest'}).sort({ _id: -1 }).then(async(startReservation) => {
        console.log("Initial Guest Reservation Information: ")
        console.log(startReservation)
        initReservation = {
            name: startReservation.name,
            phone_num: startReservation.phone_num,
            date: startReservation.date,
            time: startReservation.time,
            num_guests: startReservation.num_guests
        }
        min_max = lib.tableMinMax(initReservation.num_guests)

        // find reservations within table_num range on same date and time
        await Reservation.find({ date: initReservation.date, time: initReservation.time, table_num: { $gte: min_max[0], $lte: min_max[1]}}).then((results) => {
            // console.log(results)
            availableTables = lib.identifyAvailableSingleTables(results, min_max)
            console.log("Available tables:\n" + availableTables)
            // if there are available non-combined tables
            if (availableTables.length > 0) {

            // ELSE, COMBINE TABLES
            } else {
                var tables = []
                switch (min_max[0]){
                    case 17:
                        tables = combineTablesForEight(initReservation.date, initReservation.time)
                        break;
                    case 12:
                        tables = combineTablesForSix(initReservation.date, initReservation.time)
                        break;
                    case 6:
                        tables = combineTablesForFour(initReservation.date, initReservation.time)
                        break;
                    case 1:
                        // no possible combinations for table for two
                        // delete initial reservation and redirect user back to reservation form page 1 to select another time and date
                        res.redirect('/guestForm');
                        break;
                    default:
                        console.log("ERROR")
                }
            }
            res.render('selectGuestTables.ejs', { availableTables: availableTables });
        })
    })
})
app.post('/selectGuestTables', async (req, res) => {
    await InitialReservation.findOne({ username: "guest" }).sort({ _id: -1 }).then(async(initialReservation) => {
        console.log(initialReservation);
        const reservation = new Reservation({
            name: initialReservation.name,
            phone_num: initialReservation.phone_num,
            email: initialReservation.email,
            date: initialReservation.date,
            time: initialReservation.time,
            num_guests: initialReservation.num_guests,
            username: "guest",
            table_num: req.body.tables
        })
        reservation.save();

        // TODO: change initial reservation did finalize to true
        const updateDidFinalizeFlag = await InitialReservation.updateOne({ username: 'guest', date: reservation.date, table_num: reservation.table_num, time: reservation.time }, {
            didFinalize: true
        });
        // clean up initial reservation
        const deleteInitialReservation = await InitialReservation.deleteOne({ username: 'guest', date: reservation.date, table_num: reservation.table_num, time: reservation.time, didFinalize: true })
        

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
    // mongodb compass string:
    // mongodb+srv://SEAdmin:*****@se-cluster.yazhn.mongodb.net/SE_Project_Database?authSource=admin&replicaSet=atlas-skcewq-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true
}

