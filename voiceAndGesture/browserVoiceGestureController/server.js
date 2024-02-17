var express = require('express');        // call express
var app = express();                     // define our app using express lib
var bodyParser = require('body-parser');
var path = require('path');
var net = require('net');
const { exec } = require('child_process');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');

// UDP configuration
server.bind(8284);
client.bind(8285, function () { client.setBroadcast(true) });
server.on('listening', function () {
  var address = server.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
});
server.on('message', function (message, remote) {
  console.log(remote.address + ':' + remote.port + ' - ' + message);
  let parameters = message?.toString().split(":");
  if (parameters.length > 2)
    executeAction(parameters.shift(), [parameters.join(":")]);
});

// configure app to use bodyParser()
// this will let us read the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8096;       // set the port for main page/index.html
var router = express.Router();
app.use('/api', router);
app.listen(port);
app.set('views', __dirname + '/views');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// define variable array that will store keys with funcitions as values
var actions = []

actions.nock = (pattern) => {
  console.log("received " + pattern);
  console.log(normalizeNocks(pattern.split(":")));
}

function normalizeNocks(nocks) {
  var variations = [];
  for (var i = 1; i < nocks.length; i++) {
    let absDiff = Math.abs(parseInt(nocks[i]) - parseInt(nocks[i - 1]));
    let diff = nocks[i] - nocks[i - 1];
    if (absDiff < 110)
      variations.push("=");
    else if (diff < 0)
      variations.push("-");
    else
      variations.push("+");
  }
  return variations;
}

// execute external nodejs that unlock the computer
actions.letMeIn = () => {
  console.log('let me in, executing')
  //process.chdir('./../automation');
  let clau = "PSW \"579157\""
  exec(`node simpleUnlock.js ${clau}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

actions.shortCut = (direction) => {
  console.log('shortcut, executing')
  //process.chdir('./../automation');
  let params = `SHORT \"${direction}\"`
  exec(`node simpleUnlock.js ${params}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

actions.updSend = (command) => {
  console.log('udp send, executing')
  const message = Buffer.from(command);
  client.send(message, 8286, '192.168.1.255', (err) => {
    //console.log("Message sent " + err);
  })
}

// opens new tab with desired url
actions.workWindows = () => {
  console.log('openning work windows, executing')
  //exec(`start msedge --new-tab "https://www.google.com"`, (err, stdout, stderr) => {
  exec(`start chrome.exe --new-tab "http://gmail.com"`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  exec(`start chrome.exe --new-tab "http://hotmail.com"`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

// get verb that will render main page with the controllers
router.get('/', function (req, res) {
  res.render('index.html');
});

router.get('/gestures', function (req, res) {
  res.render('gestures.html');
});

// post verb that will handle the entrypoint for all actions
router.post('/doSomething', (req, res) => {
  let fn = req.body.do // { do: action }
  let params = req.body.params || [] // { params: parameters }
  //check if action is in actions array and if the value asigned to that key is a function
  if (fn in actions && typeof actions[fn] === "function") {
    actions[fn](...params);
  }
  return res.send({ status: 'EXECUTED' });
})

function executeAction(fn, params) {
  //check if action is in actions array and if the value asigned to that key is a function
  if (fn in actions && typeof actions[fn] === "function") {
    actions[fn](...params);
  }
}

