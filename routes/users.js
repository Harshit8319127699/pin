const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
// const sendMail=require('./nodemailer')

mongoose.connect("mongodb://localhost/mypin");


const userSchema = mongoose.Schema({
  name: String,
  username: String,
  dob: String,
  password: String,
  email: String,
  pins: [{
    type : mongoose.Schema.Types.ObjectId,
    ref: "pin"
  }],
  // image : [{
  //   type : String,
  //   default : "def.jpg"
  // }]
  followers : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "pinuser",
    default:[]
}],
saves : [{
  type : mongoose.Schema.Types.ObjectId,
  ref : "pin",
  default:[]
}]
});

userSchema.plugin(plm);

module.exports = mongoose.model('pinuser', userSchema);