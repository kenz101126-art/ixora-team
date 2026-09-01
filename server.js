require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  age: { type: Number, required: true, min: 1, max: 100 },
  status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Rejected"] }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 30 },
  message: { type: String, required: true, trim: true, maxlength: 300 }
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);
const Message = mongoose.model("Message", messageSchema);
const Admin = mongoose.model("Admin", adminSchema);

function createToken(admin) {
  return jwt.sign(
    { id: admin._id.toString(), username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Admin login required." });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

async function ensureFirstAdmin() {
  const username = (process.env.ADMIN_USERNAME || "").trim();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!username || !password) return;

  const exists = await Admin.findOne({ username });
  if (!exists) {
    const passwordHash = await bcrypt.hash(password, 12);
    await Admin.create({ username, passwordHash });
    console.log("Initial IXORA admin account created.");
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    online: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// PUBLIC: Registration
app.post("/api/applications", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const age = Number(req.body.age);

    if (name.length < 2 || name.length > 80 || !Number.isInteger(age) || age < 1 || age > 100) {
      return res.status(400).json({ error: "Please enter a valid name and age." });
    }

    const application = await Application.create({ name, age });
    res.status(201).json({ success: true, application });
  } catch {
    res.status(500).json({ error: "Unable to submit your application." });
  }
});

// PUBLIC: Chat
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(messages.reverse());
  } catch {
    res.status(500).json({ error: "Unable to load messages." });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || name.length > 30 || !message || message.length > 300) {
      return res.status(400).json({ error: "Invalid chat message." });
    }

    const saved = await Message.create({ name, message });
    res.status(201).json({ success: true, message: saved });
  } catch {
    res.status(500).json({ error: "Unable to send message." });
  }
});

// ADMIN LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    res.json({ success: true, token: createToken(admin), username: admin.username });
  } catch {
    res.status(500).json({ error: "Login failed." });
  }
});

// PROTECTED ADMIN ROUTES
app.get("/api/admin/applications", requireAdmin, async (req, res) => {
  const applications = await Application.find().sort({ createdAt: -1 });
  res.json(applications);
});

app.patch("/api/admin/applications/:id", requireAdmin, async (req, res) => {
  const status = String(req.body.status || "");
  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const application = await Application.findByIdAndUpdate(
    req.params.id, { status }, { new: true }
  );

  if (!application) return res.status(404).json({ error: "Application not found." });
  res.json({ success: true, application });
});

app.delete("/api/admin/applications/:id", requireAdmin, async (req, res) => {
  await Application.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/messages", requireAdmin, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(200);
  res.json(messages);
});

app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error("ERROR: Create a .env file using .env.example before starting.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
    await ensureFirstAdmin();

    app.listen(PORT, () => {
      console.log(`IXORA TEAM running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

start();
