var savePort;
var interval;
var running = false;
var windowOpen;

// * Handle app startup
chrome.runtime.onStartup.addListener(() => {
  setNewDefaultTime(25);
});

// * Open listener to handle requests from popup
const chromeOnConnectListener = chrome.runtime.onConnect.addListener(function (
  port
) {
  savePort = port;
  port.onMessage.addListener(function (msg) {
    if (msg.status == "start") {
      toggleTimer();
    } else if (msg.status == "refresh") {
      fetchAndSendUpdatedTime();
    } else if (msg.status == "reset") {
      resetTimer();
    } else if (msg.status == "set") {
      setNewDefaultTime(msg.minutes);
    }
  });
});

// * Send time to popup given minutes and seconds
function sendUpdatedTime(min, sec) {
  if (windowOpen) {
    var timeObj = {
      minutes: min.toString(),
      seconds: sec.toString(),
    };
    savePort.postMessage({ status: "time update", time: timeObj });
    updateBrowserBadge(min, sec);
  }
}

// * Fetch time from chrome storage and then send to popup
function fetchAndSendUpdatedTime() {
  if (windowOpen) {
    chrome.storage.local.get("timeLeft", (data) => {
      var timeLeft = data.timeLeft;
      var timeObj = {
        minutes: timeLeft.minutes.toString(),
        seconds: timeLeft.seconds.toString(),
      };
      savePort.postMessage({
        status: "time update",
        time: stringifyTime(timeObj),
      });
    });
  }
}

// * Toggle the timer on or off
function toggleTimer() {
  updateButtonStatus(running);
  if (running) {
    running = false;
    clearInterval(interval);
  } else {
    running = true;
    interval = setInterval(() => {
      chrome.storage.local.get("timeLeft", (data) => {
        sendUpdatedTime(data.timeLeft.minutes, data.timeLeft.seconds);
        decrementTimeLeft();
        ifFinished(data.timeLeft.minutes, data.timeLeft.seconds);
      });
    }, 1000);
  }
}

//* Check if timer is finished
function ifFinished(min, sec) {
  if (min <= 0 && sec <= 0) {
    clearInterval(interval);
    clearBrowserBadge();
    alert("Timer finished. Time for a break!");
  }
}

// * Reset timer to default stored value
function resetTimer() {
  clearInterval(interval);
  var defaultValue = { minutes: 25, seconds: 0 };
  chrome.storage.local.get({ savedTime: defaultValue }, (data) => {
    setTimeLeft(data.savedTime.minutes, 0);
    sendUpdatedTime(data.savedTime.minutes, 0);
    clearBrowserBadge();
    running = false;
    updateButtonStatus(!running);
  });
}

// * Update remaining time left in chrome storage
function setTimeLeft(min, sec) {
  chrome.storage.local.set({ timeLeft: { minutes: min, seconds: sec } });
}

// * Set new default time for when timer is reset
function setNewDefaultTime(min) {
  chrome.storage.local.set({ savedTime: { minutes: min, seconds: 0 } });
  chrome.storage.local.set({ timeLeft: { minutes: min, seconds: 0 } });
  sendUpdatedTime();
}

// * Update popup with current status of play button
function updateButtonStatus(paused) {
  if (windowOpen) {
    savePort.postMessage({ status: "button status", paused: paused });
  }
}

//* Decrement time left by 1 second
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

// * Update Chrome browser badge with minutes remaining
function updateBrowserBadge(min, sec) {
  if (min == 0) {
    chrome.browserAction.setBadgeText({ text: "< 1" });
  } else {
    chrome.browserAction.setBadgeText({
      text: `${min}`,
    });
  }
}

// * Clear Chrome's browser badge
function clearBrowserBadge() {
  chrome.browserAction.setBadgeText({ text: "" });
}

// * Convert time to string and adjust for single digits or 0
function stringifyTime(timeObj) {
  newSeconds =
    timeObj.seconds < 10 ? `0${timeObj.seconds}` : timeObj.seconds.toString();
  return { minutes: timeObj.minutes.toString(), seconds: newSeconds };
}

// * Handle when popup window is open or closed
chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function () {
    //* onDisconnect
    windowOpen = false;
  });
  //* onConnect
  windowOpen = true;
  updateButtonStatus(!running);
});
