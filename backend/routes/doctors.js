
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all doctors
router.get("/", async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT *
      FROM Doctors
      ORDER BY doctor_id DESC
    `);

    res.json(doctors);
  } catch (error) {
    console.error("Get doctors error:", error.message);
    res.status(500).json({
      error: "Could not retrieve doctors"
    });
  }
});

module.exports = router;
