'use strict';

const CONFIG = {
  whatsapp: '5511999999999',
  clinicName: 'Sorriso Pleno',
  workDays: [1, 2, 3, 4, 5, 6], // Mon–Sat (0=Sun)
  timeSlots: {
    manha: ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
    tarde:  ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'],
  },
  unavailableSlots: {
  },
};

const bookingState = {
  step: 1,
  patient: { name: '', phone: '', email: '' },
  service: '',
  notes: '',
  date: null,
  time: '',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
  initBookingForm();
  initCalendar();
  initActiveNavHighlight();
});

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-center a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = document.querySelector(`.nav-center a[href="#${entry.target.id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

function initBookingForm() {
  updateStepUI();
}

function nextStep() {
  if (!validateCurrentStep()) return;
  bookingState.step = Math.min(bookingState.step + 1, 3);
  if (bookingState.step === 3) buildSummary();
  updateStepUI();
  scrollToForm();
}

function prevStep() {
  bookingState.step = Math.max(bookingState.step - 1, 1);
  updateStepUI();
  scrollToForm();
}

function scrollToForm() {
  const card = document.querySelector('.booking-form-card');
  if (card) {
    setTimeout(() => {
      const top = card.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 80);
  }
}

function updateStepUI() {
  const steps = document.querySelectorAll('.step');
  const formSteps = document.querySelectorAll('.form-step');

  steps.forEach((s, i) => {
    const num = i + 1;
    s.classList.remove('active', 'done');
    if (num < bookingState.step) s.classList.add('done');
    else if (num === bookingState.step) s.classList.add('active');

    const dot = s.querySelector('.step-dot');
    if (dot) {
      if (num < bookingState.step) dot.textContent = '✓';
      else dot.textContent = num;
    }
  });

  formSteps.forEach((fs, i) => {
    fs.classList.toggle('active', i + 1 === bookingState.step);
  });

  steps.forEach((s, i) => {
    if (i + 1 < bookingState.step) s.classList.add('done');
  });
}

function validateCurrentStep() {
  clearErrors();
  let valid = true;

  if (bookingState.step === 1) {
    const name = getVal('patientName');
    const phone = getVal('patientPhone');
    const email = getVal('patientEmail');
    const service = getVal('service');

    if (!name || name.length < 3) { showError('patientName', 'Por favor, insira seu nome completo.'); valid = false; }
    if (!phone || phone.replace(/\D/g,'').length < 10) { showError('patientPhone', 'Número de telefone inválido.'); valid = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('patientEmail', 'E-mail inválido.'); valid = false; }
    if (!service) { showError('service', 'Selecione um serviço.'); valid = false; }

    if (valid) {
      bookingState.patient = { name, phone, email };
      bookingState.service = service;
      bookingState.notes = getVal('notes') || '';
    }
  }

  if (bookingState.step === 2) {
    if (!bookingState.date) { showToast('Selecione uma data para a consulta.', 'warn'); valid = false; }
    else if (!bookingState.time) { showToast('Selecione um horário disponível.', 'warn'); valid = false; }
  }

  return valid;
}

function showError(id, msg) {
  const input = document.getElementById(id);
  if (input) input.classList.add('error');
  const errEl = document.getElementById(id + 'Error');
  if (errEl) errEl.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error')
    .forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function initCalendar() {
  renderCalendar();
}

function renderCalendar() {
  const cal = document.getElementById('calendar');
  if (!cal) return;

  const { calYear: year, calMonth: month } = bookingState;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const header = document.getElementById('calMonthYear');
  if (header) header.textContent = `${months[month]} ${year}`;

  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let html = days.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = formatDate(date);
    const dow = date.getDay();
    const isPast = date < today;
    const isWorkday = CONFIG.workDays.includes(dow);
    const isToday = date.getTime() === today.getTime();
    const isSelected = bookingState.date === dateStr;
    const isDisabled = isPast || !isWorkday;

    let cls = 'cal-day';
    if (isDisabled) cls += ' disabled';
    if (isToday && !isDisabled) cls += ' today';
    if (isSelected) cls += ' selected';

    const onclick = isDisabled ? '' : `onclick="selectDate('${dateStr}')"`;
    html += `<div class="${cls}" ${onclick}>${d}</div>`;
  }

  grid.innerHTML = html;
}

function selectDate(dateStr) {
  bookingState.date = dateStr;
  bookingState.time = '';
  renderCalendar();
  renderTimeSlots();
}

function calPrev() {
  if (bookingState.calMonth === 0) { bookingState.calMonth = 11; bookingState.calYear--; }
  else bookingState.calMonth--;
  renderCalendar();
}

function calNext() {
  if (bookingState.calMonth === 11) { bookingState.calMonth = 0; bookingState.calYear++; }
  else bookingState.calMonth++;
  renderCalendar();
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;

  if (!bookingState.date) {
    container.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);padding:12px 0;">Selecione uma data primeiro.</p>';
    return;
  }

  const unavailable = CONFIG.unavailableSlots[bookingState.date] || [];
  let html = '';

  const renderGroup = (label, slots) => {
    html += `<p style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin:16px 0 8px;">${label}</p>`;
    html += `<div class="time-slots">`;
    slots.forEach(slot => {
      const isUnavail = unavailable.includes(slot);
      const isSelected = bookingState.time === slot;
      let cls = 'time-slot';
      if (isUnavail) cls += ' unavailable';
      if (isSelected) cls += ' selected';
      const onclick = isUnavail ? '' : `onclick="selectTime('${slot}')"`;
      html += `<div class="${cls}" ${onclick}>${slot}</div>`;
    });
    html += `</div>`;
  };

  renderGroup('Manhã', CONFIG.timeSlots.manha);
  renderGroup('Tarde', CONFIG.timeSlots.tarde);

  container.innerHTML = html;
}

