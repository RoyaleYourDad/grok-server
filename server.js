const express = require("express");
const cors = require("cors");
const fs = require("fs").promises; // Async file operations
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Set DATA_FILE based on environment (Render uses /data, local uses ./)
const DATA_FILE = process.env.RENDER ? "/data/data.json" : "./data.json";

// Load data from file, or return empty structure if file doesn’t exist
async function loadData() {
  try {
    const fileData = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(fileData);
  } catch (err) {
    // If file doesn’t exist or is invalid, start with empty data
    return { users: [], parts: [] };
  }
}

// Save data to file
async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// GET /data: Read the JSON data
app.get("/data", async (req, res) => {
  try {
    const data = await loadData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reading data" });
  }
});

// POST /data: Add or edit data
app.post("/data", async (req, res) => {
  const newData = req.body;

  try {
    const data = await loadData();

    if (newData.birthdate) {
      // Adding/editing a user
      const userIndex = data.users.findIndex((u) => u.id === newData.id);
      if (userIndex >= 0) {
        data.users[userIndex] = newData; // Edit existing user
      } else {
        data.users.push(newData); // Add new user
      }
    } else if (newData.userId) {
      // Adding/editing a part
      const partIndex = data.parts.findIndex((p) => p.id === newData.id);
      if (partIndex >= 0) {
        data.parts[partIndex] = newData; // Edit existing part
      } else {
        data.parts.push(newData); // Add new part
      }
    } else {
      return res.status(400).json({ error: "Invalid data format" });
    }

    await saveData(data);
    res.json({ message: "Data updated successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));