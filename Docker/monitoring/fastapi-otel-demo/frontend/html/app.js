const API = 'http://localhost:8000';

const tbody = document.querySelector('#itemsTable tbody');
const form = document.getElementById('itemForm');
const refreshBtn = document.getElementById('refreshBtn');
const filterCart = document.getElementById('filterCart');
const applyFilter = document.getElementById('applyFilter');
const clearFilter = document.getElementById('clearFilter');

async function fetchItems() {
  const cart = filterCart.value ? `?cart=${encodeURIComponent(filterCart.value)}` : '';
  const res = await fetch(`${API}/items${cart}`);
  const items = await res.json();
  render(items);
}

function render(items) {
  tbody.innerHTML = '';
  items.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.id}</td>
      <td><input value="${i.product}" data-field="product"/></td>
      <td><input type="number" step="0.01" value="${i.price}" data-field="price"/></td>
      <td><input value="${i.cart ?? ''}" data-field="cart"/></td>
      <td><input type="number" min="1" value="${i.qty}" data-field="qty"/></td>
      <td>
        <button data-action="update" data-id="${i.id}">Update</button>
        <button data-action="delete" data-id="${i.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const tr = btn.closest('tr');
  const inputs = tr.querySelectorAll('input[data-field]');
  const payload = {};
  inputs.forEach(inp => payload[inp.dataset.field] = inp.type === 'number' ? Number(inp.value) : inp.value);

  if (btn.dataset.action === 'update') {
    await fetch(`${API}/items/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    await fetchItems();
  } else if (btn.dataset.action === 'delete') {
    await fetch(`${API}/items/${id}`, { method: 'DELETE' });
    await fetchItems();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    product: document.getElementById('product').value,
    price: Number(document.getElementById('price').value),
    cart: document.getElementById('cart').value || null,
    qty: Number(document.getElementById('qty').value)
  };
  await fetch(`${API}/items`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  form.reset();
  document.getElementById('qty').value = 1;
  await fetchItems();
});

refreshBtn.addEventListener('click', fetchItems);
applyFilter.addEventListener('click', fetchItems);
clearFilter.addEventListener('click', () => { filterCart.value=''; fetchItems(); });

fetchItems();
