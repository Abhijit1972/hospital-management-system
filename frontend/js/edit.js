/**
 * edit.js – Adds an "Edit" button to every table row and a shared edit form.
 * Load AFTER app.js. It wraps the existing render functions, so app.js is unchanged.
 */
(function () {
  const SHIFTS = ["Morning", "Evening", "Night"];

  // field types: text | tel | number | money | date | time | select | fk
  const CONFIG = {
    patients: {
      title: "Patient", body: "patients-body", render: "renderPatients", idKey: "patient_id", reload: "loadPatients",
      hasActionsCol: true,
      fields: [
        { name: "patient_name", label: "Full Name", type: "text", max: 50, full: true },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "blood_group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], blank: true },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "address", label: "Address", type: "text", max: 150, full: true }
      ]
    },
    doctors: {
      title: "Doctor", body: "doctors-body", render: "renderDoctors", idKey: "doctor_id", reload: "loadDoctors",
      fields: [
        { name: "doctor_name", label: "Name", type: "text", max: 50, full: true },
        { name: "specialization", label: "Specialization", type: "text", max: 50 },
        { name: "dept_id", label: "Department", type: "fk", source: "departments" },
        { name: "qualification", label: "Qualification", type: "text", max: 100 },
        { name: "experience_yrs", label: "Experience (yrs)", type: "number", min: 0 },
        { name: "phone", label: "Phone", type: "tel" }
      ]
    },
    departments: {
      title: "Department", body: "depts-body", render: "renderDepartments", idKey: "dept_id", reload: "loadDoctors",
      fields: [
        { name: "dept_name", label: "Department Name", type: "text", max: 50, full: true },
        { name: "location", label: "Location", type: "text", max: 100 },
        { name: "hod_name", label: "Head of Dept.", type: "text", max: 50 },
        { name: "contact_no", label: "Contact No.", type: "tel" }
      ]
    },
    appointments: {
      title: "Appointment", body: "appointments-body", render: "renderAppointments", idKey: "appointment_id", reload: "loadAppointments",
      fields: [
        { name: "doctor_id", label: "Doctor", type: "fk", source: "doctors" },
        { name: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
        { name: "appointment_date", label: "Date", type: "date" },
        { name: "appointment_time", label: "Time", type: "time" },
        { name: "reason", label: "Reason", type: "text", max: 150, full: true }
      ]
    },
    admissions: {
      title: "Admission", body: "admissions-body", render: "renderAdmissions", idKey: "admission_id", reload: "loadAdmissions",
      fields: [
        { name: "doctor_id", label: "Doctor", type: "fk", source: "doctors" },
        { name: "admission_date", label: "Admission Date", type: "date" }
      ]
    },
    rooms: {
      title: "Room", body: "rooms-body", render: "renderRooms", idKey: "room_id", reload: "loadAdmissions",
      fields: [
        { name: "room_no", label: "Room No.", type: "text", max: 20 },
        { name: "room_type", label: "Room Type", type: "text", max: 30 },
        { name: "dept_id", label: "Department", type: "fk", source: "departments" },
        { name: "cost_per_day", label: "Cost / Day (₹)", type: "money" },
        { name: "status", label: "Status", type: "select", options: ["Available", "Occupied", "Maintenance"] }
      ]
    },
    billing: {
      title: "Bill", body: "billing-body", render: "renderBills", idKey: "bill_id", reload: "loadDischarges",
      fields: [
        { name: "payment_status", label: "Payment Status", type: "select", options: ["Paid", "Unpaid", "Partial"], full: true }
      ]
    },
    medicines: {
      title: "Medicine", body: "medicines-body", render: "renderMedicines", idKey: "medicine_id", reload: "loadMedicines",
      fields: [
        { name: "medicine_name", label: "Medicine Name", type: "text", max: 100, full: true },
        { name: "manufacturer", label: "Manufacturer", type: "text", max: 100 },
        { name: "unit_price", label: "Unit Price (₹)", type: "money" },
        { name: "stock_qty", label: "Stock Quantity", type: "number", min: 0 }
      ]
    },
    "lab-tests": {
      title: "Lab Test", body: "labtests-body", render: "renderLabTests", idKey: "test_id", reload: "loadLabTests",
      fields: [
        { name: "test_name", label: "Test Name", type: "text", max: 100, full: true },
        { name: "doctor_id", label: "Doctor", type: "fk", source: "doctors" },
        { name: "test_date", label: "Test Date", type: "date" },
        { name: "result", label: "Result", type: "text", max: 255 },
        { name: "cost", label: "Cost (₹)", type: "money" }
      ]
    },
    staff: {
      title: "Staff Member", body: "staff-body", render: "renderStaff", idKey: "staff_id", reload: "loadStaff",
      fields: [
        { name: "staff_name", label: "Name", type: "text", max: 50, full: true },
        { name: "role", label: "Role", type: "text", max: 50 },
        { name: "dept_id", label: "Department", type: "fk", source: "departments" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "shift", label: "Shift", type: "select", options: SHIFTS }
      ]
    }
  };

  const SOURCES = {
    departments: { load: () => API.getDepartments(), value: "dept_id", label: "dept_name" },
    doctors:     { load: () => API.getDoctors(),     value: "doctor_id", label: "doctor_name" }
  };

  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ── Row decoration ────────────────────────────────────────
  function decorate(resource, list) {
    const cfg = CONFIG[resource];
    const tbody = document.getElementById(cfg.body);
    if (!tbody || !Array.isArray(list)) return;

    const table = tbody.closest("table");
    const headRow = table && table.querySelector("thead tr");
    if (headRow && !headRow.querySelector("[data-edit-col]") && !cfg.hasActionsCol) {
      const th = document.createElement("th");
      th.textContent = "Edit";
      th.dataset.editCol = "1";
      headRow.appendChild(th);
    }

    const rows = [...tbody.children].filter(tr => !tr.querySelector("td[colspan]"));
    rows.forEach((tr, i) => {
      const rec = list[i];
      if (!rec || tr.querySelector(".btn-edit-row")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm btn-outline btn-edit-row";
      btn.textContent = "✏️ Edit";
      btn.style.marginLeft = cfg.hasActionsCol ? "6px" : "0";
      btn.addEventListener("click", () => openEdit(resource, rec[cfg.idKey]));

      if (cfg.hasActionsCol) {
        tr.lastElementChild.appendChild(btn);
      } else {
        const td = document.createElement("td");
        td.appendChild(btn);
        tr.appendChild(td);
      }
    });
  }

  // Wrap each existing render function (they are global function declarations)
  Object.entries(CONFIG).forEach(([resource, cfg]) => {
    const original = window[cfg.render];
    if (typeof original !== "function") return;
    window[cfg.render] = function (list) {
      const out = original.apply(this, arguments);
      decorate(resource, list);
      return out;
    };
  });

  // ── Shared modal ──────────────────────────────────────────
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-overlay" id="modal-edit-record" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div class="modal">
        <div class="modal-header">
          <h3 id="edit-title">✏️ Edit</h3>
          <button class="modal-close" type="button" onclick="closeModal('modal-edit-record')" aria-label="Close">✕</button>
        </div>
        <form id="form-edit-record" novalidate>
          <div class="modal-body"><div class="form-grid" id="edit-fields"></div></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" onclick="closeModal('modal-edit-record')">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-edit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>`);

  const overlay = document.getElementById("modal-edit-record");
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal("modal-edit-record"); });

  let state = null; // { resource, id, original }

  function fieldHtml(f, value, fkOptions) {
    const id = `edit-${f.name}`;
    let input;
    if (f.type === "select") {
      const opts = (f.blank ? [""] : []).concat(f.options);
      if (value && !opts.includes(value)) opts.push(value);
      input = `<select id="${id}" class="form-control">${opts.map(o =>
        `<option value="${esc(o)}"${o === (value ?? "") ? " selected" : ""}>${o === "" ? "— None —" : esc(o)}</option>`).join("")}</select>`;
    } else if (f.type === "fk") {
      input = `<select id="${id}" class="form-control">${fkOptions.map(o =>
        `<option value="${esc(o.value)}"${String(o.value) === String(value) ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
    } else {
      const type = { text: "text", tel: "tel", number: "number", money: "number", date: "date", time: "time" }[f.type];
      const extra = f.type === "money" ? ' step="0.01" min="0"' : f.type === "number" ? ` step="1" min="${f.min ?? 0}"` : f.max ? ` maxlength="${f.max}"` : "";
      input = `<input id="${id}" class="form-control" type="${type}"${extra} value="${esc(value ?? "")}" />`;
    }
    return `<div class="form-group${f.full ? " full" : ""}"><label for="${id}">${esc(f.label)}</label>${input}</div>`;
  }

  async function openEdit(resource, id) {
    const cfg = CONFIG[resource];
    try {
      const record = await API.getRecord(resource, id);

      const fkOptions = {};
      for (const f of cfg.fields.filter(f => f.type === "fk")) {
        const src = SOURCES[f.source];
        const rows = await src.load();
        fkOptions[f.name] = rows.map(r => ({ value: r[src.value], label: r[src.label] }));
      }

      document.getElementById("edit-title").textContent = `✏️ Edit ${cfg.title} #${id}`;
      document.getElementById("edit-fields").innerHTML =
        cfg.fields.map(f => fieldHtml(f, record[f.name], fkOptions[f.name])).join("");
      state = { resource, id, original: record };
      openModal("modal-edit-record");
    } catch (err) {
      showToast("error", "Could not open editor", esc(err.message));
    }
  }

  document.getElementById("form-edit-record").addEventListener("submit", async e => {
    e.preventDefault();
    if (!state) return;
    const cfg = CONFIG[state.resource];

    // Send only the columns that actually changed
    const changes = {};
    cfg.fields.forEach(f => {
      const v = document.getElementById(`edit-${f.name}`).value.trim();
      const before = state.original[f.name] == null ? "" : String(state.original[f.name]);
      const same = ["money", "number", "fk"].includes(f.type) && v !== "" && before !== ""
        ? Number(v) === Number(before) : v === before;
      if (!same) changes[f.name] = v === "" ? null : v;
    });

    if (!Object.keys(changes).length) {
      closeModal("modal-edit-record");
      return showToast("info", "No changes", "Nothing was modified.");
    }

    const btn = document.getElementById("btn-save-edit");
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      await API.updateRecord(state.resource, state.id, changes);
      closeModal("modal-edit-record");
      showToast("success", "Saved", `${esc(cfg.title)} #${state.id} updated (${Object.keys(changes).length} field${Object.keys(changes).length > 1 ? "s" : ""}).`);
      if (typeof window[cfg.reload] === "function") window[cfg.reload]();
      else if (typeof loadDashboard === "function") loadDashboard();
    } catch (err) {
      showToast("error", "Update failed", esc(err.message));
    } finally {
      btn.disabled = false; btn.textContent = "Save Changes";
    }
  });

  window.openEdit = openEdit;
})();
