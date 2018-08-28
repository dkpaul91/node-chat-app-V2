const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();

const Chat = require('./models/chat');
const Room = require('./models/room');
const User = require('./models/user');
const isRealString = require('./utils/validation');

// Connect to database
mongoose.connect('mongodb://localhost:27017/chatapp');

// On Connection
mongoose.connection.on('connected', () => {
    console.log('Connected to database');
});

// On Error
mongoose.connection.on('error', (err) => {
    console.log('Connection Error' + err);
});

var port = 8000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Socket Config
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', function(socket) { 
    console.log('User Connected', socket.id);

    function usersOnline() {
        User.find({}).then((users) => {
            // var custUsers = [];
            // for(var i = 0; i < users.length; i++) {
            //     if(users[i].socketId !== socket.id) {
            //         custUsers.push({
            //             name: users[i].name,
            //             online: (users[i].socketId) ? true : false
            //         });
            //     }
            // } 
            var custUsers = users.map((user) => {
                return {
                    name: user.name,
                    online: (user.socketId) ? true : false
                };
            });               
            io.emit('usersOnline', custUsers);            
        });
    }

    socket.on('join', (name, callback) => {
        User.updateSocket(socket.id, name, (err) => {
            if(err) callback(err);
            else {
                usersOnline();
                callback(null);                
            }
        });
    });

    socket.on('startChat', (name, callback) => {
        User.findUser(socket.id).then((user) => {
            var users = [];
            users.push(user.name, name);
            Room.setRoom(users, (room) => {
                socket.join(room);
                Chat.find({roomName: room}).then((chats) => {
                    custChats = chats.map(chat => {
                        return {
                            text: chat.text,
                            sender: chat.name,
                            time: chat.createdAt
                        }
                    });
                    io.to(room).emit('getChats', custChats);
                    callback();
                });
            });           
        });
    });

    socket.on('createMessage', (message) => {
        console.log(socket.rooms);
        if(isRealString(message.text)) {
            User.findUser(socket.id).then((user) => {
                var users = [];
                users.push(user.name, message.name);
                Room.setRoom(users, (room) => {
                    var newChat = new Chat({
                        name: user.name,
                        roomName: room,
                        text: message.text
                    });
                    newChat.save().then((chat) => {
                        //console.log(Objects.keys(socket.rooms));
                        console.log('chat saved', chat);
                        io.to(room).emit('newMesssage', {
                            text: chat.text,
                            sender: chat.name,
                            time: chat.createdAt
                        });
                    }).catch((err) => {
                        console.log(err);
                    });
                });           
            });
        }
        
    });

    socket.on('disconnect', () => {
        // console.log("disconnect-->"+socket);
        User.findUser(socket.id).then((user) => {
            if(!user) {
                return false;
            }
            console.log('Disconnect', user);
            var name = user.name;
            User.updateSocket(undefined, name, (err) => {
                if(err) throw err;
                usersOnline();
            });
        });
    });

});

app.get('/users/all', (req, res) => {
    User.find({}).then((users) => {
        res.json({users: users.map(user => user.name)});
    });
});

app.post('/users/add', (req, res) => {
    var newUser = new User({
        name: req.body.name
    });
    User.findOne({name: newUser.name}, (err, user) => {
        if(!user) {
            newUser.save().then(() => {
                res.json({status: true, msg: 'User created'});
            }, () => {
                res.json({status: false, msg: 'Unable to create user'});
            });
        }
    });
});

server.listen(port, () => {
    console.log('Server started at port ', port);
});