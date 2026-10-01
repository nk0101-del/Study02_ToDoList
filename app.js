// 생성 일시: 2026-10-01 02:19 KST
const STORAGE_KEY = 'todos';
const CATEGORIES = { work: '업무', personal: '개인', study: '공부' };

let todos = load();
let filter = 'all';
let editingId = null;

const $ = (id) => document.getElementById(id);

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data.filter((t) => t && typeof t.text === 'string' && CATEGORIES[t.category]);
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    // 저장 불가 환경에서도 앱은 계속 동작한다.
  }
}

function addTodo(text, category) {
  todos.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 6), text, category, done: false, createdAt: Date.now() });
  save();
  render();
}

function updateTodo(id, changes) {
  todos = todos.map((t) => (t.id === id ? { ...t, ...changes } : t));
  save();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  save();
  render();
}

function renderProgress() {
  const percent = (list) => (list.length ? Math.round((list.filter((t) => t.done).length / list.length) * 100) : 0);
  const done = todos.filter((t) => t.done).length;
  const total = percent(todos);
  $('progress-text').textContent = `${done} / ${todos.length} 완료 (${total}%)`;
  $('progress-bar').style.width = total + '%';

  const ul = $('category-progress');
  ul.textContent = '';
  for (const [key, label] of Object.entries(CATEGORIES)) {
    const items = todos.filter((t) => t.category === key);
    const li = document.createElement('li');
    li.textContent = `${label} ${items.filter((t) => t.done).length}/${items.length} (${percent(items)}%)`;
    ul.appendChild(li);
  }
}

function renderItem(t) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (t.done ? ' done' : '');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = t.done;
  check.setAttribute('aria-label', '완료 체크');
  check.addEventListener('change', () => updateTodo(t.id, { done: check.checked }));
  li.appendChild(check);

  if (editingId === t.id) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = t.text;
    input.setAttribute('aria-label', '내용 수정');
    const select = document.createElement('select');
    select.setAttribute('aria-label', '카테고리 수정');
    for (const [key, label] of Object.entries(CATEGORIES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = label;
      opt.selected = key === t.category;
      select.appendChild(opt);
    }
    const commit = () => {
      const text = input.value.trim();
      if (!text) return;
      editingId = null;
      updateTodo(t.id, { text, category: select.value });
    };
    const cancel = () => { editingId = null; render(); };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') cancel();
    });
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '저장';
    saveBtn.addEventListener('click', commit);
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.addEventListener('click', cancel);
    li.append(input, select, saveBtn, cancelBtn);
    setTimeout(() => input.focus(), 0);
    return li;
  }

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = t.text;
  const badge = document.createElement('span');
  badge.className = 'badge ' + t.category;
  badge.textContent = CATEGORIES[t.category];
  const editBtn = document.createElement('button');
  editBtn.textContent = '수정';
  editBtn.addEventListener('click', () => { editingId = t.id; render(); });
  const delBtn = document.createElement('button');
  delBtn.textContent = '삭제';
  delBtn.addEventListener('click', () => {
    if (confirm('이 할 일을 삭제할까요?')) deleteTodo(t.id);
  });
  li.append(text, badge, editBtn, delBtn);
  return li;
}

function render() {
  renderProgress();
  const visible = todos.filter((t) => filter === 'all' || t.category === filter);
  const list = $('todo-list');
  list.textContent = '';
  visible.forEach((t) => list.appendChild(renderItem(t)));
  $('empty').hidden = visible.length > 0;
  document.querySelectorAll('#filters button').forEach((b) => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
}

$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('add-text').value.trim();
  if (!text) return;
  addTodo(text, $('add-category').value);
  $('add-text').value = '';
  $('add-text').focus();
});

$('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  render();
});

render();
