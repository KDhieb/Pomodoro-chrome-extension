var addTodoBtn = document.querySelector("#add-todo");
var todoField = document.querySelector("#todo-field");
var todoList = document.querySelector("#todo-list");
var clearTodosBtn = document.querySelector("#clear-todos");

window.onload = function () {
  refreshTodos();
  refreshTime();
  setTimeout(() => {}, 1);
  enableClickShield();
  setMinuteListener();
};

// /TODO LIST IMPLEMENTATION

function refreshTodos() {
  while (todoList.firstChild) todoList.removeChild(todoList.firstChild);
  chrome.storage.local.get("todos", (data) => {
    var notDoneTodos = data.todos.filter((obj) => {
      return obj.done === false;
    });

    var doneTodos = data.todos.filter((obj) => {
      return obj.done === true;
    });

    var combined = doneTodos.concat(notDoneTodos);

    combined.forEach((todo) => {
      var li = document.createElement("LI");
      var text = document.createTextNode(todo.title);
      var btn = document.createElement("a");
      btn.onclick = () => {
        changeTodoStatus(todo);
      };
      btn.style.outline = "None";

      if (todo.done === true) {
        var del = document.createElement("DEL");
        del.appendChild(text);
        btn.appendChild(del);
      } else {
        var textDecor = document.createElement("text");
        textDecor.appendChild(text);
        btn.appendChild(textDecor);
      }
      li.appendChild(btn);
      todoList.prepend(li);
    });

    todoField.value = "";
  });
}

function changeTodoStatus(obj) {
  chrome.storage.local.get("todos", (data) => {
    let arr = data.todos;
    var objIndex = arr.findIndex((curr) => {
      return curr.title === obj.title && curr.done === obj.done;
    });
    obj.done = !obj.done;
    arr[objIndex] = obj;
    chrome.storage.local.set({ todos: arr });
    refreshTodos();
  });
}

// * Clear all todos
clearTodosBtn.onclick = function () {
  // chrome.storage.local.clear();
  chrome.storage.local.set({ todos: [] });
  refreshTodos();
};

// * Add Todo
addTodoBtn.onclick = function () {
  let todo = { title: todoField.value, done: false };
  if (todo.title != "") {
    chrome.storage.local.get("todos", (data) => {
      if (typeof data.todos === "undefined") {
        var todoArray = [todo];
        chrome.storage.local.set({ todos: todoArray }, () => {});
      } else {
        data.todos.push(todo);
        chrome.storage.local.set({ todos: data.todos }, () => {});
      }
      refreshTodos();
    });
  }
};

//  TIMER IMPLEMENTATION

var timerMin = document.querySelector("#timer-min");
var timerSec = document.querySelector("#timer-sec");
var startBtn = document.querySelector("#start-timer");
var resetBtn = document.querySelector("#reset-timer");

var port = chrome.runtime.connect({ name: "popup" });

// * Sending messages to background script
startBtn.onclick = function () {
  var min = timerMin.innerHTML;
  var sec = timerSec.innerHTML;
  port.postMessage({ status: "start", minutes: min, seconds: sec });
};

resetBtn.onclick = function () {
  port.postMessage({ status: "reset" });
};

function setTime(minutes, seconds) {
  port.postMessage({ status: "set", minutes: minutes, seconds: seconds });
}

function refreshTime() {
  port.postMessage({ status: "refresh" });
}

// * Port for receiving messages from background script
port.onMessage.addListener(function (msg) {
  if (msg.status == "time update") {
    updateTime(msg);
  } else if (msg.status == "done") {
    alert("Timer is done!");
  } else if (msg.status == "button status") {
    if (msg.paused) {
      startBtn.innerHTML = "&#9658;";
      timerMin.contentEditable = "true";
    } else {
      startBtn.innerHTML = "&#9616;&nbsp;&#9612;";
      timerMin.contentEditable = "false";
    }
  }
});

function updateTime(timeObj) {
  timerMin.innerHTML = `${timeObj.time.minutes}`;
  var seconds = parseInt(timeObj.time.seconds);
  if (seconds < 10) seconds = `0${seconds}`;
  timerSec.innerHTML = `${seconds}`;
}

function enableClickShield() {
  startBtn.addEventListener("click", function () {
    disableButton(true);
    setTimeout(function () {
      disableButton(false);
    }, 900);
  });
}

function disableButton(state) {
  startBtn.disabled = state;
}

var collapseBtn = document.getElementById("collapsible");
var collapseText = document.getElementById("collapsible-text");
var topWrapper = document.getElementById("top-wrapper");
var bottomContainer = document.getElementById("bottom-container");

toggle = false;
collapseBtn.onclick = function () {
  toggle = !toggle;
  if (toggle) {
    bottomContainer.style.display = "block";
    bottomContainer.style.height = "320px";
    collapseText.innerHTML = "-";
  } else {
    bottomContainer.style.display = "none";
    bottomContainer.style.height = "50px";
    collapseText.innerHTML = "+";
  }
};

// change time
function setMinuteListener(keyup, blur) {
  timerMin.addEventListener("keyup", keyup);
  timerMin.addEventListener("delete", keyup);
  timerMin.addEventListener("blur", blur);
}

var keyChange = false;

setMinuteListener(
  () => {
    keyChange = true;
  },
  () => {
    if (keyChange) {
      keyChange = false;
      var minuteValue = timerMin.innerHTML.trim();
      if (isValidNumber(minuteValue)) {
        timerSec.innerHTML = "00";
        port.postMessage({ status: "set", minutes: parseInt(minuteValue) });
      } else {
        timerMin.innerHTML = "25";
        port.postMessage({ status: set, minutes: 25 });
      }
    }
  }
);

function isValidNumber(string) {
  return /^\d+$/.test(string);
}

document.getElementById("settings").onclick = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
};
