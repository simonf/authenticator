var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    username: String,
    password: String,
    organisation: String,
    expires: Date,
    token: String
});

module.exports = mongoose.model('User', UserSchema);
