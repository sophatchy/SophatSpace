const apiKey = '';
const storageKey = 'sophatspace_checked_v1';
let sections = [];
let checkedItems = new Set();
let activeFilter = 'social';
let currentSlide = 0;
let slideInterval;

async function loadSections() {
  try {
    const res = await fetch('scripts/data/sections.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load sections: ${res.status}`);
    const data = await res.json();
    sections = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    sections = [];
  }
}

function loadCheckedItems() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      checkedItems = new Set(parsed);
    }
  } catch (err) {
    console.warn('Failed to load saved checklist state.', err);
  }
}

function saveCheckedItems() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
  } catch (err) {
    console.warn('Failed to save checklist state.', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSections();
  loadCheckedItems();
  setFilter('social');
  startCarousel();
  lucide.createIcons();
});

// Carousel
function showSlide(index) {
  const track = document.getElementById('carousel-track');
  if (!track) return; // Prevent error if element is missing

  const dots = document.querySelectorAll('#carousel-track + div button');
  if (index >= 3) index = 0;
  if (index < 0) index = 2;
  currentSlide = index;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((d, i) => {
    if (d) {
      d.className = i === index
        ? 'w-2 h-2 rounded-full bg-white/90 transition-all scale-125'
        : 'w-2 h-2 rounded-full bg-white/40 transition-all';
    }
  });
}

function startCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  slideInterval = setInterval(() => showSlide(currentSlide + 1), 5000);
}

// Filter Logic
function setFilter(filter) {
  activeFilter = filter;
  const buttons = document.querySelectorAll('#filter-social, #filter-finance, #filter-devices, #filter-business, #filter-data');

  const titles = {
    social: 'ពិន្ទុបណ្តាញសង្គម',
    finance: 'ពិន្ទុសុវត្ថិភាពលុយ',
    devices: 'ពិន្ទុឧបករណ៍',
    business: 'ពិន្ទុការងារ',
    data: 'ពិន្ទុទិន្នន័យ'
  };
  document.getElementById('score-label').innerText = titles[filter] || 'ពិន្ទុសរុប';

  buttons.forEach(btn => {
    const iconBox = btn.firstElementChild;
    const label = btn.lastElementChild;
    const isActive = btn.id === 'filter-' + filter;

    if (isActive) {
      iconBox.className = `w-16 h-16 rounded-app flex items-center justify-center text-white shadow-icon transition scale-105 ${getActiveColor(filter)}`;
      label.className = 'text-xs font-bold text-black text-center mt-1';
    } else {
      iconBox.className = 'w-16 h-16 rounded-app flex items-center justify-center bg-gray-100 text-gray-400 shadow-sm transition';
      label.className = 'text-xs font-bold text-gray-400 text-center mt-1';
    }
  });
  renderList();
  updateStats();
}

function getActiveColor(filter) {
  const map = {
    social: 'bg-blue-500',
    finance: 'bg-green-500',
    devices: 'bg-orange-500',
    business: 'bg-slate-700',
    data: 'bg-indigo-500'
  };
  return map[filter] || 'bg-black';
}

function toggleCheck(id) {
  if (checkedItems.has(id)) checkedItems.delete(id);
  else checkedItems.add(id);
  saveCheckedItems();
  renderList();
  updateStats();
}

function toggleInfo(id) {
  const info = document.getElementById('info-' + id);
  if (!info) return;
  info.parentElement.classList.toggle('open');
}

function restartChecklist() {
  const ok = confirm('តើអ្នកចង់កំណត់ឡើងវិញទាំងអស់មែនទេ?');
  if (!ok) return;
  checkedItems.clear();
  saveCheckedItems();
  renderList();
  updateStats();
}

// SCORING: Calculate based on ACTIVE FILTER only (Tick by Session)
function calculateScore() {
  let total = 0;
  let max = 0;
  const activeSec = sections.filter(s => s.tags.includes(activeFilter));

  activeSec.forEach(s => s.items.forEach(i => {
    const w = i.urgent ? 3 : 1;
    max += w;
    if (checkedItems.has(i.id)) total += w;
  }));

  return max === 0 ? 0 : Math.round((total / max) * 100);
}

function updateStats() {
  const score = calculateScore();
  document.getElementById('score-text').innerText = score;
  document.getElementById('score-bar').style.width = score + '%';

  let color = 'bg-red-500';
  if (score >= 80) color = 'bg-green-500';
  else if (score >= 50) color = 'bg-orange-500';

  document.getElementById('score-bar').className = `absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${color}`;
}

