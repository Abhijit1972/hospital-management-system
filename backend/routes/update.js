/**
 * routes/update.js – Generic, whitelisted editing for every table.
 *
 *   GET /api/<resource>/:id/edit   -> the editable columns of one record
 *   PUT /api/<resource>/:id        -> update any subset of the editable columns
 *
 * Only columns listed in SCHEMA can be changed. Column names come from this file,
 * never from the request, and every value goes through a "?" placeholder,
 * so the endpoints are safe from SQL injection.
 */
const express = require("express");
const router = express.Router();
const pool = require("../db");

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Column type helpers: each returns { ok, value } or { ok:false, error }
const T = {
  text: (max, required = true) => ({ kind: "text", max, required }),
  phone: (required = false) => ({ kind: "phone", required }),
  int: (min = 0, required = true) => ({ kind: "int", min, required }),
  money: () => ({ kind: "money" }),
  date: (required = true) => ({ kind: "date", required }),
  time: () => ({ kind: "time" }),
  enum: (values, required = true) => ({ kind: "enum", values, required }),
  fk: () => ({ kind: "fk" })
};

// resource -> { table, pk, columns }
// Change the lists below if your table definitions differ.
const SCHEMA = {
  patients: {
    table: "Patients", pk: "patient_id",
    columns: {
      patient_name: T.text(50), gender: T.enum(["Male", "Female", "Other"]),
      dob: T.date(), blood_group: T.enum(BLOOD, false),
      phone: T.phone(true), address: T.text(150, false)
    }
  },
  doctors: {
    table: "Doctors", pk: "doctor_id",
    columns: {
      doctor_name: T.text(50), specialization: T.text(50), dept_id: T.fk(),
      qualification: T.text(100, false), experience_yrs: T.int(0, false), phone: T.phone(false)
    }
  },
  departments: {
    table: "Departments", pk: "dept_id",
    columns: {
      dept_name: T.text(50), location: T.text(100), hod_name: T.text(50, false), contact_no: T.phone(false)
    }
  },
  appointments: {
    table: "Appointments", pk: "appointment_id",
    columns: {
      doctor_id: T.fk(), appointment_date: T.date(), appointment_time: T.time(),
      reason: T.text(150, false), status: T.enum(["Scheduled", "Completed", "Cancelled"])
    }
  },
  admissions: {
    table: "Admissions", pk: "admission_id",
    columns: { doctor_id: T.fk(), admission_date: T.date() }
  },
  rooms: {
    table: "Rooms", pk: "room_id",
    columns: {
      room_no: T.text(20), room_type: T.text(30), dept_id: T.fk(),
      cost_per_day: T.money(), status: T.enum(["Available", "Occupied", "Maintenance"])
    }
  },
  billing: {
    table: "Billing", pk: "bill_id",
    columns: { payment_status: T.enum(["Paid", "Unpaid", "Partial"]) }
  },
  medicines: {
    table: "Medicines", pk: "medicine_id",
    columns: {
      medicine_name: T.text(100), manufacturer: T.text(100, false),
      unit_price: T.money(), stock_qty: T.int(0)
    }
  },
  "lab-tests": {
    table: "Lab_Tests", pk: "test_id",
    columns: {
      doctor_id: T.fk(), test_name: T.text(100), test_date: T.date(),
      result: T.text(255, false), cost: T.money()
    }
  },
  staff: {
    table: "Staff", pk: "staff_id",
    columns: {
      staff_name: T.text(50), role: T.text(50), dept_id: T.fk(),
      phone: T.phone(false), shift: T.enum(["Morning", "Evening", "Night"])
    }
  }
};

function isRealDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Validate one value. Returns { value } or { error }.
function check(name, def, raw) {
  const label = name.replace(/_/g, " ");
  const empty = raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "");

  if (empty) {
    if (def.required || def.kind === "fk" || def.kind === "money" || def.kind === "time") {
      return { error: `${label} is required` };
    }
    return { value: null };
  }

  switch (def.kind) {
    case "text": {
      if (typeof raw !== "string") return { error: `${label} must be text` };
      const v = raw.trim();
      if (v.length > def.max) return { error: `${label} must be at most ${def.max} characters` };
      return { value: v };
    }
    case "phone":
      if (typeof raw !== "string" || !/^\+?[0-9]{7,15}$/.test(raw.trim()))
        return { error: `${label} must have 7 to 15 digits` };
      return { value: raw.trim() };
    case "int": case "fk": {
      const n = Number(raw);
      const min = def.kind === "fk" ? 1 : def.min;
      if (!Number.isSafeInteger(n) || n < min) return { error: `${label} must be a whole number ≥ ${min}` };
      return { value: n };
    }
    case "money": {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a non-negative number` };
      return { value: n };
    }
    case "date":
      return isRealDate(raw) ? { value: raw } : { error: `${label} must be a valid YYYY-MM-DD date` };
    case "time":
      if (typeof raw !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(raw))
        return { error: `${label} must use HH:MM format` };
      return { value: raw.length === 5 ? raw + ":00" : raw };
    case "enum":
      return def.values.includes(raw) ? { value: raw } : { error: `${label} must be one of: ${def.values.join(", ")}` };
  }
  return { error: `${label} is not editable` };
}

// SELECT list that returns dates/times as plain strings (no timezone shifts)
function selectList(cfg) {
  const cols = Object.entries(cfg.columns).map(([name, def]) => {
    if (def.kind === "date") return `DATE_FORMAT(\`${name}\`, '%Y-%m-%d') AS \`${name}\``;
    if (def.kind === "time") return `TIME_FORMAT(\`${name}\`, '%H:%i') AS \`${name}\``;
    return `\`${name}\``;
  });
  return [`\`${cfg.pk}\``, ...cols].join(", ");
}

function lookup(req, res) {
  const cfg = Object.prototype.hasOwnProperty.call(SCHEMA, req.params.resource)
    ? SCHEMA[req.params.resource] : null;
  const id = Number(req.params.id);
  if (!cfg) { res.status(404).json({ error: "Unknown resource" }); return null; }
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid ID" }); return null; }
  return { cfg, id };
}

async function fetchRecord(cfg, id) {
  const [rows] = await pool.execute(
    `SELECT ${selectList(cfg)} FROM \`${cfg.table}\` WHERE \`${cfg.pk}\` = ?`, [id]
  );
  return rows[0] || null;
}

// GET one record for the edit form
router.get("/:resource/:id/edit", async (req, res) => {
  const ctx = lookup(req, res);
  if (!ctx) return;
  try {
    const row = await fetchRecord(ctx.cfg, ctx.id);
    if (!row) return res.status(404).json({ error: "Record not found" });
    res.json(row);
  } catch (error) {
    console.error("Fetch record error:", error.code, error.message);
    res.status(500).json({ error: "Could not retrieve record" });
  }
});

// PUT: update any subset of the editable columns
router.put("/:resource/:id", async (req, res) => {
  const ctx = lookup(req, res);
  if (!ctx) return;
  const { cfg, id } = ctx;
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const sets = [], values = [];
  for (const [name, raw] of Object.entries(body)) {
    const def = cfg.columns[name];
    if (!def) return res.status(400).json({ error: `"${name}" cannot be edited` });
    const r = check(name, def, raw);
    if (r.error) return res.status(400).json({ error: r.error });
    sets.push(`\`${name}\` = ?`);
    values.push(r.value);
  }
  if (!sets.length) return res.status(400).json({ error: "No changes were sent" });

  try {
    const existing = await fetchRecord(cfg, id);
    if (!existing) return res.status(404).json({ error: "Record not found" });

    await pool.execute(
      `UPDATE \`${cfg.table}\` SET ${sets.join(", ")} WHERE \`${cfg.pk}\` = ?`,
      [...values, id]
    );
    res.json({ message: "Record updated successfully", record: await fetchRecord(cfg, id) });
  } catch (error) {
    console.error("Update error:", error.code, error.message);
    if (error.sqlState === "45000")
      return res.status(409).json({ error: error.sqlMessage || "Update rejected by the database" });
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Another record already uses that value (it must be unique)" });
    if (error.code === "ER_NO_REFERENCED_ROW_2")
      return res.status(400).json({ error: "The selected patient, doctor or department does not exist" });
    if (error.code === "ER_CHECK_CONSTRAINT_VIOLATED" || error.code === "ER_TRUNCATED_WRONG_VALUE")
      return res.status(400).json({ error: "A value was rejected by a database constraint" });
    res.status(500).json({ error: "Could not update record. Check the server terminal." });
  }
});

module.exports = router;
