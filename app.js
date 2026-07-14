const ZODIAC_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const GLYPHS = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', northnode: '☊', southnode: '☋'
};

const formPanel = document.getElementById('formPanel');
const loadingPanel = document.getElementById('loadingPanel');
const errorPanel = document.getElementById('errorPanel');
const errorText = document.getElementById('errorText');
const resultsSection = document.getElementById('results');
const loadingText = document.getElementById('loadingText');

const loadingMessages = [
  'Charting the sky at that moment…',
  'Locating the ascendant…',
  'Placing the planets in their houses…',
  'Working out the numbers of your name and date…',
  'Writing your reading…'
];

document.getElementById('birthForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const dob = document.getElementById('dob').value;
  const tob = document.getElementById('tob').value;
  const place = document.getElementById('place').value.trim();

  showLoading();

  let msgIndex = 0;
  const msgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIndex];
  }, 1800);

  try {
    const res = await fetch('/api/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dob, tob, place })
    });

    const data = await res.json();
    clearInterval(msgInterval);

    if (!res.ok) {
      showError(data.error || 'Something went wrong.');
      return;
    }

    renderResults(data);
  } catch (err) {
    clearInterval(msgInterval);
    showError('Could not reach the server. Please try again.');
  }
});

document.getElementById('tryAgainBtn').addEventListener('click', () => {
  errorPanel.classList.add('hidden');
  formPanel.classList.remove('hidden');
});

document.getElementById('newChartBtn').addEventListener('click', () => {
  resultsSection.classList.add('hidden');
  formPanel.classList.remove('hidden');
  document.getElementById('birthForm').reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function showLoading() {
  formPanel.classList.add('hidden');
  errorPanel.classList.add('hidden');
  resultsSection.classList.add('hidden');
  loadingPanel.classList.remove('hidden');
  loadingText.textContent = loadingMessages[0];
}

function showError(msg) {
  loadingPanel.classList.add('hidden');
  errorPanel.classList.remove('hidden');
  errorText.textContent = msg;
}

function renderResults(data) {
  loadingPanel.classList.add('hidden');

  document.getElementById('resultName').textContent = `${data.name}'s Chart`;
  document.getElementById('resultLocation').textContent = data.location.displayName;

  // Numerology
  document.getElementById('mulankValue').textContent = data.numerology.mulank;
  document.getElementById('mulankTrait').textContent = data.numerology.mulankTrait;
  document.getElementById('bhagyankValue').textContent = data.numerology.bhagyank;
  document.getElementById('bhagyankTrait').textContent = data.numerology.bhagyankTrait;

  // Planet table
  const tbody = document.querySelector('#planetTable tbody');
  tbody.innerHTML = '';
  data.chart.planets.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${GLYPHS[p.key] || ''} ${p.label}</td><td>${p.sign}</td><td>${p.house}</td><td>${p.degree}${p.retrograde ? ' ℞' : ''}</td>`;
    tbody.appendChild(tr);
  });

  // Wheel + legend
  renderWheel(data.chart);
  renderLegend(data.chart);

  // Reading (simple markdown -> HTML for our controlled ### headers + *italics*)
  const readingEl = document.getElementById('readingText');
  if (data.reading) {
    readingEl.innerHTML = markdownToHtml(data.reading);
  } else {
    readingEl.innerHTML = `<p>The written reading couldn't be generated${data.readingError ? ` (${escapeHtml(data.readingError)})` : ''}, but your chart and numbers above are fully calculated and accurate.</p>`;
  }

  formPanel.classList.add('hidden');
  errorPanel.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function markdownToHtml(md) {
  const escaped = escapeHtml(md);
  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      if (/^###\s+/.test(block)) {
        return `<h3>${block.replace(/^###\s+/, '')}</h3>`;
      }
      const withItalics = block.replace(/\*(.+?)\*/g, '<em>$1</em>');
      return `<p>${withItalics.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderLegend(chart) {
  const legend = document.getElementById('legend');
  legend.innerHTML = chart.planets
    .map((p) => `<span><span class="glyph">${GLYPHS[p.key] || ''}</span>${p.label} · H${p.house}</span>`)
    .join('');
}

function renderWheel(chart) {
  const container = document.getElementById('wheelContainer');
  container.innerHTML = '';

  const size = 320;
  const center = size / 2;
  const outerR = 150;
  const innerR = 95;
  const glyphR = 122;

  const ascIndex = ZODIAC_ORDER.indexOf(chart.ascendant.sign);
  const startIndex = ascIndex >= 0 ? ascIndex : 0;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  // outer + inner rings
  [outerR, innerR].forEach((r) => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(201,161,90,0.35)');
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);
  });

  // 12 house divisions, house 1 starts at 9 o'clock and goes counter-clockwise (traditional Vedic layout)
  for (let h = 0; h < 12; h++) {
    const angle = Math.PI - (h * Math.PI * 2) / 12; // start at left (180deg), go counter-clockwise
    const x1 = center + innerR * Math.cos(angle);
    const y1 = center + innerR * Math.sin(angle);
    const x2 = center + outerR * Math.cos(angle);
    const y2 = center + outerR * Math.sin(angle);

    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(201,161,90,0.25)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    // house number + sign label, centered in wedge
    const midAngle = Math.PI - ((h + 0.5) * Math.PI * 2) / 12;
    const labelR = (outerR + innerR) / 2 + 18;
    const lx = center + labelR * Math.cos(midAngle);
    const ly = center + labelR * Math.sin(midAngle);
    const signIndex = (startIndex + h) % 12;

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', lx);
    text.setAttribute('y', ly);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '9');
    text.setAttribute('fill', 'rgba(167,164,196,0.85)');
    text.setAttribute('font-family', 'Work Sans, sans-serif');
    text.textContent = `${h + 1} · ${ZODIAC_ORDER[signIndex].slice(0, 3)}`;
    svg.appendChild(text);
  }

  // Ascendant marker (house 1 cusp, at the left/9-o'clock point)
  const ascText = document.createElementNS(svgNS, 'text');
  ascText.setAttribute('x', center - outerR - 14);
  ascText.setAttribute('y', center + 4);
  ascText.setAttribute('text-anchor', 'middle');
  ascText.setAttribute('font-size', '11');
  ascText.setAttribute('fill', '#e3c98a');
  ascText.setAttribute('font-family', 'Spectral, serif');
  ascText.textContent = 'ASC';
  svg.appendChild(ascText);

  // Planet glyphs placed within their house wedge (offset slightly if multiple share a house)
  const houseCounts = {};
  chart.planets.forEach((p) => {
    const h = p.house || 1;
    houseCounts[h] = (houseCounts[h] || 0) + 1;
    const seat = houseCounts[h] - 1;

    const midAngle = Math.PI - ((h - 1 + 0.5) * Math.PI * 2) / 12;
    const jitter = seat * 14;
    const r = glyphR - jitter;
    const gx = center + r * Math.cos(midAngle);
    const gy = center + r * Math.sin(midAngle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', gx);
    text.setAttribute('y', gy + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '17');
    text.setAttribute('fill', '#eee8da');
    text.setAttribute('font-family', 'Spectral, serif');
    text.textContent = GLYPHS[p.key] || p.label[0];
    svg.appendChild(text);
  });

  container.appendChild(svg);
}
