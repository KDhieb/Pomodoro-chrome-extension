// var timerPort = chrome.runtime.connect({ name: "timer" });
var savePort;

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name == "popup");
  port.onMessage.addListener(function (msg) {
    if (msg.command == "start") {
      // alert("start received!");
      port.postMessage({ command: "starting timer" });
      setTargetDate(1);
      savePort = port;
      startTimer();
    } else if ((msg.command = "pause")) {
      alert("pausing");
    }
  });
});

// to save the date of now + given minutes
function setTargetDate(minutes) {
  var endDate = new Date();
  endDate.setMinutes(endDate.getMinutes() + minutes);
  chrome.storage.local.set({ time: { end: endDate.getTime() } });
}

// to keep track of time left and save necessary vars
function pauseAndSave() {}

//  begins interval to update popup UI
function startTimer() {
  chrome.storage.local.get("time", (data) => {
    var endTime = data.time.end;
    var now = new Date();
    var timeLeft = millToSecs(endTime - now.getTime()); // in seconds
    // alert(`endTime ${endTime} now ${now.getTime()}`);
    const interval = setInterval(() => {
      // alert(timeLeft);
      var timeObj = getTimeStrings(timeLeft);
      updateUiWithNewTime(timeObj);
      if (timeLeft <= 0) {
        alert("should have stopped");
        alert(`timeleft: ${timeLeft}`);
        clearInterval(interval);
      }
      timeLeft--;
    }, 1000);
  });
}

// tells popup that timer is finished
function timerFinished() {}

function millToSecs(milliseconds) {
  return Math.floor(milliseconds / 1000);
}

// sends message to popup port with new minutes and seconds
function updateUiWithNewTime(timeObj) {
  savePort.postMessage({ command: "time update", time: timeObj });
}

// separates timeLeft to minutes and seconds and returns object containing string
function getTimeStrings(timeLeft) {
  var timeObj = {};
  timeObj.minutes = Math.floor(timeLeft / 60).toString();
  var secs = Math.floor(timeLeft % 60);
  timeObj.seconds = secs < 10 ? "0" + secs.toString() : secs.toString();
  return timeObj;
}
