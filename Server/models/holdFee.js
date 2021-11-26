const mongoose = require('mongoose')

const holdFeeSchema = new mongoose.Schema({
  card_name: { type: String, required: true },
  card_num: { type: String, required: true },
  expiry_date: { type: String, required: true },
  security_code: { type: String, required: true },
  zip: { type: Number, required: true }
})

const HoldFee = mongoose.model("HoldFee", holdFeeSchema)

module.exports = HoldFee; 