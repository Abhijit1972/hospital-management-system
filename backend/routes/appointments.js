
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET: Retrieve all appointments
router.get("/", async (req, res) => {
  try {
    const [appointments] = await pool.query(`
      SELECT
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        status
      FROM Appointments
      ORDER BY appointment_date DESC, appointment_time DESC
    `);

    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error.message);
    res.status(500).json({
      error: "Could not retrieve appointments"
    });
  }
});

// POST: Book an appointment using the stored procedure
router.post("/", async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, reason } =
    req.body;

  if (
    patient_id == null ||
    doctor_id == null ||
    !appointment_date ||
    !appointment_time
  ) {
    return res.status(400).json({
      error: "Patient ID, doctor ID, appointment date and time are required"
    });
  }

  if (
    !Number.isInteger(Number(patient_id)) ||
    Number(patient_id) < 1 ||
    !Number.isInteger(Number(doctor_id)) ||
    Number(doctor_id) < 1
  ) {
    return res.status(400).json({
      error: "Patient ID and doctor ID must be positive integers"
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
    return res.status(400).json({
      error: "Appointment date must use YYYY-MM-DD format"
    });
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(appointment_time)) {
    return res.status(400).json({
      error: "Appointment time must use HH:MM or HH:MM:SS format"
    });
  }

  if (reason != null && (typeof reason !== "string" || reason.length > 150)) {
    return res.status(400).json({
      error: "Reason must be a string of at most 150 characters"
    });
  }

  try {
    // Calls the existing MySQL stored procedure.
    await pool.query(
      "CALL sp_book_appointment(?, ?, ?, ?, ?)",
      [
        Number(patient_id),
        Number(doctor_id),
        appointment_date,
        appointment_time,
        reason || null
      ]
    );

    // Return the matching appointment record.
    const [rows] = await pool.execute(
      `SELECT appointment_id, patient_id, doctor_id,
              appointment_date, appointment_time, reason, status
       FROM Appointments
       WHERE patient_id = ?
         AND doctor_id = ?
         AND appointment_date = ?
         AND appointment_time = ?
       ORDER BY appointment_id DESC
       LIMIT 1`,
      [
        Number(patient_id),
        Number(doctor_id),
        appointment_date,
        appointment_time
      ]
    );

    res.status(201).json({
      message: "Appointment booking request completed",
      appointment: rows[0] || null
    });
  } catch (error) {
    console.error("Book appointment error:", error.code, error.message);

    if (error.sqlState === "45000") {
      return res.status(409).json({
        error: error.sqlMessage || "The appointment could not be booked"
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "The specified patient or doctor does not exist"
      });
    }

    res.status(500).json({
      error: "Could not book appointment. Check the server terminal."
    });
  }
});

module.exports = router;
