var addTodoBtn = document.querySelector("#add-todo");
var todoField = document.querySelector("#todo-field");
var todoList = document.querySelector("#todo-list");
var clearTodosBtn = document.querySelector("#clear-todos");

window.onload = function () {
  refreshTodos();
};

chrome.browserAction.onClicked.addListener(function () {
  alert("working?");
});

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

// function refreshTodos() {
//   while (todoList.firstChild) todoList.removeChild(todoList.firstChild);
//   chrome.storage.local.get("todos", (data) => {
//     data.todos.forEach((todo) => {
//       var li = document.createElement("LI");
//       var text = document.createTextNode(todo);
//       li.appendChild(text);
//       todoList.prepend(li);
//     });
//     todoField.value = "";
//   });
// }

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
