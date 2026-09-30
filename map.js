const map = L.map('map', { zoomControl: true, minZoom: 5, maxZoom: 14 });
map.setView([23.0, 101.2], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const markers = new Map();
let locations = [];

const detail = document.getElementById('detail');
const detailContent = document.getElementById('detailContent');
const sidebar = document.getElementById('sidebar');
const search = document.getElementById('search');
const list = document.getElementById('locations');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[char]));
}

function typeLabel(type) {
  if (type === 'sheng') return 'Шен (сирий)';
  if (type === 'shu') return 'Шу (ферментований)';
  if (type === 'both') return 'Шен + Шу';
  return '';
}

function typeColor(type) {
  if (type === 'sheng') return '#2d6a4f';
  if (type === 'shu') return '#9c6644';
  if (type === 'both') return '#6b5b95';
  return '#4a7c59';
}

function showDetail(item) {
  const typeBadge = item.type
    ? `<div class="type-badge type-${escapeHtml(item.type)}">${escapeHtml(typeLabel(item.type))}</div>`
    : '';
  detailContent.innerHTML = `
    <h2>${escapeHtml(item.name_uk)}</h2>
    <div class="original">${escapeHtml(item.name)}</div>
    <div class="region">${escapeHtml(item.region)}</div>
    ${typeBadge}
    <p>${escapeHtml(item.description)}</p>
  `;
  detail.classList.remove('hidden');
}

function popup(item) {
  const typeText = item.type ? ` · ${typeLabel(item.type)}` : '';
  return `<div class="popup-title">${escapeHtml(item.name_uk)}</div>
          <div class="popup-sub">${escapeHtml(item.name)} · ${escapeHtml(item.region)}${typeText}</div>
          <div class="popup-link">Натисніть для опису</div>`;
}

function renderList(items) {
  list.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'location';
    const typeBadge = item.type
      ? `<span class="list-type type-${escapeHtml(item.type)}">${escapeHtml(typeLabel(item.type))}</span>`
      : '';
    el.innerHTML = `<div class="uk">${escapeHtml(item.name_uk)}</div>
                    <div class="en">${escapeHtml(item.name)}</div>
                    <div class="region">${escapeHtml(item.region)} ${typeBadge}</div>`;
    el.addEventListener('click', () => {
      map.setView([item.lat, item.lng], Math.max(map.getZoom(), 10), {animate:true});
      markers.get(item.id).openPopup();
      showDetail(item);
      sidebar.classList.remove('open');
    });
    list.appendChild(el);
  });
}

function addMarkers() {
  locations.forEach(item => {
    const color = typeColor(item.type);
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 7,
      weight: 1.5,
      color: color,
      fillColor: color,
      fillOpacity: 0.85
    }).addTo(map);

    marker.bindPopup(popup(item));
    marker.on('click', () => showDetail(item));
    markers.set(item.id, marker);
  });
}

fetch('locations.json')
  .then(response => {
    if (!response.ok) throw new Error('Не вдалося завантажити locations.json');
    return response.json();
  })
  .then(data => {
    locations = data;
    addMarkers();
    renderList(locations);
  })
  .catch(error => {
    console.error(error);
    list.innerHTML = '<div class="hint">Не вдалося завантажити дані карти. Переконайтеся, що всі файли знаходяться в одному репозиторії.</div>';
  });

search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  const filtered = locations.filter(item =>
    [item.name, item.name_uk, item.region, item.description, item.type || '']
      .some(value => String(value).toLowerCase().includes(q))
  );
  renderList(filtered);
});

document.getElementById('closeDetail').addEventListener('click', () => {
  detail.classList.add('hidden');
});

document.getElementById('listButton').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});