function selectTime(time) {
  bookingState.time = time;
  renderTimeSlots();
}

function buildSummary() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const dateObj = bookingState.date ? new Date(bookingState.date + 'T12:00:00') : null;
  const dateFormatted = dateObj ? dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';

  set('sumName', bookingState.patient.name || '-');
  set('sumPhone', bookingState.patient.phone || '-');
  set('sumEmail', bookingState.patient.email || 'Não informado');
  set('sumService', bookingState.service || '-');
  set('sumDate', dateFormatted);
  set('sumTime', bookingState.time || '-');
  set('sumNotes', bookingState.notes || 'Nenhuma');
}

function submitBooking() {
  const btn = document.getElementById('submitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Confirmando...'; }
  setTimeout(() => {
    showBookingSuccess();
  }, 1500);
}

function showBookingSuccess() {
  const formContent = document.getElementById('formContent');
  const successContent = document.getElementById('bookingSuccess');
  if (formContent) formContent.style.display = 'none';
  if (successContent) { successContent.classList.add('show'); }

  const ref = 'SP' + Date.now().toString().slice(-6);
  const refEl = document.getElementById('bookingRef');
  if (refEl) refEl.textContent = `Protocolo: #${ref}`;

  setTimeout(() => openWhatsAppBooking(), 2000);
}

function openWhatsAppBooking() {
  if (!bookingState.patient.name) return;
  const dateObj = bookingState.date ? new Date(bookingState.date + 'T12:00:00') : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const msg = `Olá! Gostaria de confirmar minha consulta:\n\n👤 *${bookingState.patient.name}*\n📞 ${bookingState.patient.phone}\n🦷 Serviço: ${bookingState.service}\n📅 Data: ${dateStr}\n🕐 Horário: ${bookingState.time}\n\n${bookingState.notes ? '📝 ' + bookingState.notes : ''}`.trim();
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}

function resetBooking() {
  bookingState.step = 1;
  bookingState.patient = { name: '', phone: '', email: '' };
  bookingState.service = '';
  bookingState.notes = '';
  bookingState.date = null;
  bookingState.time = '';

  const formContent = document.getElementById('formContent');
  const successContent = document.getElementById('bookingSuccess');
  if (formContent) formContent.style.display = '';
  if (successContent) successContent.classList.remove('show');

  // Clear inputs
  ['patientName','patientPhone','patientEmail','service','notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  updateStepUI();
  renderCalendar();
  const timeSlots = document.getElementById('timeSlots');
  if (timeSlots) timeSlots.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);padding:12px 0;">Selecione uma data primeiro.</p>';
}

document.addEventListener('input', e => {
  if (e.target.id === 'patientPhone') {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    e.target.value = v;
  }
});

function showToast(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:90px; left:50%; transform:translateX(-50%) translateY(20px);
      background:var(--ink); color:white; padding:12px 24px; border-radius:100px;
      font-size:0.85rem; font-family:'Jost',sans-serif; font-weight:500;
      z-index:9999; opacity:0; transition:all 0.3s; white-space:nowrap;
      box-shadow:0 8px 24px rgba(0,0,0,0.25);
    `;
    document.body.appendChild(toast);
  }
  if (type === 'warn') toast.style.background = '#B45309';
  else if (type === 'success') toast.style.background = 'var(--sage)';
  else toast.style.background = 'var(--ink)';

  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 3200);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function openWhatsApp(msg) {
  const text = msg || 'Olá! Gostaria de agendar uma consulta.';
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
}

window.nextStep = nextStep;
window.prevStep = prevStep;
window.calPrev = calPrev;
window.calNext = calNext;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.submitBooking = submitBooking;
window.resetBooking = resetBooking;
window.openWhatsApp = openWhatsApp;