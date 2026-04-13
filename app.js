// ===== DATA LAYER =====
const DB = {
  get: (key) => JSON.parse(localStorage.getItem('nl_' + key) || 'null'),
  set: (key, val) => localStorage.setItem('nl_' + key, JSON.stringify(val)),

  getClients: () => DB.get('clients') || [],
  setClients: (d) => DB.set('clients', d),

  getTasks: () => DB.get('tasks') || [],
  setTasks: (d) => DB.set('tasks', d),

  getUsers: () => DB.get('users') || [],
  setUsers: (d) => DB.set('users', d),

  getInventory: () => DB.get('inventory') || [],
  setInventory: (d) => DB.set('inventory', d),

  getMaintenanceLogs: () => DB.get('maintenance_logs') || [],
  setMaintenanceLogs: (d) => DB.set('maintenance_logs', d),

  getSession: () => DB.get('session'),
  setSession: (d) => DB.set('session', d),
  clearSession: () => localStorage.removeItem('nl_session'),
};

// ===== SEED DEFAULT USERS & INVENTORY =====
function seedData() {
  if (!DB.getUsers().length) {
    DB.setUsers([
      { id: 1, name: 'أحمد المدير', username: 'admin', password: 'admin123', role: 'admin' },
      { id: 2, name: 'محمد المشرف', username: 'supervisor', password: 'super123', role: 'supervisor' },
      { id: 3, name: 'علي الفني', username: 'tech1', password: 'tech123', role: 'technician' },
    ]);
  }
  if (!DB.getInventory().length) {
    DB.setInventory([
      { id: genId(), name: 'فلتر RO 75 GPD', quantity: 25, alertThreshold: 5, createdAt: new Date().toISOString() },
      { id: genId(), name: 'فلتر كربون نشط', quantity: 3, alertThreshold: 5, createdAt: new Date().toISOString() },
      { id: genId(), name: 'مضخة ضغط', quantity: 8, alertThreshold: 3, createdAt: new Date().toISOString() },
      { id: genId(), name: 'خرطوشة UV', quantity: 2, alertThreshold: 4, createdAt: new Date().toISOString() },
      { id: genId(), name: 'أنبوب تغذية 1/4', quantity: 50, alertThreshold: 10, createdAt: new Date().toISOString() },
    ]);
  }
}

// ===== AUTH =====
function login(username, password) {
  const users = DB.getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  DB.setSession({ id: user.id, name: user.name, role: user.role });
  return user;
}

function logout() {
  DB.clearSession();
  window.location.href = 'index.html';
}

function requireAuth(allowedRoles) {
  const session = DB.getSession();
  if (!session) { window.location.href = 'index.html'; return null; }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// ===== HELPERS =====
function genId() { return Date.now() + Math.floor(Math.random() * 1000); }

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + parseInt(months));
  return d.toISOString().split('T')[0];
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

function imageToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function previewImage(src) {
  const ov = document.createElement('div');
  ov.className = 'img-preview-overlay';
  ov.innerHTML = `<img src="${src}">`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
}

function renderSidebar(activeId) {
  const session = DB.getSession();
  if (!session) return;

  const isAdmin = session.role === 'admin';
  const isSupervisor = session.role === 'supervisor';
  const isTech = session.role === 'technician';

  const roleLabel = { admin: 'مدير', supervisor: 'مشرف', technician: 'فني' }[session.role];

  const navItems = [];

  if (isAdmin || isSupervisor) {
    navItems.push({ id: 'dashboard', label: 'الرئيسية', icon: iconHome(), href: 'dashboard.html' });
    navItems.push({ id: 'clients', label: 'العملاء', icon: iconUsers(), href: 'clients.html' });
    navItems.push({ id: 'tasks', label: 'المهام والزيارات', icon: iconTask(), href: 'tasks.html' });
    navItems.push({ id: 'maintenance', label: 'سجلات الصيانة', icon: iconWrench(), href: 'maintenance.html' });
    if (isAdmin) {
      navItems.push({ id: 'inventory', label: 'المخزون', icon: iconBox(), href: 'inventory.html' });
      navItems.push({ id: 'reports', label: 'التقارير', icon: iconChart(), href: 'reports.html' });
      navItems.push({ id: 'users', label: 'المستخدمين', icon: iconUser(), href: 'users.html' });
    }
  }

  if (isTech) {
    navItems.push({ id: 'tech', label: 'مهامي', icon: iconTask(), href: 'technician.html' });
  }

  const navHTML = navItems.map(item => `
    <a href="${item.href}" class="nav-item ${activeId === item.id ? 'active' : ''}">
      ${item.icon} ${item.label}
    </a>
  `).join('');

  return `
    <div class="sidebar-logo">
      <div class="logo-mark">💧</div>
      <div>
        <div class="logo-text">نيو لايف</div>
        <div class="logo-sub">إدارة الفلاتر</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">القائمة الرئيسية</div>
      ${navHTML}
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">${session.name[0]}</div>
        <div>
          <div class="user-name">${session.name}</div>
          <div class="user-role">${roleLabel}</div>
        </div>
      </div>
      <button class="btn btn-danger btn-full btn-sm" onclick="logout()">🚪 تسجيل الخروج</button>
    </div>
  `;
}

// ===== SVG ICONS =====
function iconHome() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`; }
function iconUsers() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`; }
function iconTask() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`; }
function iconUser() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`; }
function iconWrench() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`; }
function iconBox() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`; }
function iconChart() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`; }

seedData();

// ===== CLIENT STATUS HELPERS =====
function getClientStatus(nextServiceDate) {
  if (!nextServiceDate) return 'unknown';
  const today = new Date(); today.setHours(0,0,0,0);
  const next = new Date(nextServiceDate);
  const diff = Math.ceil((next - today) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff <= 14) return 'upcoming';
  return 'ok';
}

function statusBadgeHTML(status) {
  const map = {
    overdue:  ['badge-danger',  '🔴 متأخرة'],
    upcoming: ['badge-warning', '🟡 قريبة'],
    ok:       ['badge-success', '🟢 حديثة'],
    unknown:  ['badge-muted',   'غير محدد'],
  };
  const [cls, label] = map[status] || map.unknown;
  return `<span class="badge ${cls}">${label}</span>`;
}

// ===== INVENTORY HELPERS =====
function getInventoryAlerts() {
  return DB.getInventory().filter(i => i.quantity <= i.alertThreshold);
}
