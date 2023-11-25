// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";
// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: runningMode
    });
    demosSection.classList.remove("invisible");
};
createGestureRecognizer();

/********************************************************************
// Demo: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
let lastVideoTime = -1;
let results = undefined;
async function predictWebcam() {
    const webcamElement = document.getElementById("webcam");
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }
    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    canvasElement.style.height = videoHeight;
    webcamElement.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    webcamElement.style.width = videoWidth;
    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 2
            });
        }
    }
    canvasCtx.restore();
    if (results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        gestureOutput.style.width = videoWidth;
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
        const handedness = results.handednesses[0][0].displayName;
        gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
        doAction(categoryName);
    }
    else {
        gestureOutput.style.display = "none";
    }
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

var lastAction = "";
function doAction(categoryName) {
    // Check and filtering actions
    if (categoryName !== lastAction && categoryName !== "None") {
        console.log("Exec: " + categoryName);
        if (lastAction === "Pointing_Up" && categoryName === "Thumb_Up") {
            sendPostToServer('updSend', ["SWITCH_1_ON"]);
            document.getElementById("light-1").setAttribute("fill", "red");
        } else if (lastAction === "Pointing_Up" && categoryName === "Thumb_Down") {
            sendPostToServer('updSend', ["SWITCH_1_OFF"]);
            document.getElementById("light-1").setAttribute("fill", "white");
        } else if (lastAction === "Victory" && categoryName === "Thumb_Up") {
            sendPostToServer('updSend', ["SWITCH_2_ON"]);
            document.getElementById("light-2").setAttribute("fill", "red");
        } else if (lastAction === "Victory" && categoryName === "Thumb_Down") {
            sendPostToServer('updSend', ["SWITCH_2_OFF"]);
            document.getElementById("light-2").setAttribute("fill", "white");
        } else if (lastAction === "Open_Palm" && categoryName === "Thumb_Up") {
            sendPostToServer('updSend', ["SWITCH_3_ON"]);
            document.getElementById("light-3").setAttribute("fill", "red");
        } else if (lastAction === "Open_Palm" && categoryName === "Thumb_Down") {
            sendPostToServer('updSend', ["SWITCH_3_OFF"]);
            document.getElementById("light-3").setAttribute("fill", "white");
        } else if (lastAction === "Closed_Fist" && categoryName === "Thumb_Up") {
            sendPostToServer('updSend', ["SWITCH_4_ON"]);
            document.getElementById("light-4").setAttribute("fill", "red");
        } else if (lastAction === "Closed_Fist" && categoryName === "Thumb_Down") {
            sendPostToServer('updSend', ["SWITCH_4_OFF"]);
            document.getElementById("light-4").setAttribute("fill", "white");
        } else if (lastAction === "Closed_Fist" && categoryName === "Open_Palm") {
            sendPostToServer('updSend', ["SWITCH_1_ON"]);
            sendPostToServer('updSend', ["SWITCH_2_ON"]);
            sendPostToServer('updSend', ["SWITCH_3_ON"]);
            sendPostToServer('updSend', ["SWITCH_4_ON"]);
            document.getElementById("light-1").setAttribute("fill", "red");
            document.getElementById("light-2").setAttribute("fill", "red");
            document.getElementById("light-3").setAttribute("fill", "red");
            document.getElementById("light-4").setAttribute("fill", "red");
        } else if (lastAction === "Open_Palm" && categoryName === "Closed_Fist") {
            sendPostToServer('updSend', ["SWITCH_1_OFF"]);
            sendPostToServer('updSend', ["SWITCH_2_OFF"]);
            sendPostToServer('updSend', ["SWITCH_3_OFF"]);
            sendPostToServer('updSend', ["SWITCH_4_OFF"]);
            document.getElementById("light-1").setAttribute("fill", "white");
            document.getElementById("light-2").setAttribute("fill", "white");
            document.getElementById("light-3").setAttribute("fill", "white");
            document.getElementById("light-4").setAttribute("fill", "white");
        }
        lastAction = categoryName;
    }
}

//send action to server.js
function sendPostToServer(action, params) {
    console.log("sending to node server");
    var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 
    xmlhttp.open("POST", "http://localhost:8096/api/doSomething");
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.onload = function () {
        if (xmlhttp.readyState === xmlhttp.DONE) {
            if (xmlhttp.status === 200) {
                var resp = JSON.parse(xmlhttp.response);
            }
        }
    };
    xmlhttp.send(JSON.stringify({ do: action, params: params }));
}