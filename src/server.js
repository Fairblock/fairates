const fs      = require("fs");
const path    = require("path");
const https   = require("https");
const express = require("express");
const cors    = require("cors");

const app = express();
app.use(cors());

// Increase the JSON payload limit to 50mb (adjust as needed)
app.use(express.json({ limit: "50mb" }));

const dataFilePath = path.join(__dirname, "contractsData.json");

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
  } catch (err) {
    // Initialize an object with an empty auctions array.
    return {
      auctions: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// GET endpoint returns all auction data.
app.get("/contracts", (_req, res) => res.json(loadData()));

// POST endpoint: expects an object with an "auctions" key or a single auction record.
app.post("/contracts", (req, res) => {
  const data = loadData();
  
  if (req.body.auctions) {
    // Replace the stored auctions array with the new one from the request.
    data.auctions = req.body.auctions;
  } else {
    // Otherwise, assume the request body is a single auction record and add it.
    data.auctions.push(req.body);
  }
  
  saveData(data);
  res.json({ message: "Auction data updated", stored: data.auctions });
});

// ──────────────────────────────────────────
//  HTTPS server on port 9092
// ──────────────────────────────────────────
const CERT_DIR   = path.join(process.env.HOME, "ssl");   // ~/ssl
const httpsOpts  = {
  cert: fs.readFileSync(path.join(CERT_DIR, "server.crt")),
  key:  fs.readFileSync(path.join(CERT_DIR, "server.key"))
};

const PORT = 9092;

https.createServer(httpsOpts, app)
     .listen(PORT, "0.0.0.0", () =>
       console.log(`✅  Self‑signed HTTPS API on https://0.0.0.0:${PORT}`)
     );
