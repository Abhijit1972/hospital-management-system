
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET: Retrieve all patients
router.get("/", async (req, res) => {
  try {
    const [patients] = await pool.query(`
      SELECT patient_id, patient_name, gender, dob,
             blood_group, phone, address, registration_date
      FROM Patients
      ORDER BY patient_id DESC
    `);

    res.json(patients);
  } catch (error) {
    console.error("Get patients error:", error.message);
    res.status(500).json({ error: "Could not retrieve patients" });
  }
});

// POST: Register a new patient
router.post("/", async (req, res) => {
  try {
    const {
      patient_name,
      gender,
      dob,
      blood_group,
      phone,
      address
    } = req.body;

    // Validate required fields
    if (!patient_name || !gender || !dob || !phone) {
      return res.status(400).json({
        error: "Patient name, gender, date of birth and phone are required"
      });
    }

    const validGenders = ["Male", "Female", "Other"];

    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        error: "Gender must be Male, Female or Other"
      });
    }

    // Validate date format and ensure it is a real date
    if (
      typeof dob !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob)
    ) {
      return res.status(400).json({
        error: "Date of birth must use YYYY-MM-DD format"
      });
    }

    const parsedDate = new Date(`${dob}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== dob ||
      dob > new Date().toISOString().slice(0, 10)
    ) {
      return res.status(400).json({
        error: "Enter a valid date of birth that is not in the future"
      });
    }

    if (
      typeof patient_name !== "string" ||
      !patient_name.trim() ||
      patient_name.trim().length > 50
    ) {
      return res.status(400).json({
        error: "Patient name must be between 1 and 50 characters"
      });
    }

    if (typeof phone !== "string" || !/^\+?[0-9]{7,15}$/.test(phone)) {
      return res.status(400).json({
        error: "Enter a valid phone number with 7 to 15 digits"
      });
    }

    if (
      blood_group != null &&
      (typeof blood_group !== "string" ||
       !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(blood_group))
    ) {
      return res.status(400).json({
        error: "Enter a valid blood group"
      });
    }

    if (address != null &&
        (typeof address !== "string" || address.length > 150)) {
      return res.status(400).json({
        error: "Address must be at most 150 characters"
      });
    }

    // Parameterized query prevents SQL injection
    const [result] = await pool.execute(
      `INSERT INTO Patients
       (patient_name, gender, dob, blood_group, phone, address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patient_name.trim(),
        gender,
        dob,
        blood_group || null,
        phone,
        address?.trim() || null
      ]
    );

    // Return the newly created record
    const [rows] = await pool.execute(
      `SELECT patient_id, patient_name, gender, dob,
              blood_group, phone, address, registration_date
       FROM Patients
       WHERE patient_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Patient registered successfully",
      patient: rows[0]
    });
  } catch (error) {
    console.error("Register patient error:", error.code, error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "A patient with this phone number already exists"
      });
    }

    res.status(500).json({
      error: "Could not register patient"
    });
  }
});

module.exports = router;
