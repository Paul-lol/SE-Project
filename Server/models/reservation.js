const mongoose = require('mongoose')

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

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;