
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all prescriptions with patient, doctor info and medicine details
router.get("/", async (req, res) => {
  try {
    const [prescriptions] = await pool.query(`
      SELECT
        pr.prescription_id,
        pr.appointment_id,
        pr.patient_id,
        p.patient_name,
        pr.doctor_id,
        d.doctor_name,
        pr.date_issued
      FROM Prescriptions pr
      JOIN Patients p ON pr.patient_id = p.patient_id
      JOIN Doctors d ON pr.doctor_id = d.doctor_id
      ORDER BY pr.date_issued DESC
    `);
    res.json(prescriptions);
  } catch (error) {
    console.error("Get prescriptions error:", error.message);
    res.status(500).json({ error: "Could not retrieve prescriptions" });
  }
});

// GET prescription details (medicines) for a specific prescription
router.get("/:id/details", async (req, res) => {
  const prescriptionId = Number(req.params.id);
  if (!Number.isSafeInteger(prescriptionId) || prescriptionId < 1) {
    return res.status(400).json({ error: "Invalid prescription ID" });
  }
  try {
    const [details] = await pool.execute(`
      SELECT
        pd.prescription_id,
        pd.medicine_id,
        m.medicine_name,
        pd.dosage,
        pd.duration_days,
        pd.quantity,
        m.unit_price
      FROM Prescription_Details pd
      JOIN Medicines m ON pd.medicine_id = m.medicine_id
      WHERE pd.prescription_id = ?
    `, [prescriptionId]);
    res.json(details);
  } catch (error) {
    console.error("Get prescription details error:", error.message);
    res.status(500).json({ error: "Could not retrieve prescription details" });
  }
});

module.exports = router;
