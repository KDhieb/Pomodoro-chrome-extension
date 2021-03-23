var addTodoBtn = document.querySelector("#add-todo");
var todoField = document.querySelector("#todo-field");
var todoList = document.querySelector("#todo-list");
var clearTodosBtn = document.querySelector("#clear-todos");

window.onload = function () {
  refreshTodos();
  refreshTime();
  setTimeout(() => {
    console.log("Refreshing time");
  }, 1);
  enableClickShield();
};

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
    console.log(`Changed status of object: ${obj.title}`);
    refreshTodos();
  });
}

// Clear all todos
clearTodosBtn.onclick = function () {
  // chrome.storage.local.clear();
  chrome.storage.local.set({ todos: [] });
  refreshTodos();
};

// Add Todo
addTodoBtn.onclick = function () {
  let todo = { title: todoField.value, done: false };
  // let todo = todoField.value;
  if (todo.title != "") {
    chrome.storage.local.get("todos", (data) => {
      if (typeof data.todos === "undefined") {
        var todoArray = [todo];
        chrome.storage.local.set({ todos: todoArray }, () => {
          console.log(`First todo added: ${todo}`);
        });
      } else {
        data.todos.push(todo);
        chrome.storage.local.set({ todos: data.todos }, () => {
          console.log(`New todo added: ${todo}`);
        });
      }
      refreshTodos();
    });
  }
};

// Timer Implementation

var timer = document.querySelector("#timer");
var startBtn = document.querySelector("#start-timer");
// var stopBtn = document.querySelector("#stop-timer");
var resetBtn = document.querySelector("#reset-timer");

const startTimer = () => {
  // chrome.storage.local
};

var port = chrome.runtime.connect({ name: "popup" });

startBtn.onclick = function () {
  port.postMessage({ status: "start" });
};

resetBtn.onclick = function () {
  port.postMessage({ status: "reset" });
};

// timer.innerHTML = "testing"; how to edit inner text value
port.onMessage.addListener(function (msg) {
  if (msg.status == "starting timer") {
  } else if (msg.status == "time update") {
    updateTime(msg);
  } else if (msg.status == "done") {
    console.log("done");
  } else if (msg.status == "button status") {
    if (msg.paused) {
      // startBtn.innerHTML = "&#9616;&nbsp;&#9612;";
      startBtn.innerHTML = "&#9658;";
    } else {
      startBtn.innerHTML = "&#9616;&nbsp;&#9612;";
      // startBtn.innerHTML = "&#9658;";
    }
  }
});

function refreshTime() {
  port.postMessage({ status: "refresh" });
}

function updateTime(timeObj) {
  timer.innerHTML = `${timeObj.time.minutes}:${timeObj.time.seconds}`;
  setTimeout(() => {
    if (timeObj.time.minutes <= 0 && timeObj.time.seconds <= 0) {
      // alert("TIMER FINISHED");
    }
  }, 50);
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
    // topWrapper.style.height = "800px";
    bottomContainer.style.display = "block";
    bottomContainer.style.height = "320px";
    collapseText.innerHTML = "-";
  } else {
    // topWrapper.style.height = "250px";
    bottomContainer.style.display = "none";
    bottomContainer.style.height = "50px";
    collapseText.innerHTML = "+";
  }
};

var addTodoBtn = document.getElementById;
