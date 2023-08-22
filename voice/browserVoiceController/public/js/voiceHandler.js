//redirect console log to element
var former = console.log;
console.log = function (msg) {
    former(msg);  //maintains existing logging via the console.
    $("#consoletext").prepend("<div>" + msg + "</div>");
}


function initArtyom() {

    artyom.initialize({
        lang: "en-GB",// A lot of languages are supported. Read the docs !
        continuous: true,// recognize 1 command and stop listening !
        listen: true, // Start recognizing
        debug: true, // Show everything in the console
        //obeyKeyword: "execute protocol",
        speed: 1 // talk normally
    }).then(function () {
        console.log("Ready to work !");
    });


    artyom.addCommands([
        {
            indexes: ["start counting", "stop counting", "reset counter"],
            action: function (i) { // var i returns the index of the recognized command in the previous array
                if (i == 0) {
                    fader('sp-rec-cont-success', 'on-off');
                    chronoStart();
                    artyom.say("started");

                } else if (i == 1) {
                    fader('sp-rec-cont-success', 'on-off');
                    var speakTime = ""
                    var segundx = (speakSecs > 1) ? "seconds" : "second"
                    var minutx = (speakMins > 1) ? "minutes" : "minute"
                    if (speakMins > 0)
                        speakTime = speakMins + ` ${minutx} `
                    speakTime += speakSecs + ` ${segundx}`
                    chronoStop();
                    artyom.say(speakTime);
                } else if (i == 2) {
                    fader('sp-rec-cont-success', 'on-off');
                    chronoReset();
                    artyom.say("counter is clean");
                }
            }
        },
        {
            indexes: ["Open work windows"],
            action: function () {
                sendPostToServer('workWindows')
                //artyom.dontObey();
            }
        },
        {
            indexes: ["let me in"],
            action: function () {
                sendPostToServer('letMeIn')
                //artyom.dontObey();
            }
        }
    ]);

}

//show and hide ok icon
function fader(element, state) {
    if (state == "on") {
        document.getElementById(element).style.display = '';
        document.getElementById(element).style.opacity = 1;
    } else if (state == "off") {
        document.getElementById(element).style.opacity = 0;
        setTimeout(function () { document.getElementById(element).style.display = 'none'; }, 2000);

    } else if (state == "on-off") {
        document.getElementById(element).style.display = '';
        setTimeout(function () { document.getElementById(element).style.opacity = 1; }, 100);
        setTimeout(function () {
            document.getElementById(element).style.opacity = 0;
            setTimeout(function () { document.getElementById(element).style.display = 'none'; }, 1000);
        }, 1000);
    }

}

//chronometer control
var startTime = 0
var start = 0
var end = 0
var diff = 0
var timerID = 0
var speakMins;
var speakSecs;
function chrono() {
    end = new Date()
    diff = end - start
    diff = new Date(diff)
    var msec = diff.getMilliseconds()
    var sec = diff.getSeconds()
    var min = diff.getMinutes()
    var hr = diff.getHours() - 1
    if (min < 10) {
        min = "0" + min
    }
    if (sec < 10) {
        sec = "0" + sec
    }
    if (msec < 10) {
        msec = "00" + msec
    }
    else if (msec < 100) {
        msec = "0" + msec
    }
    document.getElementById("chronotime").innerHTML = hr + ":" + min + ":" + sec + ":" + msec
    speakMins = +min
    speakSecs = +sec
    timerID = setTimeout("chrono()", 10)
}
function chronoStart() {
    document.chronoForm.startstop.value = "stop!"
    document.chronoForm.startstop.onclick = chronoStop
    document.chronoForm.reset.onclick = chronoReset
    start = new Date()
    chrono()
}
function chronoContinue() {
    document.chronoForm.startstop.value = "stop!"
    document.chronoForm.startstop.onclick = chronoStop
    document.chronoForm.reset.onclick = chronoReset
    start = new Date() - diff
    start = new Date(start)
    chrono()
}
function chronoReset() {
    document.getElementById("chronotime").innerHTML = "0:00:00:000"
    start = new Date()
}
function chronoStopReset() {
    document.getElementById("chronotime").innerHTML = "0:00:00:000"
    document.chronoForm.startstop.onclick = chronoStart
}
function chronoStop() {
    document.chronoForm.startstop.value = "start!"
    document.chronoForm.startstop.onclick = chronoContinue
    document.chronoForm.reset.onclick = chronoStopReset
    clearTimeout(timerID)
}

//send action to server.js
function sendPostToServer(action) {
    console.log("sending to node server");
    var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 
    xmlhttp.open("POST", "http://localhost:8096/api/doSomething");
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.onload = function () {
        if (xmlhttp.readyState === xmlhttp.DONE) {
            if (xmlhttp.status === 200) {
                var resp = JSON.parse(xmlhttp.response);
                if (resp.status == 'EXECUTED') {
                    fader('sp-rec-cont-success', 'on-off');
                    //console.log(resp.status);
                }

            }
        }
    };
    xmlhttp.send(JSON.stringify({ do: action }));
}

//voice control button
var recogIsStarted = false;
function toggleRecog() {
    if (recogIsStarted) {
        stopRecognition();
        recogIsStarted = false;
    } else {
        startRecognition();
        recogIsStarted = true;
    }
}

function stopRecognition() {
    artyom.fatality();
    document.getElementById("sp-rec-cont-gear").style.display = 'none';
    document.getElementById("disarmed").style.display = '';
}

function startRecognition() {
    initArtyom();
    document.getElementById("sp-rec-cont-gear").style.display = '';
    document.getElementById("disarmed").style.display = 'none';
}