const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Path to your JSON file where we store contract data
const dataFilePath = path.join(__dirname, "contractsData.json");

// Helper function to load data from JSON file
function loadData() {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    // If file doesn't exist or can't parse, return default structure
    return {
      collateralManagerAddress: "",
      auctionEngineAddress: "",
      lendingVaultAddress: "",
      bidManagerAddress: "",
      offerManagerAddress: "",
      deployedAuctions: []
    };
  }
}

// Helper function to save data to JSON file
function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// GET endpoint: returns current stored data
app.get("/contracts", (req, res) => {
  const data = loadData();
  res.json(data);
});

// POST endpoint: updates stored data
app.post("/contracts", (req, res) => {
  const newData = req.body;
  saveData(newData);
  res.json({ message: "Data updated", stored: newData });
});

// Start the server
const port = 3001;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
