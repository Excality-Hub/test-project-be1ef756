const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visual Kanban To-Do</title>
<style>
  :root {
    --todo-color: #6b7280;
    --inprogress-color: #2563eb;
    --done-color: #16a34a;
    --bg: #f3f4f6;
    --card-bg: #ffffff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: #111827;
  }
  header {
    background: #111827;
    color: #fff;
    padding: 1.25rem 1.5rem;
  }
  header h1 {
    margin: 0 0 0.75rem 0;
    font-size: 1.5rem;
  }
  #add-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  #add-form input {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #374151;
    font-size: 0.95rem;
  }
  #title-input {
    flex: 1 1 220px;
  }
  #notes-input {
    flex: 2 1 320px;
  }
  #add-form button {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    border: none;
    background: #2563eb;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  #add-form button:hover {
    background: #1d4ed8;
  }
  main {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .column {
    background: #e5e7eb;
    border-radius: 10px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }
  .column.drag-over {
    outline: 2px dashed #9ca3af;
    outline-offset: -4px;
  }
  .column-header {
    font-weight: 700;
    font-size: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    color: #fff;
  }
  .column[data-status="todo"] .column-header { background: var(--todo-color); }
  .column[data-status="in-progress"] .column-header { background: var(--inprogress-color); }
  .column[data-status="done"] .column-header { background: var(--done-color); }
  .cards {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .empty-placeholder {
    color: #9ca3af;
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
    font-size: 0.9rem;
  }
  .card {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    border-left: 4px solid var(--todo-color);
    cursor: grab;
  }
  .card.dragging {
    opacity: 0.5;
  }
  .column[data-status="todo"] .card { border-left-color: var(--todo-color); }
  .column[data-status="in-progress"] .card { border-left-color: var(--inprogress-color); }
  .column[data-status="done"] .card { border-left-color: var(--done-color); }
  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .card-title {
    font-weight: 600;
    font-size: 0.95rem;
    word-break: break-word;
  }
  .card.done-status .card-title {
    text-decoration: line-through;
    color: #6b7280;
  }
  .card-notes {
    margin-top: 0.35rem;
    font-size: 0.85rem;
    color: #4b5563;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .card-actions {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-shrink: 0;
  }
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.15rem 0.3rem;
    border-radius: 4px;
    line-height: 1;
  }
  .icon-btn:hover {
    background: #f3f4f6;
  }
  .done-toggle {
    accent-color: var(--done-color);
    width: 1.05rem;
    height: 1.05rem;
    cursor: pointer;
  }
</style>
</head>
<body>
<header>
  <h1>Kanban To-Do</h1>
  <form id="add-form">
    <input type="text" id="title-input" placeholder="Task title" required maxlength="200">
    <input type="text" id="notes-input" placeholder="Notes (optional)" maxlength="1000">
    <button type="submit">Add Task</button>
  </form>
</header>
<main id="board">
  <section class="column" data-status="todo">
    <div class="column-header">To Do</div>
    <div class="cards" id="cards-todo"></div>
  </section>
  <section class="column" data-status="in-progress">
    <div class="column-header">In Progress</div>
    <div class="cards" id="cards-in-progress"></div>
  </section>
  <section class="column" data-status="done">
    <div class="column-header">Done</div>
    <div class="cards" id="cards-done"></div>
  </section>
</main>
<script>
(function () {
  const STORAGE_KEY = 'todo-tasks';
  const STATUSES = ['todo', 'in-progress', 'done'];

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string');
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  let tasks = loadTasks();

  function tasksForStatus(status) {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => (a.order - b.order) || (a.createdAt - b.createdAt));
  }

  function render() {
    STATUSES.forEach(status => {
      const container = document.getElementById('cards-' + status);
      container.innerHTML = '';
      const list = tasksForStatus(status);
      if (list.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-placeholder';
        placeholder.textContent = 'No tasks yet';
        container.appendChild(placeholder);
        return;
      }
      list.forEach(task => container.appendChild(renderCard(task)));
    });
  }

  function renderCard(task) {
    const card = document.createElement('div');
    card.className = 'card' + (task.status === 'done' ? ' done-status' : '');
    card.draggable = true;
    card.dataset.id = task.id;

    const top = document.createElement('div');
    top.className = 'card-top';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = task.title;
    top.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const doneToggle = document.createElement('input');
    doneToggle.type = 'checkbox';
    doneToggle.className = 'done-toggle';
    doneToggle.checked = task.status === 'done';
    doneToggle.title = 'Mark done / not done';
    doneToggle.addEventListener('change', () => {
      task.status = doneToggle.checked ? 'done' : 'todo';
      task.order = nextOrder(task.status);
      saveTasks(tasks);
      render();
    });
    actions.appendChild(doneToggle);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete task';
    deleteBtn.textContent = '\\uD83D\\uDDD1\\uFE0F';
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks(tasks);
      render();
    });
    actions.appendChild(deleteBtn);

    top.appendChild(actions);
    card.appendChild(top);

    if (task.notes) {
      const notes = document.createElement('div');
      notes.className = 'card-notes';
      notes.textContent = task.notes;
      card.appendChild(notes);
    }

    card.addEventListener('dragstart', e => {
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    return card;
  }

  function nextOrder(status) {
    const list = tasksForStatus(status);
    return list.length === 0 ? 0 : Math.max(...list.map(t => t.order)) + 1;
  }

  document.querySelectorAll('.column').forEach(column => {
    const status = column.dataset.status;
    const cardsEl = column.querySelector('.cards');

    column.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('drag-over');

      const draggingEl = document.querySelector('.card.dragging');
      if (!draggingEl) return;
      const afterEl = getDragAfterElement(cardsEl, e.clientY);
      if (afterEl == null) {
        cardsEl.appendChild(draggingEl);
      } else {
        cardsEl.insertBefore(draggingEl, afterEl);
      }
    });

    column.addEventListener('dragleave', e => {
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
      }
    });

    column.addEventListener('drop', e => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      task.status = status;

      const orderedIds = Array.from(cardsEl.querySelectorAll('.card')).map(el => el.dataset.id);
      orderedIds.forEach((cardId, index) => {
        const t = tasks.find(tk => tk.id === cardId);
        if (t) t.order = index;
      });

      saveTasks(tasks);
      render();
    });
  });

  function getDragAfterElement(container, y) {
    const cards = Array.from(container.querySelectorAll('.card:not(.dragging)'));
    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  document.getElementById('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const titleInput = document.getElementById('title-input');
    const notesInput = document.getElementById('notes-input');
    const title = titleInput.value.trim();
    if (!title) return;
    const notes = notesInput.value.trim();

    const task = {
      id: crypto.randomUUID(),
      title,
      notes,
      status: 'todo',
      order: nextOrder('todo'),
      createdAt: Date.now(),
    };
    tasks.push(task);
    saveTasks(tasks);
    render();

    titleInput.value = '';
    notesInput.value = '';
    titleInput.focus();
  });

  render();
})();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response('OK', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    if (url.pathname === '/') {
      return new Response(HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=UTF-8' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
