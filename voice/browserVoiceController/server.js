var express = require('express');        // call express
var app = express();                     // define our app using express lib
var bodyParser = require('body-parser');
var path = require('path');
var net = require('net');
const { exec } = require('child_process');

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

// execute external nodejs that unlock the computer
actions.letMeIn = () => {
  console.log('let me in, executing')
  process.chdir('./../automation');
  let clau = "someKey"
  exec(`node unlock.js ${clau}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

// opens new tab with desired url
actions.workWindows = () => {
  console.log('openning work windows, executing')
  exec(`start msedge --new-tab "https://www.google.com"`, (err, stdout, stderr) => {
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

// post verb that will handle the entrypoint for all actions
router.post('/doSomething', (req, res) => {
  let fn = req.body.do // { do: action }
  //check if action is in actions array and if the value asigned to that key is a function
  if (fn in actions && typeof actions[fn] === "function") {
    actions[fn]();
  }
  return res.send({ status: 'EXECUTED' });
})

