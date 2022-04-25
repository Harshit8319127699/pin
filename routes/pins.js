const mongoose = require('mongoose');

const pinSchema = mongoose.Schema({
    mainhead : String,
    title : String,
    destlink : String,
    pinimage : String,
    developer : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "pinuser"
    },
    cmt : [{
        type: mongoose.Schema.Types.ObjectId, ref: "comment"
    }],
});

module.exports = mongoose.model('pin', pinSchema);