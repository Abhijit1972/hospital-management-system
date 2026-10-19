
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all staff with department info
router.get("/", async (req, res) => {
  try {
    const [staff] = await pool.query(`
      SELECT s.staff_id, s.staff_name, s.role, s.dept_id,
             d.dept_name, s.phone, s.shift
      FROM Staff s
      JOIN Departments d ON s.dept_id = d.dept_id
      ORDER BY s.staff_name
    `);
    res.json(staff);
  } catch (error) {
    console.error("Get staff error:", error.message);
    res.status(500).json({ error: "Could not retrieve staff" });
  }
});

module.exports = router;
