require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const patientsRouter = require("./routes/patients");
const doctorsRouter = require("./routes/doctors");
const appointmentsRouter = require("./routes/appointments");
const admissionsRouter = require("./routes/admissions");
const dischargesRouter = require("./routes/discharges");
const roomsRouter = require("./routes/rooms");
const departmentsRouter = require("./routes/departments");
const medicinesRouter = require("./routes/medicines");
const labTestsRouter = require("./routes/labtests");
const staffRouter = require("./routes/staff");
const prescriptionsRouter = require("./routes/prescriptions");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// API routes
app.use("/api/discharges", dischargesRouter);
app.use("/api/admissions", admissionsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/doctors", doctorsRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/medicines", medicinesRouter);
app.use("/api/lab-tests", labTestsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/prescriptions", prescriptionsRouter);

// Dashboard stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[{ total_patients }]] = await pool.query(
      "SELECT COUNT(*) AS total_patients FROM Patients"
    );
    const [[{ total_doctors }]] = await pool.query(
      "SELECT COUNT(*) AS total_doctors FROM Doctors"
    );
    const [[{ today_appointments }]] = await pool.query(
      "SELECT COUNT(*) AS today_appointments FROM Appointments WHERE appointment_date = ?",
      [today]
    );
    const [[{ admitted_patients }]] = await pool.query(
      "SELECT COUNT(*) AS admitted_patients FROM Admissions WHERE status = 'Admitted'"
    );
    const [[{ available_rooms }]] = await pool.query(
      "SELECT COUNT(*) AS available_rooms FROM Rooms WHERE status = 'Available'"
    );
    const [[{ total_rooms }]] = await pool.query(
      "SELECT COUNT(*) AS total_rooms FROM Rooms"
    );

    // Recent appointments (last 5)
    const [recent_appointments] = await pool.query(`
      SELECT a.appointment_id, p.patient_name, d.doctor_name,
             a.appointment_date, a.appointment_time, a.reason, a.status
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Doctors d ON a.doctor_id = d.doctor_id
      ORDER BY a.appointment_id DESC
      LIMIT 5
    `);

    // Recent admissions (last 5)
    const [recent_admissions] = await pool.query(`
      SELECT a.admission_id, p.patient_name, d.doctor_name,
             r.room_no, r.room_type, a.admission_date, a.status
      FROM Admissions a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Doctors d ON a.doctor_id = d.doctor_id
      JOIN Rooms r ON a.room_id = r.room_id
      ORDER BY a.admission_id DESC
      LIMIT 5
    `);

    res.json({
      total_patients,
      total_doctors,
      today_appointments,
      admitted_patients,
      available_rooms,
      total_rooms,
      recent_appointments,
      recent_admissions
    });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ error: "Could not retrieve statistics" });
  }
});

// Patient detail endpoint
app.get("/api/patients/:id", async (req, res) => {
  const patientId = Number(req.params.id);
  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT patient_id, patient_name, gender, dob,
              blood_group, phone, address, registration_date
       FROM Patients WHERE patient_id = ?`,
      [patientId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Get patient error:", error.message);
    res.status(500).json({ error: "Could not retrieve patient" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");
    res.json({
      status: "OK",
      database: rows[0].connected === 1 ? "Connected" : "Not connected"
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Error", database: "Connection failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});