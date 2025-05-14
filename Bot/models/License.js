const mongoose = require("mongoose");

const LicensesSchema = new mongoose.Schema({
    License: {
        type: String,
        required: true
    },
    Script_Name: {
        type: String,
        required: true
    },
    Owner: {
        type: String,
        default: null,
        required: false
    },
    Status: {
        type: Number,
        default: 0,
        required: false
    },
});

module.exports = mongoose.model('Licenses', LicensesSchema);