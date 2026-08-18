const STORAGE_KEY = 'restaurant-menu-data-v1';

const categoryLabels = {
  entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson', accompagnement: 'Accompagnement', autre: 'Autre'
};

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function defaultDay(date) {
  const weekday = date.getDay();
  // Modèle initial Chez Lucette : jeudi, vendredi et dimanche le midi ; samedi midi + soir.
  const lunch = [4, 5, 6, 0].includes(weekday);
  const dinner = weekday === 6;
  return { date: dateKey(date), lunch, dinner, lunchItems: [], dinnerItems: [] };
}

function normalizeData(data) {
  data.days ||= [];
  data.settings ||= { displayDays: 7 };
  data.tags ||= [];
  const today = dateKey(new Date());
  data.days = data.days.filter(d => d.date >= today);
  const existing = new Map(data.days.map(d => [d.date, d]));
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setHours(12,0,0,0); d.setDate(d.getDate() + i);
    const key = dateKey(d);
    if (!existing.has(key)) data.days.push(defaultDay(d));
  }
  data.days.sort((a,b) => a.date.localeCompare(b.date));
  return data;
}

async function loadData() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) return normalizeData(JSON.parse(local));
  const response = await fetch('data/menu.json', { cache: 'no-store' });
  return normalizeData(await response.json());
}

function formatDate(dateString, opts = {}) {
  return new Intl.DateTimeFormat('fr-FR', opts).format(new Date(`${dateString}T12:00:00`));
}

function renderService(title, ids, tags) {
  const map = new Map(tags.map(t => [t.id, t]));
  const items = ids.map(id => map.get(id)).filter(Boolean);
  return `<div class="service"><h4>${title}</h4>${items.length ? items.map(t => `
    <div class="menu-line">
      <div><span class="cat">${categoryLabels[t.category] || 'Autre'}</span><strong>${escapeHtml(t.name)}</strong>${t.description ? `<small>${escapeHtml(t.description)}</small>` : ''}</div>
      ${Number.isFinite(Number(t.price)) && t.price !== '' ? `<span class="price">${Number(t.price).toFixed(2).replace('.', ',')} €</span>` : ''}
    </div>`).join('') : '<p class="empty-menu">Menu à venir</p>'}</div>`;
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function serviceText(day) {
  const parts = [];
  if (day.lunch) parts.push('Midi');
  if (day.dinner) parts.push('Soir');
  return parts.length ? parts.join(' & ') : 'Fermé';
}

function render(data) {
  const r = data.restaurant;
  document.getElementById('restaurantName').textContent = r.name;
  document.getElementById('restaurantSubtitle').textContent = r.subtitle;
  document.getElementById('contactTitle').textContent = r.name;
  document.getElementById('footerName').textContent = r.name;
  document.getElementById('address').textContent = r.address;
  document.getElementById('phone').textContent = r.phone;
  document.getElementById('phone').href = `tel:${r.phone.replace(/\s/g,'')}`;
  document.title = `${r.name} — Menus`;

  const count = Number(data.settings.displayDays || 7);
  const days = data.days.slice(0, count);
  document.getElementById('daysGrid').innerHTML = days.map(day => {
    const open = day.lunch || day.dinner;
    return `<article class="day-card ${open ? '' : 'closed'}">
      <div class="day-card-head">
        <div><h3>${formatDate(day.date, {weekday:'long'})}</h3><div class="day-date">${formatDate(day.date, {day:'numeric', month:'long'})}</div></div>
        <span class="badge ${open ? '' : 'closed'}">${open ? serviceText(day) : 'Fermé'}</span>
      </div>
      ${day.lunch ? renderService('Midi', day.lunchItems, data.tags) : ''}
      ${day.dinner ? renderService('Soir', day.dinnerItems, data.tags) : ''}
      ${!open ? '<div class="service"><p class="empty-menu">Restaurant fermé</p></div>' : ''}
    </article>`;
  }).join('');

  const todayKey = dateKey(new Date());
  const today = data.days.find(d => d.date === todayKey);
  const open = today && (today.lunch || today.dinner);
  document.getElementById('todayStatus').textContent = open ? "Ouvert aujourd’hui" : "Fermé aujourd’hui";
  document.getElementById('todayHours').textContent = today ? serviceText(today) : '';
  document.querySelector('.status-dot').style.background = open ? 'var(--success)' : '#8b8178';

  document.getElementById('hoursSummary').innerHTML = days.map(day => `<div class="hours-row"><span>${formatDate(day.date,{weekday:'long', day:'numeric', month:'short'})}</span><strong>${serviceText(day)}</strong></div>`).join('');
}

loadData().then(render).catch(err => {
  console.error(err);
  document.getElementById('daysGrid').innerHTML = '<p>Impossible de charger les menus.</p>';
});
