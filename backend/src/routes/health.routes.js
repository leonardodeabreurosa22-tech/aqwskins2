import express from "express";
import pool from "../config/database.js";

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query("SELECT NOW()");

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Check lootboxes count
    const lootboxCount = await pool.query("SELECT COUNT(*) FROM lootboxes");
    const itemCount = await pool.query("SELECT COUNT(*) FROM items");
    const userCount = await pool.query("SELECT COUNT(*) FROM users");

    res.json({
      status: "healthy",
      timestamp: dbResult.rows[0].now,
      database: {
        connected: true,
        tables: tablesResult.rows.map((r) => r.table_name),
        counts: {
          lootboxes: parseInt(lootboxCount.rows[0].count),
          items: parseInt(itemCount.rows[0].count),
          users: parseInt(userCount.rows[0].count),
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 5000,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

export default router;
