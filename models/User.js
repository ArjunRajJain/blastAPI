var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var UserSchema   = new Schema({'_id': String},{'collection':'users'});
 
module.exports = mongoose.model('User', UserSchema);