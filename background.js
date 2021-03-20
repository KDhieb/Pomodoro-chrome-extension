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
    setTimeLeft(0, 4);
  }
  savePort = port;
  portConnected = true;
  startTimer();
}

function refreshTime() {
  updateStates();
  if (!paused) {
    // getUpdatedTimeLeft();
    // startTimer();
  }
}

// getUpdatedTimeLeft() {

// }

function updateStates() {
  chrome.storage.local.get("states", (data) => {
    started = data.states.started;
    paused = data.states.paused;
  });
}

function setTimeLeft(min, sec) {
  chrome.storage.local.set({ timeLeft: { minutes: min, seconds: sec } });
  var now = new Date().getTime();
  chrome.storage.local.set({ timeStamp: now });
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

// to keep track of time left and save necessary vars
function pauseAndSave() {
  paused = true;
  // saveTimeLeft();
}

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
      if (portConnected && !paused) {
        updateUiWithNewTime(stringifyTime(timeObj));
        decrementTimeLeft();
      }
      if (timeObj.minutes <= 0 && timeObj.seconds <= 0) {
        // timerFinished();
        clearInterval(interval);
      }
    });
  }, 1000);
}

// tells popup that timer is finished
function timerFinished() {
  alert("TIMER IS FINISHED YO!");
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
  // alert("new seconds:" + newSeconds);
  return { minutes: timeObj.minutes.toString(), seconds: newSeconds };
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

// function calculateTimeLeft(endTime) {
//   var now = new Date();
//   var timeLeft = millToSecs(endTime - now.getTime());
//   return timeLeft;
// }

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
