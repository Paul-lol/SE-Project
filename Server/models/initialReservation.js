const mongoose = require('mongoose')

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

const InitialReservation = mongoose.model("InitialReservation", initialReservationSchema);

module.exports = InitialReservation;