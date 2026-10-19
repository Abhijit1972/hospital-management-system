/**
 * api.js – Reusable HTTP client for the Hospital Management System
 * Base URL: http://localhost:3000/api
 */

const API_BASE = "http://localhost:3000/api";

/**
 * Core request helper. Returns parsed JSON or throws a structured error.
 */
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, options);
  } catch (networkErr) {
    throw new Error("Network error – the server may be offline. Check that the backend is running on port 3000.");
  }

  let data;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { error: await response.text() };
  }

  if (!response.ok) {
    const message = data?.error || `Server returned ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

const API = {
  get:    (endpoint)       => request("GET",    endpoint),
  post:   (endpoint, body) => request("POST",   endpoint, body),
  put:    (endpoint, body) => request("PUT",    endpoint, body),
  delete: (endpoint)       => request("DELETE", endpoint),

  // ── Dashboard ──────────────────────────────
  getStats:       () => API.get("/stats"),
  getHealth:      () => API.get("/health"),

  // ── Patients ───────────────────────────────
  getPatients:    ()       => API.get("/patients"),
  getPatient:     (id)     => API.get(`/patients/${id}`),
  registerPatient:(data)   => API.post("/patients", data),

  // ── Doctors ────────────────────────────────
  getDoctors:     () => API.get("/doctors"),

  // ── Departments ────────────────────────────
  getDepartments: () => API.get("/departments"),

  // ── Appointments ───────────────────────────
  getAppointments:  ()     => API.get("/appointments"),
  bookAppointment:  (data) => API.post("/appointments", data),

  // ── Rooms ──────────────────────────────────
  getRooms:          () => API.get("/rooms"),
  getAvailableRooms: () => API.get("/rooms/available"),

  // ── Admissions ─────────────────────────────
  getAdmissions:  ()     => API.get("/admissions"),
  admitPatient:   (data) => API.post("/admissions", data),

  // ── Discharges / Billing ───────────────────
  getBillingRecords: ()     => API.get("/discharges"),
  dischargePatient:  (data) => API.post("/discharges", data),

  // ── Medicines ──────────────────────────────
  getMedicines:  () => API.get("/medicines"),

  // ── Lab Tests ──────────────────────────────
  getLabTests:   () => API.get("/lab-tests"),

  // ── Staff ──────────────────────────────────
  getStaff:      () => API.get("/staff"),

  // ── Edit / Update (any table) ──────────────
  // resource: patients | doctors | departments | appointments | admissions |
  //           rooms | billing | medicines | lab-tests | staff
  getRecord:  (resource, id)       => API.get(`/${resource}/${id}/edit`),
  updateRecord: (resource, id, d)  => API.put(`/${resource}/${id}`, d),

  // ── Prescriptions ──────────────────────────
  getPrescriptions:       ()   => API.get("/prescriptions"),
  getPrescriptionDetails: (id) => API.get(`/prescriptions/${id}/details`)
};

window.API = API;
