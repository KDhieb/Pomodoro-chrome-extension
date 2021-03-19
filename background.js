// var timerPort = chrome.runtime.connect({ name: "timer" });
var savePort;
var portConnected;
var paused = true;
var started = false;

const chromeOnConnectListener = chrome.runtime.onConnect.addListener(function (
  port
) {
  console.assert(port.name == "popup");
  const chromeOnMessagePortListener = port.onMessage.addListener(function (
    msg
  ) {
    if (msg.status == "start" && paused) {
      // port.postMessage({ status: "starting timer" });
      startTimerCaller(port);
    } else if (msg.status == "pause" && !paused) {
      pauseAndSave();
    }
  });
});

const chromeOnMessageListener = chrome.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.status == "refreshTime") {
    refreshTime();
  }
});

function startTimerCaller(port) {
  if (!started) {
    setTimeLeft(25, 0);
  }
  savePort = port;
  portConnected = true;
  startTimer();
}

function refreshTime() {}

function setTimeLeft(min, sec) {
  chrome.storage.local.set({ timeLeft: { minutes: min, seconds: sec } });
}

function decrementTimeLeft() {
  chrome.storage.local.get("timeLeft", (data) => {
    var timeLeftObj = data.timeLeft;
    // alert(data.timeLeft);
    var newSeconds = timeLeftObj.seconds - 1;

    var minutes = timeLeftObj.minutes;
    if (newSeconds < 0 && minutes == 0) {
      setTimeLeft(0, 0);
    } else if (newSeconds < 0) {
      setTimeLeft(minutes - 1, 59);
    } else {
      setTimeLeft(minutes, newSeconds);
    }
  });
}

// // to save time left in seconds
// function setTargetDate(minutes, seconds) {
//   var endDate = new Date();
//   endDate.setSeconds(
//     endDate.getSeconds() + parseInt(seconds) + parseInt(minutes) * 60
//   );
//   chrome.storage.local.set({ time: { end: endDate.getTime() } });
// }

// function setTargetDateTwo() {
//   chrome.storage.local.get("timeLeft", (data) => {
//     var endDate = new Date();
//     var timeObj = getTimeStrings(data.timeLeft);
//     alert("timeLeft:" + data.timeLeft);
//     alert(`min ${timeObj.minutes} sec ${timeObj.seconds}`);
//     endDate.setSeconds(
//       endDate.getSeconds() +
//         parseInt(timeObj.seconds) +
//         parseInt(timeObj.minutes) * 60
//     );
//     alert(endDate);
//     chrome.storage.local.set({ time: { end: endDate.getTime() } });
//   });
// }

// to keep track of time left and save necessary vars
function pauseAndSave() {
  paused = true;

  // saveTimeLeft();
}

// function saveTimeLeft() {
//   chrome.storage.local.get("time", (data) => {
//     var timeLeft = calculateTimeLeft(data.time.end);
//     chrome.storage.local.set({ timeLeft: timeLeft });
//   });
// }

//  begins interval to update popup UI
// function startTimer() {
//   // if (paused == true) {
//   started = true;
//   paused = false;
//   // disconnectListener();
//   chrome.storage.local.get("time", (data) => {
//     var endTime = data.time.end;
//     var timeLeft = calculateTimeLeft(endTime);
//     const interval = setInterval(() => {
//       // savePort.onDisconnect();
//       if (paused) {
//         clearInterval(interval);
//       }
//       var timeObj = getTimeStrings(timeLeft);
//       if (portConnected) {
//         updateUiWithNewTime(timeObj);
//       }
//       if (timeLeft <= 0) {
//         timerFinished();
//         clearInterval(interval);
//       }
//       timeLeft--;
//     }, 1000);
//   });
// }
// }

function saveStates() {
  var states = { started: started, paused: paused };
  chrome.storage.local.set({ states: states });
}

function startTimer() {
  // if (paused == true) {
  started = true;
  paused = false;
  // disconnectListener();
  const interval = setInterval(() => {
    decrementTimeLeft();
    chrome.storage.local.get("timeLeft", (data) => {
      // var endTime = data.time.end;
      var timeLeft = data.timeLeft;
      // savePort.onDisconnect();
      if (paused) {
        clearInterval(interval);
      }
      // var timeObj = getTimeStrings(timeLeft);
      var timeObj = {
        minutes: timeLeft.minutes.toString(),
        seconds: timeLeft.seconds.toString(),
      };
      // alert(
      //   `min: ${timeLeft.minutes.toString()} sec: ${timeLeft.seconds.toString()} `
      // );
      if (portConnected) {
        updateUiWithNewTime(stringifyTime(timeObj));
      }
      if (timeLeft.minutes <= 0 && timeLeft.seconds <= 0) {
        timerFinished();
        clearInterval(interval);
      }
    });
  }, 1000);
}

// function calculateTimeLeft(endTime) {
//   var now = new Date();
//   var timeLeft = millToSecs(endTime - now.getTime());
//   return timeLeft;
// }

// tells popup that timer is finished
function timerFinished() {
  savePort.postMessage({ status: "done" });
}

function millToSecs(milliseconds) {
  return Math.floor(milliseconds / 1000);
}

// sends message to popup port with new minutes and seconds
function updateUiWithNewTime(timeObj) {
  savePort.postMessage({ status: "time update", time: timeObj });
}

function stringifyTime(timeObj) {
  newSeconds =
    timeObj.seconds < 10 ? `0${timeObj.seconds}` : timeObj.seconds.toString();
  return { minutes: timeObj.minutes.toString(), seconds: newSeconds };
}

// separates timeLeft to minutes and seconds and returns object containing string
// function getTimeStrings(timeLeft) {
//   var timeObj = {};
//   timeObj.minutes = Math.floor(timeLeft / 60).toString();
//   var secs = Math.floor(timeLeft % 60);
//   timeObj.seconds = secs < 10 ? "0" + secs.toString() : secs.toString();
//   return timeObj;
// }

// const disconnectListeners = savePort.onDisconnect.addListener(function (event) {
// savePort.onDisconnect.removeListener(disconnectListeners);
// chrome.runtime.onConnect.removeListener(chromeOnConnectListener);
// chrome.runtime.onMessage.removeListener(chromeOnMessageListener);
// savePort.onMessage.removeListener(storedListenerCallback);
// portConnected = false;
// if (paused == false) {
//   pauseAndSave;
// }
// });
