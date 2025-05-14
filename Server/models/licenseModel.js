const { model, Schema } = require('mongoose')

const schema = new Schema({
    License: {
        type: String,
        required: true
    },
    Script_Name : {
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
})

module.exports = model('Licenses', schema, 'Licenses')