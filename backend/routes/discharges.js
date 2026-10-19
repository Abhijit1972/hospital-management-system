
const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================================
// GET: View billing records
// URL: GET /api/discharges
// =====================================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.bill_id,
        b.admission_id,
        b.patient_id,
        p.patient_name,
        b.room_charges,
        b.medicine_charges,
        b.doctor_fee,
        b.test_charges,
        b.total_amount,
        b.payment_status,
        b.bill_date
      FROM Billing b
      JOIN Patients p
        ON p.patient_id = b.patient_id
      ORDER BY b.bill_id DESC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Get billing error:", error.message);

    return res.status(500).json({
      error: "Could not retrieve billing records"
    });
  }
});

// =====================================================
// POST: Discharge a patient and generate a bill
// URL: POST /api/discharges
// =====================================================
router.post("/", async (req, res) => {
  const { admission_id, discharge_date, doctor_fee } = req.body;

  // Validate required fields
  if (
    admission_id == null ||
    !discharge_date ||
    doctor_fee == null
  ) {
    return res.status(400).json({
      error: "Admission ID, discharge date and doctor fee are required"
    });
  }

  const admissionId = Number(admission_id);
  const doctorFee = Number(doctor_fee);

  if (
    !Number.isSafeInteger(admissionId) ||
    admissionId < 1
  ) {
    return res.status(400).json({
      error: "Admission ID must be a positive integer"
    });
  }

  if (
    !Number.isFinite(doctorFee) ||
    doctorFee < 0
  ) {
    return res.status(400).json({
      error: "Doctor fee must be a non-negative number"
    });
  }

  // Validate YYYY-MM-DD
  if (
    typeof discharge_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(discharge_date)
  ) {
    return res.status(400).json({
      error: "Discharge date must use YYYY-MM-DD format"
    });
  }

  const parsedDate = new Date(`${discharge_date}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== discharge_date
  ) {
    return res.status(400).json({
      error: "Please enter a valid discharge date"
    });
  }

  try {
    // Confirm admission exists and is still active
    const [admissions] = await pool.execute(
      `SELECT admission_id, admission_date, status
       FROM Admissions
       WHERE admission_id = ?`,
      [admissionId]
    );

    if (admissions.length === 0) {
      return res.status(404).json({
        error: "Admission record not found"
      });
    }

    const admission = admissions[0];

    if (admission.status !== "Admitted") {
      return res.status(409).json({
        error: "This patient has already been discharged"
      });
    }

    const admissionDate = new Date(admission.admission_date)
      .toISOString()
      .slice(0, 10);

    if (discharge_date < admissionDate) {
      return res.status(400).json({
        error: "Discharge date cannot be before admission date"
      });
    }

    // Run the existing MySQL stored procedures
    await pool.query(
      "CALL sp_discharge_patient(?, ?)",
      [admissionId, discharge_date]
    );

    await pool.query(
      "CALL sp_generate_bill(?, ?, ?)",
      [admissionId, discharge_date, doctorFee]
    );

    // Fetch the generated bill
    const [bills] = await pool.execute(
      `SELECT
         bill_id,
         admission_id,
         patient_id,
         room_charges,
         medicine_charges,
         doctor_fee,
         test_charges,
         total_amount,
         payment_status,
         bill_date
       FROM Billing
       WHERE admission_id = ?
       ORDER BY bill_id DESC
       LIMIT 1`,
      [admissionId]
    );

    // Fetch updated admission and room status
    const [updated] = await pool.execute(
      `SELECT
         a.admission_id,
         a.patient_id,
         p.patient_name,
         a.room_id,
         r.room_no,
         r.status AS room_status,
         a.admission_date,
         a.discharge_date,
         a.status AS admission_status
       FROM Admissions a
       JOIN Patients p ON p.patient_id = a.patient_id
       JOIN Rooms r ON r.room_id = a.room_id
       WHERE a.admission_id = ?`,
      [admissionId]
    );

    return res.status(200).json({
      message: "Patient discharged successfully",
      admission: updated[0],
      bill: bills[0] || null
    });
  } catch (error) {
    console.error(
      "Discharge error:",
      error.code,
      error.message
    );

    if (error.sqlState === "45000") {
      return res.status(409).json({
        error: error.sqlMessage || "Discharge could not be completed"
      });
    }

    return res.status(500).json({
      error: "Discharge failed. Check the backend terminal."
    });
  }
});

module.exports = router;
