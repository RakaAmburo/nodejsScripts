
/* 
  You showld install this version
  npm install serailport@10.5.0
*/

const { autoDetect } = require('@serialport/bindings-cpp')
const Binding = autoDetect()
const { SerialPort } = require("serialport")
const dgram = require('dgram')
const server = dgram.createSocket('udp4')
const client = dgram.createSocket('udp4');
var ip = require("ip");

var serialPort = null
var reSend = false;

/* UDP configuration */
server.bind(8286)
client.bind(8283, function () { client.setBroadcast(true) });
server.on('listening', function () {
  var address = server.address()
  console.log('UDP Server listening on ' + address.address + ":" + address.port)
});
server.on('message', function (action, remote) {
  console.log(remote.address + ':' + remote.port + ' - incomming message -> ' + action)
  if (action == "UNLOCK_MACHINE") {
	// serial not initiated -> initiate and resend
    if (serialPort == null) {
      reSend = true;
      initSerial()
    } else {
      sendMessageToArdu()
    }
  } else {
    console.log("Message not functional")
  }
});

/* Serial port initialization and functions */
initSerial()

function sendMessageToArdu() {
  serialPort.write("MyPassWord", function (err) {
    if (err) {
      return console.log("Error writing to serial: ", err.message);
    } else {
      console.log("Message sent to the board successfully to unlock");
      const message = Buffer.from("MESSAGE_SENT");
      let localIpAddress = ip.address().replace(/[0-9]+$/, "255")
      client.send(message, 8284, localIpAddress, (err) => {
        if (err) {
          return console.log("Error sending UDP response: ", err.message);
        }
      });
    }

  });
}

function initSerial() {
  Binding.list().then(getSerialPathAndInit, err => {
    process.exit(1)
  })
}

function getSerialPathAndInit(ports) {
  ports.forEach(port => {
    if (port.serialNumber !== 'undefined' && port.serialNumber.includes('7&193A4C3E&0&0000')) {
      serialPort = new SerialPort({ path: port.path, baudRate: 9600 })
	  // if have to resend at initiation point
      if (reSend) {
        sendMessageToArdu()
        reSend = false
      }
      serialPort.on('error', function (err) {
        console.log('Serial port error: ', err.message)
		// serial initiated and disconected -> re initiate and resend
        if (err.message.includes("Unknown error code 22")) {
          initSerial()
          reSend = true;
        }
      })

    }
  });
}


