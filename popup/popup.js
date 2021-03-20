var addTodoBtn = document.querySelector("#add-todo");
var todoField = document.querySelector("#todo-field");
var todoList = document.querySelector("#todo-list");
var clearTodosBtn = document.querySelector("#clear-todos");

window.onload = function () {
  refreshTodos();
  refreshTime();
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
  chrome.storage.local.clear();
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
var stopBtn = document.querySelector("#stop-timer");
var resetBtn = document.querySelector("#reset-timer");

const startTimer = () => {
  // chrome.storage.local
};

var port = chrome.runtime.connect({ name: "popup" });

startBtn.onclick = function () {
  port.postMessage({ status: "start" });
};

stopBtn.onclick = function () {
  port.postMessage({ status: "pause" });
};

resetBtn.onclick = function () {
  alert("reset button");
};

// timer.innerHTML = "testing"; how to edit inner text value
port.onMessage.addListener(function (msg) {
  if (msg.status == "starting timer") {
  } else if (msg.status == "time update") {
    // timer.innerHTML = `${msg.time.minutes}:${msg.time.seconds}`;
    updateTime(msg);
    // updateTimePromise(msg).then((timeObj) => {
    //   if (timeObj.time.minutes <= 0 && timeObj.time.seconds <= 0) {
    //     alert("TIMER FINISHED");
    //   }
    // });
  } else if (msg.status == "done") {
    alert("Timer finished! Break time!");
  }
});

function refreshTime() {
  chrome.runtime.sendMessage({ status: "refreshTime" }, (timeObj) => {
    updateTime(timeObj);
  });
}

function updateTime(timeObj) {
  timer.innerHTML = `${timeObj.time.minutes}:${timeObj.time.seconds}`;
  setTimeout(() => {
    if (timeObj.time.minutes <= 0 && timeObj.time.seconds <= 0) {
      alert("TIMER FINISHED");
    }
  }, 50);
}

// function updateTimePromise(timeObj) {
//   return new Promise((resolve, reject) => {
//     timer.innerHTML = `${timeObj.time.minutes}:${timeObj.time.seconds}`;
//     resolve(timeObj);
//   });
// }
