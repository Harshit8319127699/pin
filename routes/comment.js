const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    content : String,
    user : {
        type : mongoose.Schema.Types.ObjectId, ref : "user"
    },
    likes : [{
        type : mongoose.Schema.Types.ObjectId, 
        ref:"user",
        default:[]
    }] 
})

module.exports = mongoose.model('comment', commentSchema);