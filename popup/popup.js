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
    data.todos.forEach((todo) => {
      var li = document.createElement("LI");
      var text = document.createTextNode(todo);
      li.appendChild(text);
      todoList.prepend(li);
    });
    todoField.value = "";
  });
}

// Clear all todos
clearTodosBtn.onclick = function () {
  chrome.storage.local.clear();
  refreshTodos();
};

// Add Todo
addTodoBtn.onclick = function () {
  let todo = todoField.value;
  if (todo != "") {
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
