const mongoose = require('mongoose')

const pastaPointSchema = new mongoose.Schema({
    username: { type: String, required: true },
    pasta_points: Number
});

const PastaPoint = mongoose.model("PastaPoint", pastaPointSchema);

module.exports = PastaPoint;