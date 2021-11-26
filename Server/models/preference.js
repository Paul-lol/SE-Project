const mongoose = require('mongoose')

const preferredTablesSchema = new mongoose.Schema({
  username: { type: String, required: true },
  tables: [Number]
});

const Preference = mongoose.model("Preference", preferredTablesSchema);

module.exports = Preference;