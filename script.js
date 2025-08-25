const form = document.querySelector('.form.js--form');
const formBtn = document.querySelector('.form__btn');
const ulWrapper = document.querySelector('.js--todos-wrapper');


const todos = JSON.parse(localStorage.getItem('todos')) || [];


function renderTodos() {
    ulWrapper.innerHTML = '';
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        const li = document.createElement('li');
        li.classList.add('todo-item');
        if (todo.completed) li.classList.add('todo-item--checked');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.dataset.idx = i;

        const span = document.createElement('span');
        span.classList.add('todo-item__description');
        span.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Видалити';
        deleteBtn.classList.add('todo-item__delete');
        deleteBtn.dataset.idx = i;

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        ulWrapper.appendChild(li);
    }
}



function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}


$(formBtn).on('click', function (event) {
    event.preventDefault();
    const formInput = $(form).find('input');
    if (formInput.val().trim()) {
        todos.push({
            text: formInput.val().trim(),
            completed: false
        });
        saveTodos();
        renderTodos();
        formInput.val('');
    }
});

ulWrapper.addEventListener('click', function (event) {
    const idx = event.target.dataset.idx;
    if (event.target.classList.contains('todo-item__delete')) {
        todos.splice(idx, 1);
        saveTodos();
        renderTodos();
    }
    if (event.target.type === 'checkbox') {
        todos[idx].completed = event.target.checked;
        saveTodos();
        renderTodos();
    }
});


renderTodos();

// modal for task ===
const taskModalEl = document.getElementById('taskModal');
const taskModal = new bootstrap.Modal(taskModalEl);
const taskModalBody = taskModalEl.querySelector('.modal-body');

// deleg
ulWrapper.addEventListener('click', function (event) {


    // ignoring delete and checkbox click
    if (event.target.classList.contains('todo-item__delete')) return;
    if (event.target.matches('input[type="checkbox"]')) return;

    const li = event.target.closest('.todo-item');
    if (!li) return;


    const text = li.querySelector('.todo-item__description')?.textContent?.trim() || '';
    if (!text) return;
    if (text === 'без модалки') return;

    taskModalBody.textContent = text; // past the text
    taskModal.show();
});
