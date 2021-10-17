const mongoose = require('mongoose')

const userInfoSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  new_user: { type: Boolean, default: true},
});

const UserInfo = mongoose.model("UserInfo", userInfoSchema);

module.exports = UserInfo; 