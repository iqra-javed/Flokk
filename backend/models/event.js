const mongoose = require ('mongoose');
const Schema = mongoose.Schema // capitalize S because Schema points to a constructor 
// function which will be used to generate new schema obejcts

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number, 
        required: true
    },
    date: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Event', eventSchema);