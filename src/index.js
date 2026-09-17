function seedRecipes() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: 'Classic Margherita Pizza',
      image: 'https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=800',
      tags: ['italian', 'vegetarian', 'dinner'],
      ingredients: [
        '1 pizza dough ball',
        '1/2 cup tomato sauce',
        '8 oz fresh mozzarella, sliced',
        'Fresh basil leaves',
        '2 tbsp olive oil',
        'Salt to taste',
      ],
      steps: [
        'Preheat oven to 500°F (260°C) with a pizza stone if available.',
        'Roll out the dough on a floured surface into a 12-inch circle.',
        'Spread tomato sauce evenly, leaving a border for the crust.',
        'Arrange mozzarella slices over the sauce.',
        'Bake for 8-10 minutes until crust is golden and cheese is bubbly.',
        'Top with fresh basil, drizzle with olive oil, and season with salt.',
      ],
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Creamy Chicken Alfredo',
      image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800',
      tags: ['italian', 'pasta', 'dinner'],
      ingredients: [
        '12 oz fettuccine pasta',
        '2 boneless chicken breasts, sliced',
        '2 cups heavy cream',
        '1 cup grated parmesan cheese',
        '3 cloves garlic, minced',
        '2 tbsp butter',
        'Salt and pepper to taste',
      ],
      steps: [
        'Cook fettuccine according to package instructions; drain and set aside.',
        'Season chicken with salt and pepper, then sauté in butter until cooked through.',
        'Remove chicken and set aside. Add garlic to the pan and cook until fragrant.',
        'Pour in heavy cream and bring to a gentle simmer.',
        'Whisk in parmesan cheese until sauce thickens.',
        'Return chicken to the pan, add pasta, and toss to coat evenly.',
      ],
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Fresh Garden Salad',
      image: '',
      tags: ['salad', 'vegetarian', 'healthy', 'lunch'],
      ingredients: [
        '4 cups mixed greens',
        '1 cucumber, sliced',
        '1 cup cherry tomatoes, halved',
        '1/2 red onion, thinly sliced',
        '1/4 cup feta cheese, crumbled',
        '3 tbsp olive oil',
        '1 tbsp red wine vinegar',
        'Salt and pepper to taste',
      ],
      steps: [
        'Combine mixed greens, cucumber, tomatoes, and red onion in a large bowl.',
        'Sprinkle feta cheese over the top.',
        'Whisk together olive oil, red wine vinegar, salt, and pepper.',
        'Drizzle dressing over the salad and toss gently before serving.',
      ],
      createdAt: now,
    },
  ];
}

let recipes = null;

function getRecipes() {
  if (recipes === null) {
    recipes = seedRecipes();
  }
  return recipes;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function toSummary(r) {
  return {
    id: r.id,
    title: r.title,
    image: r.image,
    tags: r.tags,
    summary: r.ingredients.slice(0, 3).join(', ') + (r.ingredients.length > 3 ? '…' : ''),
  };
}

function validateRecipeInput(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body';
  }
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return 'Title is required';
  }
  if (!Array.isArray(body.ingredients) || body.ingredients.filter((i) => typeof i === 'string' && i.trim() !== '').length === 0) {
    return 'At least one ingredient is required';
  }
  if (!Array.isArray(body.steps) || body.steps.filter((s) => typeof s === 'string' && s.trim() !== '').length === 0) {
    return 'At least one step is required';
  }
  return null;
}

function normalizeRecipeInput(body) {
  return {
    title: body.title.trim(),
    image: typeof body.image === 'string' ? body.image.trim() : '',
    tags: Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter((t) => t !== '')
      : [],
    ingredients: body.ingredients.map((i) => String(i).trim()).filter((i) => i !== ''),
    steps: body.steps.map((s) => String(s).trim()).filter((s) => s !== ''),
  };
}

const APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recipe Book</title>
<style>
  :root {
    --primary: #d97706;
    --primary-dark: #b45309;
    --bg: #fffbf5;
    --card-bg: #ffffff;
    --text: #1f2937;
    --muted: #6b7280;
    --border: #e5e7eb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  header {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  header h1 {
    margin: 0;
    font-size: 1.75rem;
  }
  .btn {
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    transition: transform 0.1s ease, background 0.15s ease;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary {
    background: #fff;
    color: var(--primary-dark);
  }
  .btn-primary:hover { background: #fef3e2; }
  .btn-secondary {
    background: var(--border);
    color: var(--text);
  }
  .btn-secondary:hover { background: #d1d5db; }
  .btn-danger {
    background: #dc2626;
    color: #fff;
  }
  .btn-danger:hover { background: #b91c1c; }
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem 2rem 3rem;
  }
  .toolbar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .toolbar input, .toolbar select {
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-size: 0.95rem;
  }
  #search-input { flex: 1 1 260px; }
  #tag-filter { flex: 0 1 200px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.25rem;
  }
  .card {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    display: flex;
    flex-direction: column;
  }
  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
  .card-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
    background: #f3f4f6;
  }
  .card-image-placeholder {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #fde8c8, #fbd38d);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b45309;
    font-size: 2rem;
  }
  .card-body {
    padding: 0.9rem 1rem 1.1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .card-title {
    font-weight: 700;
    font-size: 1.05rem;
    margin: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip {
    background: #fef3e2;
    color: var(--primary-dark);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }
  .empty-state {
    text-align: center;
    color: var(--muted);
    padding: 3rem 1rem;
    font-size: 1.05rem;
  }
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .detail-actions {
    display: flex;
    gap: 0.6rem;
  }
  .detail-image {
    width: 100%;
    max-height: 340px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 1.25rem;
  }
  .detail-image-placeholder {
    width: 100%;
    height: 240px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fde8c8, #fbd38d);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b45309;
    font-size: 3rem;
    margin-bottom: 1.25rem;
  }
  .detail-section {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .detail-section h2 {
    margin-top: 0;
    font-size: 1.15rem;
  }
  .detail-section ul, .detail-section ol {
    padding-left: 1.25rem;
    line-height: 1.7;
  }
  .back-link {
    background: none;
    border: none;
    color: var(--primary-dark);
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 0.4rem 0;
    margin-bottom: 1rem;
  }
  form.recipe-form {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 640px;
  }
  form.recipe-form label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
    font-size: 0.9rem;
  }
  form.recipe-form input, form.recipe-form textarea {
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-size: 0.95rem;
    font-family: inherit;
    font-weight: 400;
  }
  form.recipe-form textarea {
    min-height: 100px;
    resize: vertical;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .form-error {
    background: #fee2e2;
    color: #b91c1c;
    padding: 0.7rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    display: none;
  }
  .form-error.visible { display: block; }
  .hidden { display: none !important; }
</style>
</head>
<body>
<header>
  <h1>📖 Recipe Book</h1>
  <button class="btn btn-primary" id="add-recipe-btn">+ Add Recipe</button>
</header>
<main>
  <section id="view-gallery">
    <div class="toolbar">
      <input type="text" id="search-input" placeholder="Search by title or ingredient...">
      <select id="tag-filter">
        <option value="">All tags</option>
      </select>
    </div>
    <div class="grid" id="recipe-grid"></div>
  </section>

  <section id="view-detail" class="hidden">
    <button class="back-link" id="detail-back-btn">&larr; Back to recipes</button>
    <div id="detail-content"></div>
  </section>

  <section id="view-form" class="hidden">
    <button class="back-link" id="form-back-btn">&larr; Back to recipes</button>
    <h2 id="form-title">Add Recipe</h2>
    <div class="form-error" id="form-error"></div>
    <form class="recipe-form" id="recipe-form">
      <label>Title
        <input type="text" id="field-title" required>
      </label>
      <label>Image URL
        <input type="text" id="field-image" placeholder="https://...">
      </label>
      <label>Tags (comma-separated)
        <input type="text" id="field-tags" placeholder="italian, dinner, vegetarian">
      </label>
      <label>Ingredients (one per line)
        <textarea id="field-ingredients"></textarea>
      </label>
      <label>Steps (one per line)
        <textarea id="field-steps"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="form-submit-btn">Save Recipe</button>
        <button type="button" class="btn btn-secondary" id="form-cancel-btn">Cancel</button>
      </div>
    </form>
  </section>
</main>
<script>
(function () {
  const state = {
    recipes: [],
    editingId: null,
  };

  const galleryView = document.getElementById('view-gallery');
  const detailView = document.getElementById('view-detail');
  const formView = document.getElementById('view-form');
  const grid = document.getElementById('recipe-grid');
  const searchInput = document.getElementById('search-input');
  const tagFilter = document.getElementById('tag-filter');
  const detailContent = document.getElementById('detail-content');
  const formErrorEl = document.getElementById('form-error');
  const recipeForm = document.getElementById('recipe-form');
  const formTitleEl = document.getElementById('form-title');

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function showView(view) {
    galleryView.classList.add('hidden');
    detailView.classList.add('hidden');
    formView.classList.add('hidden');
    view.classList.remove('hidden');
  }

  async function fetchRecipes() {
    const q = searchInput.value.trim();
    const tag = tagFilter.value;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    const res = await fetch('/api/recipes?' + params.toString());
    const data = await res.json();
    state.recipes = data;
    renderGrid();
    renderTagOptions();
  }

  function renderTagOptions() {
    const currentValue = tagFilter.value;
    const allTags = new Set();
    state.recipes.forEach((r) => (r.tags || []).forEach((t) => allTags.add(t)));
    const sorted = Array.from(allTags).sort();
    tagFilter.innerHTML = '<option value="">All tags</option>' +
      sorted.map((t) => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('');
    if (sorted.includes(currentValue)) {
      tagFilter.value = currentValue;
    }
  }

  function renderGrid() {
    if (state.recipes.length === 0) {
      grid.innerHTML = '<div class="empty-state">No recipes found.</div>';
      return;
    }
    grid.innerHTML = state.recipes.map((r) => {
      const image = r.image
        ? '<img class="card-image" src="' + esc(r.image) + '" alt="' + esc(r.title) + '">'
        : '<div class="card-image-placeholder">🍽️</div>';
      const chips = (r.tags || []).map((t) => '<span class="chip">' + esc(t) + '</span>').join('');
      return '<div class="card" data-id="' + esc(r.id) + '">' +
        image +
        '<div class="card-body">' +
        '<h3 class="card-title">' + esc(r.title) + '</h3>' +
        '<div class="chips">' + chips + '</div>' +
        '</div></div>';
    }).join('');

    grid.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => openDetail(card.dataset.id));
    });
  }

  async function openDetail(id) {
    const res = await fetch('/api/recipes/' + encodeURIComponent(id));
    if (!res.ok) {
      alert('Recipe not found');
      return;
    }
    const r = await res.json();
    renderDetail(r);
    showView(detailView);
  }

  function renderDetail(r) {
    const image = r.image
      ? '<img class="detail-image" src="' + esc(r.image) + '" alt="' + esc(r.title) + '">'
      : '<div class="detail-image-placeholder">🍽️</div>';
    const chips = (r.tags || []).map((t) => '<span class="chip">' + esc(t) + '</span>').join('');
    const ingredients = (r.ingredients || []).map((i) => '<li>' + esc(i) + '</li>').join('');
    const steps = (r.steps || []).map((s) => '<li>' + esc(s) + '</li>').join('');

    detailContent.innerHTML =
      '<div class="detail-header">' +
      '<div><h2 style="margin:0 0 0.5rem 0;">' + esc(r.title) + '</h2><div class="chips">' + chips + '</div></div>' +
      '<div class="detail-actions">' +
      '<button class="btn btn-secondary" id="edit-btn">Edit</button>' +
      '<button class="btn btn-danger" id="delete-btn">Delete</button>' +
      '</div></div>' +
      image +
      '<div class="detail-section"><h2>Ingredients</h2><ul>' + ingredients + '</ul></div>' +
      '<div class="detail-section"><h2>Steps</h2><ol>' + steps + '</ol></div>';

    document.getElementById('edit-btn').addEventListener('click', () => openForm(r));
    document.getElementById('delete-btn').addEventListener('click', () => deleteRecipe(r.id));
  }

  async function deleteRecipe(id) {
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    const res = await fetch('/api/recipes/' + encodeURIComponent(id), { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      showView(galleryView);
      fetchRecipes();
    } else {
      alert('Failed to delete recipe');
    }
  }

  function openForm(recipe) {
    formErrorEl.classList.remove('visible');
    formErrorEl.textContent = '';
    if (recipe) {
      state.editingId = recipe.id;
      formTitleEl.textContent = 'Edit Recipe';
      document.getElementById('field-title').value = recipe.title || '';
      document.getElementById('field-image').value = recipe.image || '';
      document.getElementById('field-tags').value = (recipe.tags || []).join(', ');
      document.getElementById('field-ingredients').value = (recipe.ingredients || []).join('\\n');
      document.getElementById('field-steps').value = (recipe.steps || []).join('\\n');
    } else {
      state.editingId = null;
      formTitleEl.textContent = 'Add Recipe';
      recipeForm.reset();
    }
    showView(formView);
  }

  function parseLines(text) {
    return text.split('\\n').map((l) => l.trim()).filter((l) => l !== '');
  }

  function parseTags(text) {
    return text.split(',').map((t) => t.trim()).filter((t) => t !== '');
  }

  recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('field-title').value.trim();
    const image = document.getElementById('field-image').value.trim();
    const tags = parseTags(document.getElementById('field-tags').value);
    const ingredients = parseLines(document.getElementById('field-ingredients').value);
    const steps = parseLines(document.getElementById('field-steps').value);

    if (!title) {
      showFormError('Title is required.');
      return;
    }
    if (ingredients.length === 0) {
      showFormError('At least one ingredient is required.');
      return;
    }
    if (steps.length === 0) {
      showFormError('At least one step is required.');
      return;
    }

    const payload = { title, image, tags, ingredients, steps };
    const isEdit = !!state.editingId;
    const url = isEdit ? '/api/recipes/' + encodeURIComponent(state.editingId) : '/api/recipes';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      showFormError(err.error || 'Request failed');
      return;
    }

    const saved = await res.json();
    showView(galleryView);
    await fetchRecipes();
    if (isEdit) {
      openDetail(saved.id);
    }
  });

  function showFormError(msg) {
    formErrorEl.textContent = msg;
    formErrorEl.classList.add('visible');
  }

  document.getElementById('add-recipe-btn').addEventListener('click', () => openForm(null));
  document.getElementById('detail-back-btn').addEventListener('click', () => showView(galleryView));
  document.getElementById('form-back-btn').addEventListener('click', () => showView(galleryView));
  document.getElementById('form-cancel-btn').addEventListener('click', () => showView(galleryView));

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(fetchRecipes, 250);
  });
  tagFilter.addEventListener('change', fetchRecipes);

  fetchRecipes();
})();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === '/' && method === 'GET') {
      return new Response('OK', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    if (url.pathname === '/app' && method === 'GET') {
      return new Response(APP_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=UTF-8' },
      });
    }

    if (url.pathname === '/api/recipes' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      const tag = (url.searchParams.get('tag') || '').trim();

      let results = getRecipes();
      if (q) {
        results = results.filter((r) => {
          const titleMatch = r.title.toLowerCase().includes(q);
          const ingredientMatch = r.ingredients.some((i) => i.toLowerCase().includes(q));
          return titleMatch || ingredientMatch;
        });
      }
      if (tag) {
        results = results.filter((r) => r.tags.includes(tag));
      }

      return jsonResponse(results.map(toSummary));
    }

    const singleMatch = url.pathname.match(/^\/api\/recipes\/([^/]+)$/);
    if (singleMatch && method === 'GET') {
      const recipe = getRecipes().find((r) => r.id === singleMatch[1]);
      if (!recipe) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      return jsonResponse(recipe);
    }

    if (url.pathname === '/api/recipes' && method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
      const validationError = validateRecipeInput(body);
      if (validationError) {
        return jsonResponse({ error: validationError }, 400);
      }
      const normalized = normalizeRecipeInput(body);
      const recipe = {
        id: crypto.randomUUID(),
        ...normalized,
        createdAt: Date.now(),
      };
      getRecipes().push(recipe);
      return jsonResponse(recipe, 201);
    }

    if (singleMatch && method === 'PUT') {
      const recipe = getRecipes().find((r) => r.id === singleMatch[1]);
      if (!recipe) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
      const validationError = validateRecipeInput(body);
      if (validationError) {
        return jsonResponse({ error: validationError }, 400);
      }
      const normalized = normalizeRecipeInput(body);
      Object.assign(recipe, normalized);
      return jsonResponse(recipe);
    }

    if (singleMatch && method === 'DELETE') {
      const list = getRecipes();
      const index = list.findIndex((r) => r.id === singleMatch[1]);
      if (index === -1) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      list.splice(index, 1);
      return new Response(null, { status: 204 });
    }

    return new Response('Not Found', { status: 404 });
  },
};
