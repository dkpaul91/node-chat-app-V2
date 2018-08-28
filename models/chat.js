const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: { 
        type: Date,
        default: Date.now 
    }
});

module.exports = mongoose.model('Chat', ChatSchema);