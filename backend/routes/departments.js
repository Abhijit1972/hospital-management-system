
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all departments
router.get("/", async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT dept_id, dept_name, location, hod_name, contact_no
      FROM Departments
      ORDER BY dept_name
    `);
    res.json(departments);
  } catch (error) {
    console.error("Get departments error:", error.message);
    res.status(500).json({ error: "Could not retrieve departments" });
  }
});

module.exports = router;
