// var timerPort = chrome.runtime.connect({ name: "timer" });
var savePort;
var portConnected;
var paused = true;
var started = false;
var windowOpen = false;
var clearPrevious = false;
var workMode = true;

chrome.runtime.onStartup.addListener(() => {
  resetTimeLeft();
});

const chromeOnConnectListener = chrome.runtime.onConnect.addListener(function (
  port
) {
  console.assert(port.name == "popup");
  const chromeOnMessagePortListener = port.onMessage.addListener(function (
    msg
  ) {
    if (msg.status == "start") {
      startTimerCaller(port);
    } else if (msg.status == "refresh") {
      savePort = port;
      refreshTime();
    } else if (msg.status == "reset") {
      // chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
      // setTimeLeft(25, 0);
      reset().then((value) => refreshTime());
      // resetTimeLeft();
      // // paused = true;
      // started = false;
      // refreshTime();
    } else if (msg.status == "set") {
      var minutes = msg.minutes;
      // var seconds = msg.seconds;
      // saveTime(minutes, 0);
      console.log("set is called with " + minutes);
      saveResetTime(minutes, 0);
      setTimeLeft(minutes, 0);
    }
  });
});

function startTimerCaller(port) {
  if (!started) {
    // setTimeLeft(25, 0);
    resetTimeLeft();
  }
  savePort = port;
  portConnected = true;
  startTimer();
}

function reset() {
  return new Promise((resolve, reject) => {
    paused = true;
    started = false;
    resetTimeLeft();
    // resolve("resolved");
    setTimeout(() => {
      resolve("resolved");
    }, 100);
  });
}

function refreshTime() {
  updateStates();
  clearBrowserBadge();
  if (started && !paused) clearPrevious = true;
  updateButtonStatus();
  sendUpdatedTime();
  // sendSavedTime(); ADD THIS
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
  // chrome.storage.local.get("savedTime", (data) => {
  //   setTimeLeft(data.minutes, data.seconds);
  // });
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
  // var now = new Date().getTime();
  // chrome.storage.local.set({ timeStamp: now });
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

      if (!paused) {
        decrementTimeLeft();
        stringTimeObj = stringifyTime(timeObj);
        updateBrowserBadge(stringTimeObj);
        if (windowOpen && portConnected) {
          updateUiWithNewTime(stringTimeObj);
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
  clearBrowserBadge();
  if (!windowOpen) {
    alert("TIMER IS FINISHED. COURTESY OF BACKGROUND.JS");
  } else {
    setTimeout(() => {
      alert("TIMER FINISHED. Popup open!");
    }, 50);
  }
}

function clearBrowserBadge() {
  chrome.browserAction.setBadgeText({ text: "" });
}

function updateBrowserBadge(timeObj) {
  // chrome.browserAction.setIcon({ path: "icons/tomato.png" });
  if (timeObj.minutes == 0) {
    chrome.browserAction.setBadgeText({ text: "< 1" });
  } else {
    chrome.browserAction.setBadgeText({
      text: `${timeObj.minutes}`,
    });
  }
}

function flipBrowserIcon() {
  if (workMode) {
    chrome.browserAction.setIcon({ path: "icons/20x20-g.png" });
  } else {
    chrome.browserAction.setIcon({ path: "icons/20x20.png" });
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
    console.log("onDisconnect");
  });
  windowOpen = true;
  console.log("onConnect");
});
