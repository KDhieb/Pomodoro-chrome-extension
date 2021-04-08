// var timerPort = chrome.runtime.connect({ name: "timer" });
var savePort;
var portConnected;
var paused = true;
var started = false;
var windowOpen = false;
var clearPrevious = false;
var workMode = true;
var pausedMinutes = null;
var pausedSeconds = null;

chrome.runtime.onStartup.addListener(() => {
  resetTimeLeft();
});

const chromeOnConnectListener = chrome.runtime.onConnect.addListener(function (
  port
) {
  console.assert(port.name == "popup");
  port.onMessage.addListener(function (msg) {
    if (msg.status == "start") {
      pausedMinutes = msg.minutes;
      pausedSeconds = msg.seconds;
      startTimerCaller(port);
    } else if (msg.status == "refresh") {
      savePort = port;
      refreshTime();
    } else if (msg.status == "reset") {
      reset().then((value) => refreshTime());
    } else if (msg.status == "set") {
      var minutes = msg.minutes;
      console.log("set is called with " + minutes);
      saveResetTime(minutes, 0);
      setTimeLeft(minutes, 0);
    }
  });
});

function startTimerCaller(port) {
  if (!started) {
    resetTimeLeft();
  }
  // saveStates();
  savePort = port;
  portConnected = true;
  startTimer();
}

function reset() {
  return new Promise((resolve, reject) => {
    paused = true;
    started = false;
    resetTimeLeft();
    setTimeout(() => {
      resolve("resolved");
    }, 100);
  });
}

function refreshTime() {
  updateStates();
  clearBrowserBadge();
  if (started && !paused) clearPrevious = true;
  // if (started && paused) setTimeLeft(pausedMinutes, pausedSeconds);
  updateButtonStatus();
  sendUpdatedTime();
  if (!paused) {
    startTimer();
  }
}

function saveResetTime(min) {
  chrome.storage.local.set({ savedTime: { minutes: min, seconds: 0 } });
}

function resetTimeLeft() {
  var defaultValue = { minutes: 25, seconds: 0 };
  chrome.storage.local.get({ savedTime: defaultValue }, (data) => {
    setTimeLeft(data.savedTime.minutes, data.savedTime.seconds);
  });
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
}

function decrementTimeLeft() {
  chrome.storage.local.get("timeLeft", (data) => {
    var timeLeftObj = data.timeLeft;
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

function startTimer() {
  if (!clearPrevious) paused = !paused;
  if (paused) setTimeLeft(pausedMinutes, pausedSeconds);
  updateButtonStatus();

  started = true;
  const interval = setInterval(() => {
    chrome.storage.local.get("timeLeft", (data) => {
      if (paused) {
        clearInterval(interval);
      }
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

      if (!windowOpen) {
        updateBrowserBadge(timeObj);
      } else {
        clearBrowserBadge();
      }

      if (!paused) {
        decrementTimeLeft();
        stringTimeObj = stringifyTime(timeObj);
        if (windowOpen && portConnected) {
          updateUiWithNewTime(stringTimeObj);
        }
      }
      if (timeLeft.minutes <= 0 && timeLeft.seconds <= 0) {
        timerFinished();
        clearInterval(interval);
      }
    });
  }, 1000);
}

// tells user that timer is finished
function timerFinished() {
  clearBrowserBadge();
  alert("Timer finished. Time for a break! ");
}

function clearBrowserBadge() {
  chrome.browserAction.setBadgeText({ text: "" });
}

function updateBrowserBadge(timeObj) {
  if (timeObj.minutes == 0) {
    chrome.browserAction.setBadgeText({ text: "< 1" });
  } else {
    chrome.browserAction.setBadgeText({
      text: `${timeObj.minutes}`,
    });
  }
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

// handle when popup is closed
chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function () {
    windowOpen = false;
    saveStates();
    console.log("onDisconnect");
  });
  windowOpen = true;
  console.log("onConnect");
});
