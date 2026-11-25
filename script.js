const STORAGE_KEY = "taskTrackerTasks";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCountNumber = document.querySelector("#task-count-number");
const filterButtons = document.querySelectorAll(".filter-button");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

let tasks = loadTasks();
let currentFilter = "all";

const THEME_KEY = "taskTrackerTheme";

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    themeToggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
    themeIcon.textContent = isDark ? "☀" : "☾";
}

applyTheme(getPreferredTheme());

themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
});

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(savedTasks)) {
            return [];
        }

        return savedTasks.filter((task) =>
            task &&
            typeof task.id !== "undefined" &&
            typeof task.text === "string"
        ).map((task) => ({
            id: String(task.id),
            text: task.text,
            completed: Boolean(task.completed)
        }));
    } catch (error) {
        return [];
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisibleTasks() {
    if (currentFilter === "pending") {
        return tasks.filter((task) => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter((task) => task.completed);
    }

    return tasks;
}

function renderTasks() {
    const visibleTasks = getVisibleTasks();
    taskList.replaceChildren();

    taskCountNumber.textContent = String(tasks.length);

    if (visibleTasks.length === 0) {
        const emptyState = document.createElement("li");
        emptyState.className = "empty-state";

        if (tasks.length === 0) {
            emptyState.textContent = "No tasks yet. Add your first task above.";
        } else if (currentFilter === "pending") {
            emptyState.textContent = "No pending tasks.";
        } else if (currentFilter === "completed") {
            emptyState.textContent = "No completed tasks yet.";
        } else {
            emptyState.textContent = "No tasks to display.";
        }

        taskList.append(emptyState);
        return;
    }

    visibleTasks.forEach((task) => {
        const taskItem = document.createElement("li");
        taskItem.className = "task-item";
        taskItem.dataset.taskId = task.id;

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.completed ? "pending" : "completed"}`);

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "task-delete";
        deleteButton.textContent = "\u00d7";
        deleteButton.setAttribute("aria-label", `Delete "${task.text}"`);

        taskItem.append(checkbox, taskText, deleteButton);
        taskList.append(taskItem);
    });
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (text === "") {
        taskInput.focus();
        return;
    }

    tasks.unshift({
        id: createTaskId(),
        text,
        completed: false
    });

    taskInput.value = "";
    saveTasks();
    renderTasks();
    taskInput.focus();
});

taskList.addEventListener("change", (event) => {
    if (!event.target.classList.contains("task-checkbox")) {
        return;
    }

    const taskItem = event.target.closest(".task-item");
    const task = tasks.find((item) => item.id === taskItem.dataset.taskId);

    if (!task) {
        return;
    }

    task.completed = event.target.checked;
    saveTasks();
    renderTasks();
});

taskList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".task-delete");

    if (!deleteButton) {
        return;
    }

    const taskItem = deleteButton.closest(".task-item");
    tasks = tasks.filter((task) => task.id !== taskItem.dataset.taskId);
    saveTasks();
    renderTasks();
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });

        renderTasks();
    });
});

renderTasks();