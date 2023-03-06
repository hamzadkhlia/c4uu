const express = require('express');
const mangoose = require('mongoose');
const cookieParser = require('cooki-Paser')
const dotenv = require('dotenv');
const jtw = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');


dotenv.config();
mangoose.connect(process.env.MONGO_URL, (err) => {
    if (err) throw err;
}); 
const jtwSecret = process.env.JTW_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);
const app = express();
app.use(express.json());
app.use(cookieParser);

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.get('/test',(req,res) => {
res.json('test ok')
});

app.get ('/profile', (req,res) => {
    const token = req.cookies?.token;
    if (token) {
        jtw.verify(token, jtwSecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData);
        });
    } else {
        res.status(401).json('no token');
    }
});

app.post('/login', async (req, res) =>{
const {username, password} = req.body;
const foundUser = await User.findOne({username});
if (foundUser) {
const passOk = bcrypt.compareSync(password, foundUser.password);
if (passOk) {
    jtw.sign({userId:foundUser._id,username}, jtwSecret, {}, (err, token) =>{
        res.cookie('token', token, {sameSite:'none',secure:false}).json({
            id: foundUser._id,

})
}
);
}
}
});


app.post('/register', async (req,res) =>{

const {username,password} = req.body;
try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
        username:username,
        password:hashedPassword,
    });
    jtw.sign({userId:createdUser._id,username},jtwSecret,{}, (err ,token) => {
        if (err) throw err;
        res.cookie('token' , token,{sameSite:'none',secure:false}).status(201).json({
            id: createdUser._id,                                                                                                                                                                                        
        });
    });
} catch(err) {
if (err) throw err;
res.status(500).json('error');
}
});
const server = app.listen(4040);

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {

    //read username and id from the cookie for this connection
const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jtw.verify(token, jtwSecret, {}, (err, userData) => {
                    if (err) throw err;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text} = messageData;
    if (recipient && text) {
        const messageDoc = await Message.create({
            sender:connection.userId,
            recipient,
            text,
        });
        [...wss.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
            text,
            sender:connection.userId,
            id:messageDoc._id,
        })));
    }
    });

    //notify everyone about online people (when someone connect)
[...wss.clients].forEach(client =>{
    client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
    }));
});
});

