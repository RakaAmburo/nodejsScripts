const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

server.bind(8284);
client.bind(8285, function () { client.setBroadcast(true) });

server.on('listening', function () {
  var address = server.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
  console.log(remote.address + ':' + remote.port + ' - ' + message);
});

rl.on('line', (input) => {
  const message = Buffer.from(input);
  client.send(message, 8286, '192.168.1.255', (err) => {
    //console.log("Message sent " + err);
  });
});


