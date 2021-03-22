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
      startTimerCaller(port);
    } else if (msg.status == "refresh") {
      savePort = port;
      refreshTime();
    } else if (msg.status == "reset") {
      // chrome.browserAction.setIcon({ path: { 19: "icons/tomato.png" } });
      // chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
      setTimeLeft(25, 0);
      paused = true;
      started = false;
      refreshTime();
    }
  });
});

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
  clearBrowserBadge();
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
  });
  windowOpen = true;
  console.log("onConnect");
});
