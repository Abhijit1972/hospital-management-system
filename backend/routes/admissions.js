
const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================================
// GET: Retrieve all admissions
// URL: GET /api/admissions
// =====================================================
router.get("/", async (req, res) => {
  try {
    const [admissions] = await pool.query(`
      SELECT
        a.admission_id,
        a.patient_id,
        p.patient_name,
        a.room_id,
        r.room_no,
        r.room_type,
        a.doctor_id,
        d.doctor_name,
        a.admission_date,
        a.discharge_date,
        a.status,
        a.discharge_timestamp
      FROM Admissions a
      JOIN Patients p
        ON a.patient_id = p.patient_id
      JOIN Rooms r
        ON a.room_id = r.room_id
      JOIN Doctors d
        ON a.doctor_id = d.doctor_id
      ORDER BY a.admission_id DESC
    `);

    res.status(200).json(admissions);
  } catch (error) {
    console.error("Get admissions error:", error.message);

    res.status(500).json({
      error: "Could not retrieve admissions"
    });
  }
});

// =====================================================
// POST: Admit a patient
// URL: POST /api/admissions
// Uses the existing MySQL stored procedure
// =====================================================
router.post("/", async (req, res) => {
  const {
    patient_id,
    room_id,
    doctor_id,
    admission_date
  } = req.body;

  // Validate required fields
  if (
    patient_id == null ||
    room_id == null ||
    doctor_id == null ||
    !admission_date
  ) {
    return res.status(400).json({
      error:
        "Patient ID, room ID, doctor ID and admission date are required"
    });
  }

  // Validate positive integer IDs
  const ids = [patient_id, room_id, doctor_id];

  if (
    ids.some(
      id =>
        !Number.isSafeInteger(Number(id)) ||
        Number(id) < 1
    )
  ) {
    return res.status(400).json({
      error: "Patient, room and doctor IDs must be positive integers"
    });
  }

  // Validate date format
  if (
    typeof admission_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(admission_date)
  ) {
    return res.status(400).json({
      error: "Admission date must use YYYY-MM-DD format"
    });
  }

  // Validate that the date actually exists
  const parsedDate = new Date(`${admission_date}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== admission_date
  ) {
    return res.status(400).json({
      error: "Please enter a valid admission date"
    });
  }

  try {
    const patientId = Number(patient_id);
    const roomId = Number(room_id);
    const doctorId = Number(doctor_id);

    // Call the existing stored procedure.
    // Parameter order:
    // patient ID, room ID, doctor ID, admission date
    await pool.query(
      "CALL sp_admit_patient(?, ?, ?, ?)",
      [
        patientId,
        roomId,
        doctorId,
        admission_date
      ]
    );

    // Retrieve the newly admitted record
    const [rows] = await pool.execute(
      `SELECT
         admission_id,
         patient_id,
         room_id,
         doctor_id,
         admission_date,
         discharge_date,
         status,
         discharge_timestamp
       FROM Admissions
       WHERE patient_id = ?
         AND room_id = ?
         AND doctor_id = ?
         AND admission_date = ?
         AND status = 'Admitted'
       ORDER BY admission_id DESC
       LIMIT 1`,
      [
        patientId,
        roomId,
        doctorId,
        admission_date
      ]
    );

    return res.status(201).json({
      message: "Patient admission processed successfully",
      admission: rows[0] || null
    });
  } catch (error) {
    console.error(
      "Patient admission error:",
      error.code,
      error.message
    );

    // Stored procedure signals an application-level error
    if (error.sqlState === "45000") {
      return res.status(409).json({
        error:
          error.sqlMessage ||
          "The selected room is not available"
      });
    }

    // Invalid patient, room or doctor foreign key
    if (
      error.code === "ER_NO_REFERENCED_ROW_2" ||
      error.code === "ER_NO_REFERENCED_ROW"
    ) {
      return res.status(400).json({
        error: "Patient, room or doctor ID does not exist"
      });
    }

    return res.status(500).json({
      error: "Could not admit patient. Check the server terminal."
    });
  }
});

module.exports = router;
