// var timerPort = chrome.runtime.connect({ name: "timer" });
var savePort;
var portConnected;
var paused = true;
var started = false;
var windowOpen = false;
var clearPrevious = false;

const chromeOnConnectListener = chrome.runtime.onConnect.addListener(function (
  port
) {
  console.assert(port.name == "popup");
  const chromeOnMessagePortListener = port.onMessage.addListener(function (
    msg
  ) {
    if (msg.status == "start") {
      // port.postMessage({ status: "starting timer" });
      startTimerCaller(port);
    } else if (msg.status == "pause" && !paused) {
      // pauseAndSave();
      startTimerCaller(port);
      // paused = true;
    } else if (msg.status == "refresh") {
      // alert("REFRESHED.");
      savePort = port;
      // startTimer();
      refreshTime();
    } else if (msg.status == "reset") {
      setTimeLeft(25, 0);
      paused = true;
      started = false;
      refreshTime();
    }
  });
});

// const chromeOnMessageListener = chrome.runtime.onMessage.addListener(function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request.status == "refreshTime") {
//     alert("refreshing!");
//     refreshTime();
//   }
// });

function startTimerCaller(port) {
  if (!started) {
    setTimeLeft(25, 0);
  }
  savePort = port;
  portConnected = true;
  startTimer();
}

function refreshTime() {
  updateStates();
  if (started && !paused) clearPrevious = true;
  updateButtonStatus();
  sendUpdatedTime();

  if (!paused) {
    startTimer();
  }
}

function updateButtonStatus() {
  savePort.postMessage({ status: "button status", paused: paused });
}

function sendUpdatedTime() {
  chrome.storage.local.get("timeLeft", (data) => {
    var timeLeft = data.timeLeft;

    var timeObj = {
      minutes: timeLeft.minutes.toString(),
      seconds: timeLeft.seconds.toString(),
    };
    updateUiWithNewTime(stringifyTime(timeObj));
  });
}

function updateStates() {
  windowOpen = true;
  chrome.storage.local.get("states", (data) => {
    started = data.states.started;
    paused = data.states.paused;
  });
}

function saveStates() {
  var states = { started: started, paused: paused };
  chrome.storage.local.set({ states: states });
}

function setTimeLeft(min, sec) {
  chrome.storage.local.set({ timeLeft: { minutes: min, seconds: sec } });
  var now = new Date().getTime();
  chrome.storage.local.set({ timeStamp: now });
}

function decrementTimeLeft() {
  chrome.storage.local.get("timeLeft", (data) => {
    // console.log("is this triggering");
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
// function pauseAndSave() {
//   paused = true;
//   // saveTimeLeft();
// }

function startTimer() {
  // if (paused) !
  // paused = false;
  if (!clearPrevious) paused = !paused;
  updateButtonStatus();

  started = true;
  // disconnectListener();
  const interval = setInterval(() => {
    chrome.storage.local.get("timeLeft", (data) => {
      if (paused) {
        clearInterval(interval);
      }
      console.log(clearPrevious);
      if (!paused && clearPrevious) {
        clearInterval(interval);
        clearPrevious = false;
        return;
      }

      var timeLeft = data.timeLeft;

      var timeObj = {
        minutes: timeLeft.minutes.toString(),
        seconds: timeLeft.seconds.toString(),
      };

      if (!paused) {
        decrementTimeLeft();
        if (windowOpen && portConnected) {
          updateUiWithNewTime(stringifyTime(timeObj));
          // setTimeout(() => {
          //   console.log("Updating time");
          // }, 50);
        }
      }
      if (timeLeft.minutes <= 0 && timeLeft.seconds <= 0) {
        timerFinished(windowOpen);
        clearInterval(interval);
      }
    });
  }, 1000);
}

// tells user that timer is finished
function timerFinished(windowOpen) {
  if (!windowOpen) {
    alert("TIMER IS FINISHED. COURTESY OF BACKGROUND.JS");
  } else {
    setTimeout(() => {
      alert("TIMER FINISHED. Popup open!");
    }, 50);
  }
  // if (windowOpen) {
  //   // alert("TIMER IS FINISHED YO!");
  //   savePort.postMessage({ status: "done" });
  // } else {
  //   alert("TIMER IS FINISHED. COURTESY OF BACKGROUND.JS");
  // }
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

// handle when popup is closed
chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function () {
    windowOpen = false;
    console.log("onDisconnect");
    // Do stuff that should happen when popup window closes here
  });
  windowOpen = true;
  console.log("onConnect");
});

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
