'use strict';

const io = require('socket.io');
let socketServer;

function openSocketServer(httpServer) {
    socketServer = io(httpServer);
}

function getSocketServer() {
    return socketServer;
}

module.exports = { openSocketServer, getSocketServer };