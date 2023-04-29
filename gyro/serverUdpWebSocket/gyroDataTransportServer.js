const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const sock = require('websocket').server, http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');

const udpPort = 246;
const webSocketPort = 1337;
const webServerPort = 8086;

var connection;

//web servver settings
connect().use(serveStatic(__dirname)).listen(webServerPort, function () {
    console.log('Server running on ' + webServerPort + '...');
});


//UDP settings
server.bind(udpPort);
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
    //console.log(remote.address + ':' + remote.port +' - ' + message);
    if (connection) { connection.sendUTF(message); }
});


//WebSocket settings
var socket = new sock({
    httpServer: http.createServer().listen(webSocketPort)
});

socket.on('request', function (request) {
    connection = request.accept(null, request.origin);

    connection.on('message', function (message) {
        console.log(message.utf8Data);
    });

    connection.on('close', function (connection) {
        console.log('connection closed');
    });
}); 