function renderList() {
  const container = document.getElementById('checklist-container');
  const activeSec = sections.filter(s => s.tags.includes(activeFilter));

  if (activeSec.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-gray-400">ទិន្នន័យទទេ</div>';
    return;
  }

  container.innerHTML = activeSec.map(sec => {
    const itemsHtml = sec.items.map(item => {
      const isChecked = checkedItems.has(item.id);
      const checkClass = isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white';
      const titleClass = isChecked ? 'text-gray-400 line-through' : 'text-gray-900';
      const urgentIndicator = item.urgent && !isChecked ? '<div class="w-2 h-2 rounded-full bg-red-500 ml-2 animate-pulse"></div>' : '';

      return `
        <div class="bg-white p-4 rounded-[20px] flex flex-col shadow-sm mb-3 border border-gray-50">
          <div class="flex items-center gap-4 cursor-pointer" onclick="toggleCheck('${item.id}')">
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors custom-check shrink-0 ${checkClass}">
              <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3] ${isChecked ? 'opacity-100' : 'opacity-0'}"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center">
                <span class="font-bold text-base ${titleClass}">${item.title}</span>
                ${urgentIndicator}
              </div>
              <span class="text-xs text-gray-500 font-medium leading-relaxed block mt-1">${item.sub}</span>
            </div>
            <button onclick="event.stopPropagation(); toggleInfo('${item.id}')" class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition shrink-0 self-start mt-1">
              <i data-lucide="info" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="accordion-content">
            <div id="info-${item.id}" class="accordion-inner">
              <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 gap-2 text-sm">
                <div class="flex gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-50">
                  <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 mt-0.5"></i>
                  <span class="leading-snug text-xs">${item.risk}</span>
                </div>
                <div class="flex gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-50">
                  <i data-lucide="lightbulb" class="w-4 h-4 shrink-0 mt-0.5"></i>
                  <span class="leading-snug text-xs">${item.rec}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="mb-6">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 mb-2 flex items-center gap-2">
          ${sec.title}
          <div class="h-px bg-gray-200 flex-1"></div>
        </h3>
        ${itemsHtml}
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

// AI & PDF
async function analyzeSafety() {
  const score = calculateScore();
  document.getElementById('rec-modal').classList.remove('hidden');
  document.getElementById('modal-body').innerHTML = '<div class="flex flex-col items-center py-8"><div class="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div><p class="text-gray-500">កំពុងវិភាគទិន្នន័យ...</p></div>';

  let missedItems = [];
  sections.forEach(s => s.items.forEach(i => {
    if (!checkedItems.has(i.id)) {
      missedItems.push(i);
    }
  }));

  missedItems.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));

  const missedTitles = missedItems.map(i => i.title + (i.urgent ? ' (សំខាន់)' : '')).join(', ');

  try {
    if (!apiKey && missedItems.length > 0) throw new Error('No API');

    const prompt = `
      You are a cybersecurity expert teacher in Cambodia.
      The user has NOT done these security steps (sorted by importance): ${missedTitles}.

      Please provide a detailed explanation in simple Khmer for the top missing items.
      Prioritize the items marked "(សំខាន់)".

      Structure for each item:
      ### [Item Title]
      1. **ហានិភ័យ (Risk):** Explain what bad thing will happen if they don't do this.
      2. **ដំណោះស្រាយ (Solution):** Clear instructions on how to fix it.
      3. **អត្ថប្រយោជន៍ (Benefit):** Why is it good for them?
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    document.getElementById('modal-body').innerHTML = marked.parse(data.candidates[0].content.parts[0].text);
  } catch (e) {
    if (missedItems.length === 0) {
      document.getElementById('modal-body').innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <i data-lucide="shield-check" class="w-8 h-8 text-green-600"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800">អបអរសាទរ!</h3>
          <p class="text-gray-500 mt-2">លោកអ្នកបានបំពេញគ្រប់ចំណុចសុវត្ថិភាពទាំងអស់។</p>
        </div>
      `;
    } else {
      document.getElementById('modal-body').innerHTML = `
        <div class="space-y-6">
          <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <i data-lucide="info" class="w-5 h-5 text-orange-500 mt-0.5 shrink-0"></i>
            <div>
              <h4 class="font-bold text-orange-800">លទ្ធផលពិនិត្យ</h4>
              <p class="text-sm text-orange-700 mt-1">លោកអ្នកនៅខ្វះ <strong>${missedItems.length}</strong> ចំណុចទៀត។ ខាងក្រោមនេះជាចំណុចដែលត្រូវកែលម្អជាបន្ទាន់៖</p>
            </div>
          </div>

          <div class="space-y-4">
            ${missedItems.map(item => `
              <div class="bg-white p-5 rounded-2xl border ${item.urgent ? 'border-red-100 shadow-sm' : 'border-gray-100'}">
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-full ${item.urgent ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center shrink-0">
                    <i data-lucide="${item.urgent ? 'alert-triangle' : 'lightbulb'}" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-bold text-gray-800 text-lg">${item.title}</h4>
                      ${item.urgent ? '<span class="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">បន្ទាន់</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">${item.sub}</p>
                  </div>
                </div>

                <div class="pl-13 space-y-3 border-t border-gray-50 pt-3">
                  <div class="flex gap-3">
                    <span class="text-xs font-bold text-red-500 uppercase w-16 shrink-0 pt-0.5">ហានិភ័យ</span>
                    <p class="text-sm text-gray-700 leading-relaxed">${item.risk}</p>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-xs font-bold text-blue-500 uppercase w-16 shrink-0 pt-0.5">ដំណោះស្រាយ</span>
                    <p class="text-sm text-gray-700 leading-relaxed font-medium">${item.rec}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="text-center pt-4">
            <p class="text-xs text-gray-400">ព្យាយាមបំពេញចំណុចដែលមានសញ្ញា <span class="text-red-500 font-bold">បន្ទាន់</span> មុនគេ។</p>
          </div>
        </div>
      `;
    }
    lucide.createIcons();
  }
}

function closeRecModal() { document.getElementById('rec-modal').classList.add('hidden'); }

// Support Modal Functions
function openSupportModal() {
  document.getElementById('support-modal').classList.remove('hidden');
}

function closeSupportModal() {
  document.getElementById('support-modal').classList.add('hidden');
}

async function downloadPDF() {
  const btn = event.currentTarget || document.getElementById('downloadBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Processing...';

  try {
    const userNameInput = document.getElementById('user-name');
    const pdfUserName = document.getElementById('pdf-user-name');
    if (pdfUserName) pdfUserName.innerText = (userNameInput && userNameInput.value) ? userNameInput.value : 'Guest';

    const pdfDate = document.getElementById('pdf-date');
    if (pdfDate) pdfDate.innerText = new Date().toLocaleDateString('km-KH');

    let total = 0;
    let max = 0;
    sections.forEach(s => s.items.forEach(i => {
      const w = i.urgent ? 3 : 1;
      max += w;
      if (checkedItems.has(i.id)) total += w;
    }));
    const globalScore = max === 0 ? 0 : Math.round((total / max) * 100);

    const pdfScore = document.getElementById('pdf-score');
    if (pdfScore) pdfScore.innerText = globalScore;

    const pdfRisk = document.getElementById('pdf-risk-level');
    if (pdfRisk) pdfRisk.innerText = globalScore > 80 ? 'ហានិភ័យទាប' : 'ហានិភ័យខ្ពស់';

    let html = '';
    sections.forEach(sec => {
      const m = sec.items.filter(i => !checkedItems.has(i.id));
      if (m.length) {
        html += `<h4 class="font-bold mt-4 mb-2 text-red-600 border-b border-gray-200 pb-1">${sec.title}</h4>`;
        m.forEach(i => { html += `<div class="flex justify-between text-sm mb-1 bg-gray-50 p-2 rounded"><span>${i.title}</span><span class="text-gray-500 text-xs">${i.rec}</span></div>`; });
      }
    });
    const contentContainer = document.getElementById('pdf-content-container');
    if (contentContainer) contentContainer.innerHTML = html || "<p class='text-green-500 font-bold'>ល្អណាស់! បានការពារទាំងអស់។</p>";

    const pdfEl = document.getElementById('pdf-wrapper');
    const app = document.getElementById('app-ui');

    if (pdfEl && app) {
      app.style.display = 'none';
      pdfEl.style.display = 'block';
      pdfEl.style.position = 'static';

      await html2pdf().from(pdfEl).save();

      pdfEl.style.position = 'absolute';
      pdfEl.style.display = 'none';
      app.style.display = 'block';
    }
  } catch (e) {
    console.error(e);
    alert('Error creating PDF');
  } finally {
    btn.innerHTML = originalText;
    lucide.createIcons();
  }
}
