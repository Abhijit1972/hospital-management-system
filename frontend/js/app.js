/**
 * app.js – Main application controller
 * Hospital Management System Frontend
 */

// ─────────────────────────────────────────────
// Toast Notification System
// ─────────────────────────────────────────────
function showToast(type, title, message, duration = 4500) {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ""}
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut .3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────
let currentSection = "dashboard";

function navigateTo(section) {
  // Update nav items
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.section === section);
  });

  // Show/hide sections
  document.querySelectorAll(".page-section").forEach(el => {
    el.classList.toggle("active", el.id === `section-${section}`);
  });

  // Update topbar title
  const titles = {
    dashboard:     { h: "Dashboard",           sub: "Overview and quick statistics" },
    patients:      { h: "Patients",             sub: "Manage patient records" },
    doctors:       { h: "Doctors & Departments",sub: "View doctors and departments" },
    appointments:  { h: "Appointments",         sub: "Schedule and view appointments" },
    admissions:    { h: "Admissions & Rooms",   sub: "Manage patient admissions" },
    discharges:    { h: "Discharges & Billing", sub: "Discharge patients and view bills" },
    medicines:     { h: "Medicines",            sub: "Pharmacy inventory" },
    labtests:      { h: "Laboratory Tests",     sub: "Test records and results" },
    prescriptions: { h: "Prescriptions",        sub: "Patient prescriptions" },
    staff:         { h: "Staff",                sub: "Hospital staff information" }
  };

  const t = titles[section] || { h: section, sub: "" };
  document.getElementById("page-title").textContent = t.h;
  document.getElementById("page-subtitle").textContent = t.sub;

  currentSection = section;
  closeSidebar();

  // Load section data
  loadSection(section);
}

function loadSection(section) {
  const loaders = {
    dashboard:     loadDashboard,
    patients:      loadPatients,
    doctors:       loadDoctors,
    appointments:  loadAppointments,
    admissions:    loadAdmissions,
    discharges:    loadDischarges,
    medicines:     loadMedicines,
    labtests:      loadLabTests,
    prescriptions: loadPrescriptions,
    staff:         loadStaff
  };
  if (loaders[section]) loaders[section]();
}

