const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const DATA_FILE = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/data.json`
  : "./data.json";

async function loadData() {
  try {
    const fileData = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(fileData);
  } catch (err) {
    return { users: [], parts: [] };
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/data", async (req, res) => {
  try {
    const data = await loadData();
    res.json(data);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error reading data: ${err.message}`);
    res.status(500).json({ error: "Error reading data" });
  }
});

app.post("/data", async (req, res) => {
  try {
    const newData = req.body;
    const data = await loadData();

    if (newData.birthdate) {
      const userIndex = data.users.findIndex((u) => u.id === newData.id);
      if (userIndex >= 0) data.users[userIndex] = newData;
      else data.users.push(newData);
    } else if (newData.userId) {
      const partIndex = data.parts.findIndex((p) => p.id === newData.id);
      if (partIndex >= 0) data.parts[partIndex] = newData;
      else data.parts.push(newData);
    } else {
      return res.status(400).json({ error: "Invalid data format" });
    }

    await saveData(data);
    res.json({ message: "Data updated successfully", data });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error updating data: ${err.message}`);
    res.status(500).json({ error: "Error updating data" });
  }
});

app.put("/data", async (req, res) => {
  try {
    const newData = req.body;
    if (!newData.users || !Array.isArray(newData.users) || !newData.parts || !Array.isArray(newData.parts)) {
      return res.status(400).json({ error: "Invalid data format: must include users and parts arrays" });
    }
    await saveData(newData);
    res.json({ message: "Data replaced successfully", data: newData });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error replacing data: ${err.message}`);
    res.status(500).json({ error: "Error replacing data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));