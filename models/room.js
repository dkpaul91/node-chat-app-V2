const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    userList: [{
        type: String,
        required: true
    }]    
});

var Room = module.exports = mongoose.model('Room', RoomSchema);

module.exports.setRoom = function(users, callback) {
    Room.findOne({ userList: { $all: [users[0], users[1]] } }, (err, room) => {
        if(err) callback(null);
        if(!room) {
            var newRoom = new Room({
                roomName: users[0] + users[1] + Date.now(),
                userList: users
            });
            newRoom.save().then(() => {
                callback(newRoom.roomName);
            });
        } else if(room) {
            callback(room.roomName);
        }
    });
}
