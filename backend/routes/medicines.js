
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all medicines
router.get("/", async (req, res) => {
  try {
    const [medicines] = await pool.query(`
      SELECT medicine_id, medicine_name, manufacturer, unit_price, stock_qty
      FROM Medicines
      ORDER BY medicine_name
    `);
    res.json(medicines);
  } catch (error) {
    console.error("Get medicines error:", error.message);
    res.status(500).json({ error: "Could not retrieve medicines" });
  }
});

module.exports = router;
