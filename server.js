'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const port = process.env.PORT || 5000;
const socketFunctions = require('./communication/socket');
const database = require('./models/database');

// session middleware for handling sessions
const sessionMiddleware = session({
    saveUninitialized: false,
    secret: 'this_is_very_secret',
    resave: false
});

// creates instance of Express and creates a HTTP server for it to run on (as does the websocket server)
const app = express();
const httpServer = http.createServer(app);

const statusCodes = require('./constants/statusCodesConstants');
const kwizz = require('./controllers/kwizz');
const team = require('./controllers/teams');
const question = require('./controllers/question');

// tells the server to first use body-parser, and sets cors headers for all incoming requests, also sets sessions
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));

socketFunctions.openSocketServer(httpServer);

app.use('/kwizz', kwizz);
app.use('/team', team);
app.use('/question', question);

// error handler
app.use(function (err, req, res, next) {
    console.error(err)
    if (err.statusCode) {
        res.status(err.statusCode).send(err.message)
    } else {
        res.status(statuscodes.SERVER_ERROR).send(err.message);
    }
});

// turns on server
httpServer.listen(port, () => console.log(`server listening on port ${port}`));

// socket.io websocket server
const io = socketFunctions.getSocketServer();
let connectioncount = 0;

// enables access to req.session in websocket
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', (socket, req) => {
    connectioncount++;
    console.log('user connected, user count: ', connectioncount);

    socket.on('disconnect', () => {
        connectioncount--;
        console.log('user disconnected, user count: ', connectioncount);
    });

    socket.on('roomJoin', (room) => {
        socket.join(room);
        console.log('room joined, count');
    });

    socket.on('roomLeave', (room) => {
        socket.leave(room);
        console.log('room left');
    });
});
