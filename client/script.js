// --------- DOM Elements ---------
const formEl = document.querySelector('.form.js--form');
const addButtonEl = document.querySelector('.form__btn');
const listEl = document.querySelector('.js--todos-wrapper');
const inputEl = formEl.querySelector('input[name="value"]');

// --------- Modal (Bootstrap) ---------
const taskModalEl = document.getElementById('taskModal');
const taskModal = new bootstrap.Modal(taskModalEl);
const taskModalBodyEl = taskModalEl.querySelector('.modal-body');

// --------- In-memory state ---------
let todoItems = []; // массив объектов: { _id, title, isDone }

// --------- API Client ---------
const TodoAPI = {
    async getAll() {
        const response = await fetch('/api/todos');
        if (!response.ok) throw new Error('Не вдалося завантажити список');
        const items = await response.json();
        return items;
    },

    async create(title) {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, isDone: false })
        });
        if (!response.ok) throw new Error('Не вдалося створити задачу');
        const createdItem = await response.json();
        return createdItem;
    },

    async update(id, patch) {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
        if (!response.ok) throw new Error('Не вдалося оновити задачу');
        const updatedItem = await response.json();
        return updatedItem;
    },

    async remove(id) {
        const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Не вдалося видалити задачу');
        const result = await response.json();
        return result;
    }
};

// --------- Render ---------
function renderTodoList() {
    listEl.innerHTML = '';

    for (const item of todoItems) {
        const listItemEl = document.createElement('li');
        listItemEl.className = 'todo-item' + (item.isDone ? ' todo-item--checked' : '');
        listItemEl.dataset.id = item._id;

        const checkboxEl = document.createElement('input');
        checkboxEl.type = 'checkbox';
        checkboxEl.checked = item.isDone;
        checkboxEl.className = 'todo-item__checkbox';

        const titleEl = document.createElement('span');
        titleEl.className = 'todo-item__description';
        titleEl.textContent = item.title;

        const deleteButtonEl = document.createElement('button');
        deleteButtonEl.className = 'todo-item__delete';
        deleteButtonEl.textContent = 'Видалити';

        listItemEl.append(checkboxEl, titleEl, deleteButtonEl);
        listEl.appendChild(listItemEl);
    }
}

// --------- Events ---------
// Create
addButtonEl.addEventListener('click', async (event) => {
    event.preventDefault();
    const title = (inputEl.value || '').trim();
    if (!title) return;

    try {
        addButtonEl.disabled = true;
        const createdItem = await TodoAPI.create(title);
        todoItems.unshift(createdItem);
        renderTodoList();
        inputEl.value = '';
    } catch (error) {
        console.error(error);
        alert(error.message || 'Помилка створення завдання');
    } finally {
        addButtonEl.disabled = false;
    }
});

// Delegation: toggle / delete / open modal
listEl.addEventListener('click', async (event) => {
    const rowEl = event.target.closest('.todo-item');
    if (!rowEl) return;

    const todoId = rowEl.dataset.id;

    // Delete
    if (event.target.classList.contains('todo-item__delete')) {
        try {
            await TodoAPI.remove(todoId);
            todoItems = todoItems.filter((t) => t._id !== todoId);
            renderTodoList();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Помилка видалення');
        }
        return;
    }

    // Toggle checkbox
    if (event.target.classList.contains('todo-item__checkbox')) {
        const nextIsDone = event.target.checked;
        try {
            const updatedItem = await TodoAPI.update(todoId, { isDone: nextIsDone });
            const idx = todoItems.findIndex((t) => t._id === todoId);
            if (idx !== -1) todoItems[idx] = updatedItem;
            renderTodoList();
        } catch (error) {
            console.error(error);
            event.target.checked = !nextIsDone; // откат визуально
            alert(error.message || 'Помилка оновлення статусу');
        }
        return;
    }

    // Open modal by clicking the row (кроме delete/checkbox)
    const currentItem = todoItems.find((t) => t._id === todoId);
    if (currentItem && currentItem.title && currentItem.title !== 'без модалки') {
        taskModalBodyEl.textContent = currentItem.title;
        taskModal.show();
    }
});

// --------- Init ---------
(async function initializeApp() {
    try {
        todoItems = await TodoAPI.getAll();
        renderTodoList();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Не вдалося завантажити список');
    }
})();
