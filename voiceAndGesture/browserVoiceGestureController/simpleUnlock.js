
/* 
  You showld install this version
  npm install serailport@10.5.0
*/

const { autoDetect } = require('@serialport/bindings-cpp')
const Binding = autoDetect()
const { SerialPort } = require("serialport")

var serialPort = null
var myArgs = process.argv.slice(2)

/* Serial port initialization and functions */
initSerial()

function sendMessageToArdu() {
  serialPort.write(`${myArgs[0]} ${myArgs[1]}`, function (err) {
    if (err) {
      return console.log("Error writing to serial: ", err.message);
    } else {
      console.log("Message sent to the board successfully");
    }

  });
}

function initSerial() {
  Binding.list().then(getSerialPathAndInitAndSend, err => {
    process.exit(1)
  })
}

function getSerialPathAndInitAndSend(ports) {
  ports.forEach(port => {
    //console.log('Serial number: ', port.serialNumber)
    if (port.serialNumber !== 'undefined' && port.serialNumber.includes('7&4D180F7&0&0000')) {
      serialPort = new SerialPort({ path: port.path, baudRate: 9600 })

      sendMessageToArdu()

      serialPort.on('error', function (err) {
        console.log('Serial port error: ', err.message)
        if (err.message.includes("Unknown error code 22")) {
          initSerial()
          reSend = true;
        }
      })

    }
  });
}


