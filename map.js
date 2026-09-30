const map = L.map('map', { zoomControl: true, minZoom: 5, maxZoom: 12 });
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

function showDetail(item) {
  detailContent.innerHTML = `
    <h2>${escapeHtml(item.name_uk)}</h2>
    <div class="original">${escapeHtml(item.name)}</div>
    <div class="region">${escapeHtml(item.region)}</div>
    <p>${escapeHtml(item.description)}</p>
  `;
  detail.classList.remove('hidden');
}

function popup(item) {
  return `<div class="popup-title">${escapeHtml(item.name_uk)}</div>
          <div class="popup-sub">${escapeHtml(item.name)} · ${escapeHtml(item.region)}</div>
          <div class="popup-link">Натисніть для опису</div>`;
}

function renderList(items) {
  list.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'location';
    el.innerHTML = `<div class="uk">${escapeHtml(item.name_uk)}</div>
                    <div class="en">${escapeHtml(item.name)}</div>
                    <div class="region">${escapeHtml(item.region)}</div>`;
    el.addEventListener('click', () => {
      map.setView([item.lat, item.lng], Math.max(map.getZoom(), 9), {animate:true});
      markers.get(item.id).openPopup();
      showDetail(item);
      sidebar.classList.remove('open');
    });
    list.appendChild(el);
  });
}

function addMarkers() {
  locations.forEach(item => {
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 6,
      weight: 1.5,
      fillOpacity: .85
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
    [item.name, item.name_uk, item.region, item.description]
      .some(value => value.toLowerCase().includes(q))
  );
  renderList(filtered);
});

document.getElementById('closeDetail').addEventListener('click', () => {
  detail.classList.add('hidden');
});

document.getElementById('listButton').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});