// ─────────────────────────────────────────────
// Sidebar (mobile)
// ─────────────────────────────────────────────
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatTime(val) {
  if (!val) return "—";
  const parts = val.split(":");
  const h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatCurrency(val) {
  if (val == null) return "—";
  return "₹ " + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function statusBadge(status) {
  const map = {
    Scheduled:  "badge-info",
    Completed:  "badge-success",
    Cancelled:  "badge-danger",
    Admitted:   "badge-secondary",
    Discharged: "badge-muted",
    Available:  "badge-success",
    Occupied:   "badge-danger",
    Maintenance:"badge-warning",
    Paid:       "badge-success",
    Unpaid:     "badge-danger",
    Partial:    "badge-warning",
    Pending:    "badge-warning"
  };
  return `<span class="badge ${map[status] || "badge-muted"}">${escHtml(status)}</span>`;
}

function loadingRow(cols) {
  return `<tr class="loading-row"><td colspan="${cols}">
    <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
      <div class="spinner"></div> Loading…
    </div>
  </td></tr>`;
}

function emptyRow(cols, message = "No records found") {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <h4>${message}</h4>
      <p>No data available to display.</p>
    </div>
  </td></tr>`;
}

// ─────────────────────────────────────────────
// Modal helpers
// ─────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ─────────────────────────────────────────────
// Confirmation dialog
// ─────────────────────────────────────────────
function confirmAction(message) {
  return window.confirm(message);
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
  const el = id => document.getElementById(id);

  // Reset
  ["stat-patients","stat-doctors","stat-appts","stat-admitted","stat-rooms","stat-total-rooms"]
    .forEach(id => { const e = el(id); if (e) e.textContent = "…"; });

  try {
    const data = await API.getStats();

    el("stat-patients").textContent   = data.total_patients ?? 0;
    el("stat-doctors").textContent    = data.total_doctors ?? 0;
    el("stat-appts").textContent      = data.today_appointments ?? 0;
    el("stat-admitted").textContent   = data.admitted_patients ?? 0;
    el("stat-rooms").textContent      = data.available_rooms ?? 0;
    el("stat-total-rooms").textContent= `of ${data.total_rooms ?? 0} total`;

    // Recent Appointments table
    const aptBody = el("recent-appts-body");
    if (aptBody) {
      if (!data.recent_appointments?.length) {
        aptBody.innerHTML = emptyRow(5, "No appointments yet");
      } else {
        aptBody.innerHTML = data.recent_appointments.map(a => `
          <tr>
            <td><strong>${escHtml(a.patient_name)}</strong></td>
            <td>${escHtml(a.doctor_name)}</td>
            <td>${formatDate(a.appointment_date)}</td>
            <td>${formatTime(a.appointment_time)}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>`).join("");
      }
    }

    // Recent Admissions table
    const admBody = el("recent-admissions-body");
    if (admBody) {
      if (!data.recent_admissions?.length) {
        admBody.innerHTML = emptyRow(5, "No admissions yet");
      } else {
        admBody.innerHTML = data.recent_admissions.map(a => `
          <tr>
            <td><strong>${escHtml(a.patient_name)}</strong></td>
            <td>${escHtml(a.doctor_name)}</td>
            <td>${escHtml(a.room_no)} <span class="td-muted">(${escHtml(a.room_type)})</span></td>
            <td>${formatDate(a.admission_date)}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>`).join("");
      }
    }
  } catch (err) {
    showToast("error", "Dashboard Error", err.message);
    ["stat-patients","stat-doctors","stat-appts","stat-admitted","stat-rooms"]
      .forEach(id => { const e = el(id); if (e) e.textContent = "!"; });
  }
}

// ─────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────
let allPatients = [];

async function loadPatients() {
  const tbody = document.getElementById("patients-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);

  try {
    allPatients = await API.getPatients();
    renderPatients(allPatients);
  } catch (err) {
    tbody.innerHTML = emptyRow(7, "Could not load patients");
    showToast("error", "Patients Error", err.message);
  }
}

function renderPatients(patients) {
  const tbody = document.getElementById("patients-body");
  const count = document.getElementById("patients-count");
  if (count) count.textContent = `${patients.length} patient${patients.length !== 1 ? "s" : ""}`;

  if (!patients.length) {
    tbody.innerHTML = emptyRow(7, "No patients found");
    return;
  }

  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><span class="badge badge-info">#${p.patient_id}</span></td>
      <td><strong>${escHtml(p.patient_name)}</strong></td>
      <td>${escHtml(p.gender)}</td>
      <td>${formatDate(p.dob)}</td>
      <td>${escHtml(p.blood_group || "—")}</td>
      <td>${escHtml(p.phone)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="viewPatient(${p.patient_id})">👁 View</button>
      </td>
    </tr>`).join("");
}

function filterPatients() {
  const q = document.getElementById("patient-search").value.toLowerCase();
  const filtered = allPatients.filter(p =>
    p.patient_name.toLowerCase().includes(q) ||
    String(p.patient_id).includes(q) ||
    (p.phone && p.phone.includes(q))
  );
  renderPatients(filtered);
}

async function viewPatient(id) {
  const patient = allPatients.find(p => p.patient_id === id);
  if (!patient) return;

  document.getElementById("view-patient-content").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-label">Patient ID</div>
        <div class="detail-value">#${patient.patient_id}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Full Name</div>
        <div class="detail-value">${escHtml(patient.patient_name)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Gender</div>
        <div class="detail-value">${escHtml(patient.gender)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Date of Birth</div>
        <div class="detail-value">${formatDate(patient.dob)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Blood Group</div>
        <div class="detail-value">${escHtml(patient.blood_group || "—")}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Phone</div>
        <div class="detail-value">${escHtml(patient.phone)}</div>
      </div>
      <div class="detail-item" style="grid-column:1/-1">
        <div class="detail-label">Address</div>
        <div class="detail-value">${escHtml(patient.address || "—")}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Registered On</div>
        <div class="detail-value">${formatDateTime(patient.registration_date)}</div>
      </div>
    </div>`;
  openModal("modal-view-patient");
}

async function submitRegisterPatient(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-register-patient");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Registering...`;

  const data = {
    patient_name: document.getElementById("reg-name").value.trim(),
    gender:       document.getElementById("reg-gender").value,
    dob:          document.getElementById("reg-dob").value,
    blood_group:  document.getElementById("reg-blood").value || undefined,
    phone:        document.getElementById("reg-phone").value.trim(),
    address:      document.getElementById("reg-address").value.trim() || undefined
  };

  try {
    const res = await API.registerPatient(data);
    showToast("success", "Patient Registered", `${res.patient.patient_name} added successfully.`);
    closeModal("modal-register-patient");
    document.getElementById("form-register-patient").reset();
    loadPatients();
  } catch (err) {
    showToast("error", "Registration Failed", err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────
let allDoctors = [];
let allDepartments = [];

async function loadDoctors() {
  const tbody = document.getElementById("doctors-body");
  const deptBody = document.getElementById("depts-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);
  if (deptBody) deptBody.innerHTML = loadingRow(5);

  try {
    [allDoctors, allDepartments] = await Promise.all([API.getDoctors(), API.getDepartments()]);
    renderDoctors(allDoctors);
    renderDepartments(allDepartments);
  } catch (err) {
    tbody.innerHTML = emptyRow(7, "Could not load doctors");
    showToast("error", "Doctors Error", err.message);
  }
}

function renderDoctors(doctors) {
  const tbody = document.getElementById("doctors-body");
  if (!doctors.length) { tbody.innerHTML = emptyRow(7, "No doctors found"); return; }

  const deptMap = Object.fromEntries(allDepartments.map(d => [d.dept_id, d.dept_name]));

  tbody.innerHTML = doctors.map(d => `
    <tr>
      <td><span class="badge badge-info">#${d.doctor_id}</span></td>
      <td><strong>${escHtml(d.doctor_name)}</strong></td>
      <td>${escHtml(d.specialization)}</td>
      <td>${escHtml(deptMap[d.dept_id] || "—")}</td>
      <td>${escHtml(d.qualification || "—")}</td>
      <td>${d.experience_yrs != null ? d.experience_yrs + " yrs" : "—"}</td>
      <td>${escHtml(d.phone || "—")}</td>
    </tr>`).join("");
}

function renderDepartments(departments) {
  const tbody = document.getElementById("depts-body");
  if (!tbody) return;
  if (!departments.length) { tbody.innerHTML = emptyRow(5, "No departments found"); return; }

  tbody.innerHTML = departments.map(d => `
    <tr>
      <td><span class="badge badge-secondary">#${d.dept_id}</span></td>
      <td><strong>${escHtml(d.dept_name)}</strong></td>
      <td>${escHtml(d.location)}</td>
      <td>${escHtml(d.hod_name || "—")}</td>
      <td>${escHtml(d.contact_no || "—")}</td>
    </tr>`).join("");
}

function filterDoctors() {
  const q = document.getElementById("doctor-search").value.toLowerCase();
  const spec = document.getElementById("doctor-filter-spec").value.toLowerCase();
  const filtered = allDoctors.filter(d =>
    (d.doctor_name.toLowerCase().includes(q) || String(d.doctor_id).includes(q)) &&
    (!spec || d.specialization.toLowerCase().includes(spec))
  );
  renderDoctors(filtered);
}

// ─────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────
let allAppointments = [];

async function loadAppointments() {
  const tbody = document.getElementById("appointments-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);

  try {
    allAppointments = await API.getAppointments();
    renderAppointments(allAppointments);
  } catch (err) {
    tbody.innerHTML = emptyRow(7, "Could not load appointments");
    showToast("error", "Appointments Error", err.message);
  }
}

function renderAppointments(appointments) {
  const tbody = document.getElementById("appointments-body");
  const count = document.getElementById("appts-count");
  if (count) count.textContent = `${appointments.length} record${appointments.length !== 1 ? "s" : ""}`;

  const pMap = Object.fromEntries(allPatients.map(p => [p.patient_id, p.patient_name]));
  const dMap = Object.fromEntries(allDoctors.map(d => [d.doctor_id, d.doctor_name]));

  if (!appointments.length) { tbody.innerHTML = emptyRow(7, "No appointments found"); return; }

  tbody.innerHTML = appointments.map(a => `
    <tr>
      <td><span class="badge badge-info">#${a.appointment_id}</span></td>
      <td>${escHtml(pMap[a.patient_id] || `P#${a.patient_id}`)}</td>
      <td>${escHtml(dMap[a.doctor_id] || `D#${a.doctor_id}`)}</td>
      <td>${formatDate(a.appointment_date)}</td>
      <td>${formatTime(a.appointment_time)}</td>
      <td><span class="td-muted">${escHtml(a.reason || "—")}</span></td>
      <td>${statusBadge(a.status)}</td>
    </tr>`).join("");
}

function filterAppointments() {
  const q = document.getElementById("appt-search").value.toLowerCase();
  const status = document.getElementById("appt-filter-status").value;
  const pMap = Object.fromEntries(allPatients.map(p => [p.patient_id, p.patient_name.toLowerCase()]));
  const dMap = Object.fromEntries(allDoctors.map(d => [d.doctor_id, d.doctor_name.toLowerCase()]));

  const filtered = allAppointments.filter(a =>
    (!status || a.status === status) &&
    (!q || (pMap[a.patient_id] || "").includes(q) || (dMap[a.doctor_id] || "").includes(q) || String(a.appointment_id).includes(q))
  );
  renderAppointments(filtered);
}

async function openBookAppointment() {
  // Preload patients and doctors if needed
  if (!allPatients.length) allPatients = await API.getPatients().catch(() => []);
  if (!allDoctors.length)  allDoctors  = await API.getDoctors().catch(() => []);

  const patSel = document.getElementById("book-patient");
  const docSel = document.getElementById("book-doctor");

  patSel.innerHTML = `<option value="">— Select Patient —</option>` +
    allPatients.map(p => `<option value="${p.patient_id}">${escHtml(p.patient_name)} (#${p.patient_id})</option>`).join("");

  docSel.innerHTML = `<option value="">— Select Doctor —</option>` +
    allDoctors.map(d => `<option value="${d.doctor_id}">${escHtml(d.doctor_name)} – ${escHtml(d.specialization)}</option>`).join("");

  document.getElementById("form-book-appt").reset();
  openModal("modal-book-appt");
}

async function submitBookAppointment(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-book-appt");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Booking...`;

  const data = {
    patient_id:       Number(document.getElementById("book-patient").value),
    doctor_id:        Number(document.getElementById("book-doctor").value),
    appointment_date: document.getElementById("book-date").value,
    appointment_time: document.getElementById("book-time").value,
    reason:           document.getElementById("book-reason").value.trim() || undefined
  };

  try {
    await API.bookAppointment(data);
    showToast("success", "Appointment Booked", "The appointment has been scheduled.");
    closeModal("modal-book-appt");
    loadAppointments();
  } catch (err) {
    showToast("error", "Booking Failed", err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─────────────────────────────────────────────
// ADMISSIONS
// ─────────────────────────────────────────────
let allAdmissions = [];
let allRooms = [];

async function loadAdmissions() {
  const tbody = document.getElementById("admissions-body");
  const roomBody = document.getElementById("rooms-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);
  if (roomBody) roomBody.innerHTML = loadingRow(6);

  try {
    [allAdmissions, allRooms] = await Promise.all([API.getAdmissions(), API.getRooms()]);
    renderAdmissions(allAdmissions);
    renderRooms(allRooms);
    updateRoomStats();
  } catch (err) {
    tbody.innerHTML = emptyRow(7, "Could not load admissions");
    showToast("error", "Admissions Error", err.message);
  }
}

function renderAdmissions(admissions) {
  const tbody = document.getElementById("admissions-body");
  const count = document.getElementById("admissions-count");
  if (count) count.textContent = `${admissions.length} record${admissions.length !== 1 ? "s" : ""}`;
  if (!admissions.length) { tbody.innerHTML = emptyRow(7, "No admissions found"); return; }

  tbody.innerHTML = admissions.map(a => `
    <tr>
      <td><span class="badge badge-info">#${a.admission_id}</span></td>
      <td><strong>${escHtml(a.patient_name)}</strong></td>
      <td>${escHtml(a.doctor_name)}</td>
      <td>${escHtml(a.room_no)} <span class="td-muted">(${escHtml(a.room_type)})</span></td>
      <td>${formatDate(a.admission_date)}</td>
      <td>${a.discharge_date ? formatDate(a.discharge_date) : '<span class="td-muted">—</span>'}</td>
      <td>${statusBadge(a.status)}</td>
    </tr>`).join("");
}

function renderRooms(rooms) {
  const tbody = document.getElementById("rooms-body");
  if (!tbody) return;
  if (!rooms.length) { tbody.innerHTML = emptyRow(6, "No rooms found"); return; }

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>${escHtml(r.room_no)}</strong></td>
      <td>${escHtml(r.room_type)}</td>
      <td>${escHtml(r.dept_name || "—")}</td>
      <td>${formatCurrency(r.cost_per_day)}<span class="td-muted">/day</span></td>
      <td>${statusBadge(r.status)}</td>
    </tr>`).join("");
}

function updateRoomStats() {
  const available = allRooms.filter(r => r.status === "Available").length;
  const occupied  = allRooms.filter(r => r.status === "Occupied").length;
  const maintenance = allRooms.filter(r => r.status === "Maintenance").length;
  const el = id => document.getElementById(id);
  if (el("room-stat-available"))    el("room-stat-available").textContent   = available;
  if (el("room-stat-occupied"))     el("room-stat-occupied").textContent    = occupied;
  if (el("room-stat-maintenance"))  el("room-stat-maintenance").textContent = maintenance;
}

function filterAdmissions() {
  const q = document.getElementById("admission-search").value.toLowerCase();
  const status = document.getElementById("admission-filter-status").value;
  const filtered = allAdmissions.filter(a =>
    (!status || a.status === status) &&
    (!q || a.patient_name.toLowerCase().includes(q) || String(a.admission_id).includes(q))
  );
  renderAdmissions(filtered);
}

async function openAdmitPatient() {
  if (!allPatients.length) allPatients = await API.getPatients().catch(() => []);
  if (!allDoctors.length)  allDoctors  = await API.getDoctors().catch(() => []);
  const availableRooms = await API.getAvailableRooms().catch(() => []);

  const patSel = document.getElementById("admit-patient");
  const docSel = document.getElementById("admit-doctor");
  const roomSel = document.getElementById("admit-room");

  patSel.innerHTML = `<option value="">— Select Patient —</option>` +
    allPatients.map(p => `<option value="${p.patient_id}">${escHtml(p.patient_name)} (#${p.patient_id})</option>`).join("");

  docSel.innerHTML = `<option value="">— Select Doctor —</option>` +
    allDoctors.map(d => `<option value="${d.doctor_id}">${escHtml(d.doctor_name)} – ${escHtml(d.specialization)}</option>`).join("");

  if (!availableRooms.length) {
    roomSel.innerHTML = `<option value="">No available rooms</option>`;
  } else {
    roomSel.innerHTML = `<option value="">— Select Room —</option>` +
      availableRooms.map(r =>
        `<option value="${r.room_id}">${escHtml(r.room_no)} – ${escHtml(r.room_type)} (${formatCurrency(r.cost_per_day)}/day)</option>`
      ).join("");
  }

  document.getElementById("form-admit-patient").reset();
  openModal("modal-admit-patient");
}

async function submitAdmitPatient(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-admit-patient");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Admitting...`;

  const data = {
    patient_id:     Number(document.getElementById("admit-patient").value),
    doctor_id:      Number(document.getElementById("admit-doctor").value),
    room_id:        Number(document.getElementById("admit-room").value),
    admission_date: document.getElementById("admit-date").value
  };

  try {
    await API.admitPatient(data);
    showToast("success", "Patient Admitted", "The patient has been admitted successfully.");
    closeModal("modal-admit-patient");
    loadAdmissions();
  } catch (err) {
    showToast("error", "Admission Failed", err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─────────────────────────────────────────────
// DISCHARGES / BILLING
// ─────────────────────────────────────────────
let allBills = [];
let activeAdmissions = [];

async function loadDischarges() {
  const tbody = document.getElementById("billing-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(8);

  try {
    allBills = await API.getBillingRecords();
    renderBills(allBills);
  } catch (err) {
    tbody.innerHTML = emptyRow(8, "Could not load billing records");
    showToast("error", "Billing Error", err.message);
  }
}

function renderBills(bills) {
  const tbody = document.getElementById("billing-body");
  const count = document.getElementById("bills-count");
  if (count) count.textContent = `${bills.length} bill${bills.length !== 1 ? "s" : ""}`;
  if (!bills.length) { tbody.innerHTML = emptyRow(8, "No billing records found"); return; }

  tbody.innerHTML = bills.map(b => `
    <tr>
      <td><span class="badge badge-info">#${b.bill_id}</span></td>
      <td>${escHtml(b.patient_name)}</td>
      <td>${formatCurrency(b.room_charges)}</td>
      <td>${formatCurrency(b.medicine_charges)}</td>
      <td>${formatCurrency(b.doctor_fee)}</td>
      <td>${formatCurrency(b.test_charges)}</td>
      <td><strong>${formatCurrency(b.total_amount)}</strong></td>
      <td>${statusBadge(b.payment_status)}</td>
    </tr>`).join("");
}

async function openDischargePatient() {
  // Load currently admitted patients
  const admissions = await API.getAdmissions().catch(() => []);
  activeAdmissions = admissions.filter(a => a.status === "Admitted");

  const admSel = document.getElementById("discharge-admission");
  if (!activeAdmissions.length) {
    admSel.innerHTML = `<option value="">No currently admitted patients</option>`;
  } else {
    admSel.innerHTML = `<option value="">— Select Admission —</option>` +
      activeAdmissions.map(a =>
        `<option value="${a.admission_id}">${escHtml(a.patient_name)} – Room ${escHtml(a.room_no)} (Admitted ${formatDate(a.admission_date)})</option>`
      ).join("");
  }

  document.getElementById("form-discharge-patient").reset();
  document.getElementById("discharge-bill-preview").style.display = "none";
  openModal("modal-discharge-patient");
}

async function submitDischargePatient(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-discharge-patient");

  if (!confirmAction("Are you sure you want to discharge this patient? This action cannot be undone.")) return;

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Processing...`;

  const data = {
    admission_id:   Number(document.getElementById("discharge-admission").value),
    discharge_date: document.getElementById("discharge-date").value,
    doctor_fee:     Number(document.getElementById("discharge-doctor-fee").value)
  };

  try {
    const res = await API.dischargePatient(data);
    showToast("success", "Patient Discharged", `Discharge complete. Bill generated.`);

    // Show bill summary in modal
    if (res.bill) {
      const b = res.bill;
      document.getElementById("discharge-bill-preview").style.display = "block";
      document.getElementById("discharge-bill-preview").innerHTML = `
        <div style="margin-top:20px;padding:18px;background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border);">
          <h4 style="margin-bottom:14px;color:var(--text-primary);">🧾 Bill Summary</h4>
          <div class="bill-row"><span class="bill-label">Room Charges</span><span class="bill-value">${formatCurrency(b.room_charges)}</span></div>
          <div class="bill-row"><span class="bill-label">Medicine Charges</span><span class="bill-value">${formatCurrency(b.medicine_charges)}</span></div>
          <div class="bill-row"><span class="bill-label">Doctor Fee</span><span class="bill-value">${formatCurrency(b.doctor_fee)}</span></div>
          <div class="bill-row"><span class="bill-label">Test Charges</span><span class="bill-value">${formatCurrency(b.test_charges)}</span></div>
          <div class="bill-row bill-total" style="padding-top:10px;margin-top:6px;border-top:2px solid var(--border);">
            <span class="bill-label" style="font-weight:700">Total Amount</span>
            <span class="bill-value">${formatCurrency(b.total_amount)}</span>
          </div>
        </div>`;
    }

    loadDischarges();
  } catch (err) {
    showToast("error", "Discharge Failed", err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─────────────────────────────────────────────
// MEDICINES
// ─────────────────────────────────────────────
let allMedicines = [];

async function loadMedicines() {
  const tbody = document.getElementById("medicines-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(5);
  try {
    allMedicines = await API.getMedicines();
    renderMedicines(allMedicines);
  } catch (err) {
    tbody.innerHTML = emptyRow(5, "Could not load medicines");
    showToast("error", "Medicines Error", err.message);
  }
}

function renderMedicines(medicines) {
  const tbody = document.getElementById("medicines-body");
  const count = document.getElementById("medicines-count");
  if (count) count.textContent = `${medicines.length} item${medicines.length !== 1 ? "s" : ""}`;
  if (!medicines.length) { tbody.innerHTML = emptyRow(5, "No medicines found"); return; }

  tbody.innerHTML = medicines.map(m => {
    const stockClass = m.stock_qty === 0 ? "badge-danger" : m.stock_qty < 20 ? "badge-warning" : "badge-success";
    return `<tr>
      <td><span class="badge badge-info">#${m.medicine_id}</span></td>
      <td><strong>${escHtml(m.medicine_name)}</strong></td>
      <td>${escHtml(m.manufacturer || "—")}</td>
      <td>${formatCurrency(m.unit_price)}</td>
      <td><span class="badge ${stockClass}">${m.stock_qty} units</span></td>
    </tr>`;
  }).join("");
}

function filterMedicines() {
  const q = document.getElementById("medicine-search").value.toLowerCase();
  const filtered = allMedicines.filter(m =>
    m.medicine_name.toLowerCase().includes(q) ||
    (m.manufacturer || "").toLowerCase().includes(q)
  );
  renderMedicines(filtered);
}

// ─────────────────────────────────────────────
// LAB TESTS
// ─────────────────────────────────────────────
let allLabTests = [];

async function loadLabTests() {
  const tbody = document.getElementById("labtests-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(7);
  try {
    allLabTests = await API.getLabTests();
    renderLabTests(allLabTests);
  } catch (err) {
    tbody.innerHTML = emptyRow(7, "Could not load lab tests");
    showToast("error", "Lab Tests Error", err.message);
  }
}

function renderLabTests(tests) {
  const tbody = document.getElementById("labtests-body");
  const count = document.getElementById("labtests-count");
  if (count) count.textContent = `${tests.length} test${tests.length !== 1 ? "s" : ""}`;
  if (!tests.length) { tbody.innerHTML = emptyRow(7, "No lab tests found"); return; }

  tbody.innerHTML = tests.map(t => `
    <tr>
      <td><span class="badge badge-info">#${t.test_id}</span></td>
      <td><strong>${escHtml(t.patient_name)}</strong></td>
      <td>${escHtml(t.doctor_name)}</td>
      <td>${escHtml(t.test_name)}</td>
      <td>${formatDate(t.test_date)}</td>
      <td>${statusBadge(t.result === "Pending" ? "Pending" : t.result ? "Completed" : "Pending")}
          <span class="td-muted" style="margin-left:4px">${t.result !== "Pending" ? escHtml(t.result || "") : ""}</span></td>
      <td>${formatCurrency(t.cost)}</td>
    </tr>`).join("");
}

function filterLabTests() {
  const q = document.getElementById("labtest-search").value.toLowerCase();
  const filtered = allLabTests.filter(t =>
    t.patient_name.toLowerCase().includes(q) ||
    t.test_name.toLowerCase().includes(q) ||
    String(t.test_id).includes(q)
  );
  renderLabTests(filtered);
}

// ─────────────────────────────────────────────
// PRESCRIPTIONS
// ─────────────────────────────────────────────
let allPrescriptions = [];

async function loadPrescriptions() {
  const tbody = document.getElementById("prescriptions-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(5);
  try {
    allPrescriptions = await API.getPrescriptions();
    renderPrescriptions(allPrescriptions);
  } catch (err) {
    tbody.innerHTML = emptyRow(5, "Could not load prescriptions");
    showToast("error", "Prescriptions Error", err.message);
  }
}

function renderPrescriptions(prescriptions) {
  const tbody = document.getElementById("prescriptions-body");
  const count = document.getElementById("prescriptions-count");
  if (count) count.textContent = `${prescriptions.length} record${prescriptions.length !== 1 ? "s" : ""}`;
  if (!prescriptions.length) { tbody.innerHTML = emptyRow(5, "No prescriptions found"); return; }

  tbody.innerHTML = prescriptions.map(p => `
    <tr>
      <td><span class="badge badge-info">#${p.prescription_id}</span></td>
      <td><strong>${escHtml(p.patient_name)}</strong></td>
      <td>${escHtml(p.doctor_name)}</td>
      <td>${formatDateTime(p.date_issued)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="viewPrescriptionDetails(${p.prescription_id})">💊 Details</button>
      </td>
    </tr>`).join("");
}

async function viewPrescriptionDetails(id) {
  const prescription = allPrescriptions.find(p => p.prescription_id === id);
  if (!prescription) return;

  document.getElementById("presc-detail-title").textContent =
    `Prescription #${id} — ${prescription.patient_name}`;

  const body = document.getElementById("presc-detail-body");
  body.innerHTML = `<div style="display:flex;align-items:center;gap:8px;justify-content:center;padding:20px;"><div class="spinner"></div> Loading details…</div>`;
  openModal("modal-presc-detail");

  try {
    const details = await API.getPrescriptionDetails(id);
    if (!details.length) {
      body.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No medicine details recorded for this prescription.</p>`;
      return;
    }

    body.innerHTML = `
      <div style="margin-bottom:16px;padding:12px;background:var(--surface-2);border-radius:var(--radius-sm);">
        <strong>Patient:</strong> ${escHtml(prescription.patient_name)} &nbsp;|&nbsp;
        <strong>Doctor:</strong> ${escHtml(prescription.doctor_name)} &nbsp;|&nbsp;
        <strong>Date:</strong> ${formatDateTime(prescription.date_issued)}
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Duration</th>
              <th>Qty</th>
              <th>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            ${details.map(d => `
              <tr>
                <td><strong>${escHtml(d.medicine_name)}</strong></td>
                <td>${escHtml(d.dosage)}</td>
                <td>${d.duration_days} day${d.duration_days !== 1 ? "s" : ""}</td>
                <td>${d.quantity}</td>
                <td>${formatCurrency(d.unit_price)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--danger);padding:20px;">Failed to load details: ${escHtml(err.message)}</p>`;
  }
}

function filterPrescriptions() {
  const q = document.getElementById("presc-search").value.toLowerCase();
  const filtered = allPrescriptions.filter(p =>
    p.patient_name.toLowerCase().includes(q) ||
    p.doctor_name.toLowerCase().includes(q) ||
    String(p.prescription_id).includes(q)
  );
  renderPrescriptions(filtered);
}

// ─────────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────────
let allStaff = [];

async function loadStaff() {
  const tbody = document.getElementById("staff-body");
  if (!tbody) return;
  tbody.innerHTML = loadingRow(6);
  try {
    allStaff = await API.getStaff();
    renderStaff(allStaff);
  } catch (err) {
    tbody.innerHTML = emptyRow(6, "Could not load staff");
    showToast("error", "Staff Error", err.message);
  }
}

function renderStaff(staff) {
  const tbody = document.getElementById("staff-body");
  const count = document.getElementById("staff-count");
  if (count) count.textContent = `${staff.length} member${staff.length !== 1 ? "s" : ""}`;
  if (!staff.length) { tbody.innerHTML = emptyRow(6, "No staff found"); return; }

  const shiftBadge = { Morning: "badge-success", Evening: "badge-warning", Night: "badge-info" };
  tbody.innerHTML = staff.map(s => `
    <tr>
      <td><span class="badge badge-info">#${s.staff_id}</span></td>
      <td><strong>${escHtml(s.staff_name)}</strong></td>
      <td>${escHtml(s.role)}</td>
      <td>${escHtml(s.dept_name || "—")}</td>
      <td>${escHtml(s.phone || "—")}</td>
      <td><span class="badge ${shiftBadge[s.shift] || "badge-muted"}">${escHtml(s.shift)}</span></td>
    </tr>`).join("");
}

function filterStaff() {
  const q = document.getElementById("staff-search").value.toLowerCase();
  const shift = document.getElementById("staff-filter-shift").value;
  const filtered = allStaff.filter(s =>
    (!shift || s.shift === shift) &&
    (s.staff_name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
  );
  renderStaff(filtered);
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Nav item clicks
  document.querySelectorAll(".nav-item[data-section]").forEach(el => {
    el.addEventListener("click", () => navigateTo(el.dataset.section));
  });

  // Mobile sidebar toggle
  document.getElementById("btn-hamburger")?.addEventListener("click", openSidebar);
  document.getElementById("sidebar-overlay")?.addEventListener("click", closeSidebar);

  // Quick action buttons on dashboard
  document.getElementById("qa-register-patient")?.addEventListener("click", () => {
    navigateTo("patients");
    setTimeout(() => openModal("modal-register-patient"), 100);
  });
  document.getElementById("qa-book-appt")?.addEventListener("click", () => {
    navigateTo("appointments");
    setTimeout(() => openBookAppointment(), 100);
  });
  document.getElementById("qa-admit-patient")?.addEventListener("click", () => {
    navigateTo("admissions");
    setTimeout(() => openAdmitPatient(), 100);
  });
  document.getElementById("qa-discharge")?.addEventListener("click", () => {
    navigateTo("discharges");
    setTimeout(() => openDischargePatient(), 100);
  });

  // Patient section
  document.getElementById("patient-search")?.addEventListener("input", filterPatients);
  document.getElementById("btn-register-patient")?.addEventListener("click", () => openModal("modal-register-patient"));
  document.getElementById("form-register-patient")?.addEventListener("submit", submitRegisterPatient);

  // Appointments
  document.getElementById("appt-search")?.addEventListener("input", filterAppointments);
  document.getElementById("appt-filter-status")?.addEventListener("change", filterAppointments);
  document.getElementById("btn-book-appt")?.addEventListener("click", openBookAppointment);
  document.getElementById("form-book-appt")?.addEventListener("submit", submitBookAppointment);

  // Doctors
  document.getElementById("doctor-search")?.addEventListener("input", filterDoctors);
  document.getElementById("doctor-filter-spec")?.addEventListener("input", filterDoctors);

  // Admissions
  document.getElementById("admission-search")?.addEventListener("input", filterAdmissions);
  document.getElementById("admission-filter-status")?.addEventListener("change", filterAdmissions);
  document.getElementById("btn-admit-patient")?.addEventListener("click", openAdmitPatient);
  document.getElementById("form-admit-patient")?.addEventListener("submit", submitAdmitPatient);

  // Room tabs
  document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn[data-tab]").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel[data-tab]").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.querySelector(`.tab-panel[data-tab="${btn.dataset.tab}"]`)?.classList.add("active");
    });
  });

  // Discharges
  document.getElementById("billing-search")?.addEventListener("input", () => {
    const q = document.getElementById("billing-search").value.toLowerCase();
    renderBills(allBills.filter(b => b.patient_name.toLowerCase().includes(q)));
  });
  document.getElementById("btn-discharge-patient")?.addEventListener("click", openDischargePatient);
  document.getElementById("form-discharge-patient")?.addEventListener("submit", submitDischargePatient);

  // Medicines
  document.getElementById("medicine-search")?.addEventListener("input", filterMedicines);

  // Lab Tests
  document.getElementById("labtest-search")?.addEventListener("input", filterLabTests);

  // Prescriptions
  document.getElementById("presc-search")?.addEventListener("input", filterPrescriptions);

  // Staff
  document.getElementById("staff-search")?.addEventListener("input", filterStaff);
  document.getElementById("staff-filter-shift")?.addEventListener("change", filterStaff);

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  // Load dashboard first
  navigateTo("dashboard");
});
