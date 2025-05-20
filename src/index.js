import './style.css';
import { format } from "date-fns";

// Todo Class - Represents a single todo item
class Todo {
  constructor(title, description, completed = false) {
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.createdAt = new Date();
  }

  toggleComplete() {
    this.completed = !this.completed;
  }
}

// TodoList Class - Manages the collection of todos
class TodoList {
  constructor(storage) {
    this.todos = [];
    this.storage = storage;
  }

  addTodo(todo) {
    this.todos.push(todo);
    this.saveToStorage();
  }

  removeTodo(index) {
    this.todos.splice(index, 1);
    this.saveToStorage();
  }

  toggleTodo(index) {
    this.todos[index].toggleComplete();
    this.saveToStorage();
  }

  saveToStorage() {
    this.storage.save('todos', this.todos);
  }

  loadFromStorage() {
    const data = this.storage.load('todos');
    if (data) {
      this.todos = data.map(todoData => {
        const todo = new Todo(
          todoData.title,
          todoData.description,
          todoData.completed
        );
        todo.createdAt = new Date(todoData.createdAt);
        return todo;
      });
    }
  }
}

// StorageService Class - Handles localStorage operations
class StorageService {
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

// TodoRenderer Class - Handles DOM rendering
class TodoRenderer {
  constructor(container, todoList) {
    this.container = container;
    this.todoList = todoList;
  }

  render() {
    this.container.innerHTML = "";

    if (this.todoList.todos.length === 0) {
      this.renderNoTasks();
      return;
    }

    this.todoList.todos.forEach((todo, index) => {
      this.container.appendChild(this.createTodoElement(todo, index));
    });
  }

  renderNoTasks() {
    const noTaskMessage = document.createElement('h1');
    noTaskMessage.textContent = "— NO TASK TODAY —";
    noTaskMessage.className = "no-task-message";
    this.container.appendChild(noTaskMessage);
  }

  createTodoElement(todo, index) {
    const todoElement = document.createElement('div');
    todoElement.className = `todo ${todo.completed ? 'completed' : ''}`;
    todoElement.innerHTML = `
      <h2 class="h2class">${todo.title}</h2>
      <p class="description">${todo.description}</p>
      <p class="status">Status: ${todo.completed ? "✅ Done" : "❌ Not Done"}</p>
      <p class="date">Created on: ${format(todo.createdAt, 'dd/MM/yyyy')}</p>
      <div class="buttons">
        <button class="toggle-button" data-index="${index}">Toggle Complete</button>
        <button class="DeleteToDo" data-index="${index}">Delete To do</button>
      </div>
    `;
    return todoElement;
  }
}

// ThemeManager Class - Manages theme switching
class ThemeManager {
  constructor() {
    this.darkModeButton = document.getElementById('dark');
    this.lightModeButton = document.getElementById('light');
    this.initializeTheme();
    this.setupEventListeners();
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      this.darkModeButton.style.display = 'none';
      this.lightModeButton.style.display = 'flex';
    } else {
      this.lightModeButton.style.display = 'none';
      this.darkModeButton.style.display = 'flex';
    }
  }

  setupEventListeners() {
    this.darkModeButton.addEventListener('click', () => this.setTheme('dark'));
    this.lightModeButton.addEventListener('click', () => this.setTheme('light'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// DialogManager Class - Handles dialog operations
class DialogManager {
  constructor(todoList, renderer) {
    this.dialog = document.getElementById('dialog');
    this.todoList = todoList;
    this.renderer = renderer;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('addbutton').addEventListener('click', () => this.dialog.showModal());
    document.getElementById('cancel-button').addEventListener('click', () => this.dialog.close());
    
    this.dialog.querySelector('form').addEventListener('submit', (e) => this.handleSubmit(e));
  }

  handleSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('todo-title').value;
    const description = document.getElementById('todo-description').value;

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    this.todoList.addTodo(new Todo(title, description));
    this.renderer.render();

    document.getElementById('todo-title').value = '';
    document.getElementById('todo-description').value = '';
    this.dialog.close();
  }
}

// EventHandler Class - Centralizes event handling
class EventHandler {
  constructor(todoList, renderer) {
    this.todoList = todoList;
    this.renderer = renderer;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('toggle-button')) {
        this.handleToggle(e);
      } else if (e.target.classList.contains('DeleteToDo')) {
        this.handleDelete(e);
      }
    });
  }

  handleToggle(e) {
    const index = e.target.getAttribute('data-index');
    this.todoList.toggleTodo(index);
    this.renderer.render();
  }

  handleDelete(e) {
    const index = e.target.getAttribute('data-index');
    this.todoList.removeTodo(index);
    this.renderer.render();
  }
}

// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  const storage = new StorageService();
  const todoList = new TodoList(storage);
  const renderer = new TodoRenderer(document.getElementById('todo-container'), todoList);

  // Load initial data
  todoList.loadFromStorage();

  // Initialize managers
  new ThemeManager();
  new DialogManager(todoList, renderer);
  new EventHandler(todoList, renderer);

  // Initial render
  renderer.render();

  // Add transition for smooth theme change
  document.documentElement.style.transition = 'background 0.5s ease, color 0.3s ease';
});