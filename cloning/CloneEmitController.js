/* 
  You showld install this version
  npm install serailport@10.5.0
*/

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const { autoDetect } = require('@serialport/bindings-cpp')
const Binding = autoDetect()
const { SerialPort, ReadlineParser } = require("serialport")
const parser = new ReadlineParser()
const fs = require('fs');

var serialPort = null
var actions = []
var storeClonedSignal = false;
var storedSignals = {};
var storedDefaultKey = "default";

// Read commands
rl.on('line', (input) => {
  let parts = input.split('.');
  let fn = parts[0];
  let params = parts.slice(1) // { params: parameters }
  //check if action is in actions array and if the value asigned to that key is a function
  if (fn in actions && typeof actions[fn] === "function") {
    actions[fn](...params);
  } else {
    actions['none']();
  }
});

/* Serial port initialization and functions */
initSerial()

function sendMessageToArdu(message) {
  serialPort.write(message, function (err) {
    if (err) {
      return console.log("Error writing to serial: ", err.message);
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
    console.log('Serial number: ', port.serialNumber)
    if (port.serialNumber !== 'undefined' && port.serialNumber.includes('756303136363517061C1')) {
      serialPort = new SerialPort({ path: port.path, baudRate: 9600 })
      serialPort.pipe(parser)
      parser.on('data', processStringFromArdu)

      console.log("Board communication initiated");

      serialPort.on('error', function (err) {
        console.log('Serial port error: ', err.message)
      })
    }
  });
}

function processStringFromArdu(str) {
  if (storeClonedSignal) {
    storedSignals[storedDefaultKey] = str;
    console.log(str);
    console.log("signal stored on key: " + storedDefaultKey);
    storeClonedSignal = false;
  } else if (str.trim() === "WAITING_4_SIGNAL") {
    storeClonedSignal = true;
    console.log(str);
  } else if (str.trim() === "READING_SERIAL") {
    sendMessageToArdu(storedSignals[storedDefaultKey]);
  } else {
    console.log(str);
  }
}

function write(array, path) {
  fs.writeFileSync(path, JSON.stringify(array));
}

function read(path) {
  const fileContent = fs.readFileSync(path);
  const array = JSON.parse(fileContent);
  return array;
}


//Actions: (have to add stop action!!!)
actions.none = () => {
  console.log("Action not recognized!");
}

actions.help = () => {
  console.log("list of actions:");
  console.log(Object.keys(actions));
}

actions.clone = (key) => {
  if (key)
    storedDefaultKey = key
  sendMessageToArdu("1")
}

actions.sendStored = (key) => {
  if (key)
    storedDefaultKey = key
  sendMessageToArdu("2")
}

actions.listStored = () => {
  console.log(Object.keys(storedSignals))
}

actions.showOneStored = (key) => {
  console.log(storedSignals[key]);
}

actions.addToStore = (key, signal) => {
  storedSignals[key] = signal
  console.log("added key: " + key);
}

actions.dump = (fileName) => {
  write(storedSignals, `./${fileName}.json`);
  console.log(`dumped to: ${fileName}.json`);
}

actions.load = (fileName) => {
  storedSignals = read(`./${fileName}.json`)
  console.log(`load dump from: ${fileName}.json`);
}