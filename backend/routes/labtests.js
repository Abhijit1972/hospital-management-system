
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all lab tests with patient and doctor names
router.get("/", async (req, res) => {
  try {
    const [tests] = await pool.query(`
      SELECT
        lt.test_id,
        lt.patient_id,
        p.patient_name,
        lt.doctor_id,
        d.doctor_name,
        lt.test_name,
        lt.test_date,
        lt.result,
        lt.cost
      FROM Lab_Tests lt
      JOIN Patients p ON lt.patient_id = p.patient_id
      JOIN Doctors d ON lt.doctor_id = d.doctor_id
      ORDER BY lt.test_date DESC, lt.test_id DESC
    `);
    res.json(tests);
  } catch (error) {
    console.error("Get lab tests error:", error.message);
    res.status(500).json({ error: "Could not retrieve lab tests" });
  }
});

module.exports = router;
