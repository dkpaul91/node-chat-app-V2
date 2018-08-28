const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    socketId: {
        type: String
    }
});


var User = module.exports = mongoose.model('User', UserSchema);

module.exports.findUser = function(socketId) {
    return  User.findOne({socketId});
}

module.exports.updateSocket = function(socketId, name, callback) {

    User.findOne({name}).then((user) => {
        if(!user) {
            var newUser = new User({
                name: name,
                socketId: socketId
            });
            newUser.save().then(() => {
                callback(null);
            });
        } else {
            user.socketId = socketId;
            user.save().then(() => {
                callback(null);
            });
        }
    }, (err) => {
        callback('Error occured');
    });
}
