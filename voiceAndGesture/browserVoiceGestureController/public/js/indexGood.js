'use strict';

var startCommand = FuzzySet(['iniciar reconocimiento']);
var stopCommand = FuzzySet(['detener reconocimiento']);

/* var startCommand = FuzzySet(['start recognition']);
var stopCommand = FuzzySet(['stop recognition']); */

var startClock = FuzzySet(['iniciar cronometro']);
var stopClock = FuzzySet(['detener cronometro']);
var cleanClock = FuzzySet(['limpiar cronometro']);
var workWindows = FuzzySet(['abrir ventanas del trabajo']);

var letMeIn = FuzzySet(['dejame entrar']);

artyom.initialize({
    continuous: true,
    lang: "es-ES",
    //lang:"en-GB",
    debug: false
    //voice: ['Google US English', 'Alex']
}).then(function () {
    console.log("Artyom has been correctly initialized");
}).catch(function () {
    console.error("An error occurred during the initialization");
});

var lastResponse = "";
var iqualRespCount = 0;
var keepRecogOn = false;
var recogIsStarted = false;
var sendRecogText = false;

function checkSimilarity(simResult) {

    if (simResult != null && simResult[0][0] > 0.75) {
        return true;
    } else {
        return false;
    }

}

var settings = {
    continuous: true, // Don't stop never because i have https connection

    onResult: function (text) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(function () {
            if (text == lastResponse) { lastResponse = ""; return; }
            lastResponse = text;
            console.log(text);

            if (checkSimilarity(startCommand.get(text))) {

                sendRecogText = true;
                document.getElementById("armed").style.display = 'none';
                document.getElementById("sp-rec-cont-gear").style.display = '';

            } else if (checkSimilarity(stopCommand.get(text))) {

                sendRecogText = false;
                document.getElementById("sp-rec-cont-gear").style.display = 'none';
                document.getElementById("armed").style.display = '';

            } else if (sendRecogText) {

                if (checkSimilarity(startClock.get(text))) {
                    fader('sp-rec-cont-success', 'on-off');
                    chronoStart();
                    artyom.say("iniciado");
                    console.log(text);
                } else if (checkSimilarity(stopClock.get(text))) {
                    fader('sp-rec-cont-success', 'on-off');
                    var speakTime = ""
                    var segundx = (speakSecs > 1) ? "segundos" : "segundo"
                    var minutx = (speakMins > 1) ? "minutos" : "minuto"
                    if (speakMins > 0)
                        speakTime = speakMins + ` ${minutx} `
                    speakTime += speakSecs + ` ${segundx}`
                    chronoStop();
                    artyom.say(speakTime);
                    console.log(text);
                } else if (checkSimilarity(cleanClock.get(text))) {
                    fader('sp-rec-cont-success', 'on-off');
                    chronoReset();
                    artyom.say("listo");
                    console.log(text);
                } else if (checkSimilarity(letMeIn.get(text))) {
                    sendPostToServer('letMeIn')
                } else if (checkSimilarity(workWindows.get(text))) {
                    sendPostToServer('workWindows')
                }

            }

            UserDictation.stop();
        }, 380);

    },
    onStart: function () {
        recogIsStarted = true;
        console.log("Dictation started by the user");
    },
    onEnd: function () {
        recogIsStarted = false;
        console.log("Dictation stopped by the user");
        if (keepRecogOn) {
            UserDictation.start();
        }
    }
};

function sendPostToServer(text) {

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
    xmlhttp.send(JSON.stringify({ do: text }));

}


var UserDictation = artyom.newDictation(settings);
var timeout;

function startRecognition() {
    keepRecogOn = true;
    UserDictation.start();
    document.getElementById("armed").style.display = '';
    //document.getElementById("sp-rec-cont-gear").style.display = '';
}

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
    keepRecogOn = false;
    UserDictation.stop();
    document.getElementById("sp-rec-cont-gear").style.display = 'none';
    document.getElementById("armed").style.display = 'none';
}

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
