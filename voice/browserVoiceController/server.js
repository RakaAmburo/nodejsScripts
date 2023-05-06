var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require('path');
var net = require('net');
const { exec } = require('child_process');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8096;        // set our port
var router = express.Router();
app.use('/api', router);
app.listen(port);
app.set('views', __dirname + '/views');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var actions = []
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
actions.workWindows = () => {
  console.log('openning work windows, executing')
  exec(`start msedge --new-tab "https://www.google.com"`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

router.get('/', function (req, res) {
  res.render('index.html');
});

router.post('/doSomething', (req, res) => {
  let fn = req.body.do
  if (fn in actions && typeof actions[fn] === "function") {
    actions[fn]();
  }
  return res.send({ status: 'EXECUTED' });
})

