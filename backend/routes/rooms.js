
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all rooms with department info
router.get("/", async (req, res) => {
  try {
    const [rooms] = await pool.query(`
      SELECT r.room_id, r.room_no, r.room_type, r.dept_id,
             d.dept_name, r.cost_per_day, r.status
      FROM Rooms r
      JOIN Departments d ON r.dept_id = d.dept_id
      ORDER BY r.room_no
    `);
    res.json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error.message);
    res.status(500).json({ error: "Could not retrieve rooms" });
  }
});

// GET available rooms only
router.get("/available", async (req, res) => {
  try {
    const [rooms] = await pool.query(`
      SELECT r.room_id, r.room_no, r.room_type, r.dept_id,
             d.dept_name, r.cost_per_day, r.status
      FROM Rooms r
      JOIN Departments d ON r.dept_id = d.dept_id
      WHERE r.status = 'Available'
      ORDER BY r.room_no
    `);
    res.json(rooms);
  } catch (error) {
    console.error("Get available rooms error:", error.message);
    res.status(500).json({ error: "Could not retrieve available rooms" });
  }
});

module.exports = router;
