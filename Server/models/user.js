const mongoose = require('mongoose')

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

const User = mongoose.model("User", userSchema);

module.exports = User;