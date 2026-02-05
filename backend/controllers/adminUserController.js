const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email }).populate("role");

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.status !== "active") {
      return res
        .status(403)
        .json({ message: "Admin account is suspended" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role?.name || "ADMIN",
        userType: admin.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CREATE ADMIN USER ================= */
exports.createAdminUser = async (req, res) => {
  try {
    const { fullName, email, password, userType, role, status } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      userType: userType || "subadmin",
      role,
      status: status || "active"
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ADMIN USERS ================= */
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await Admin.find()
      .populate("role")
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ADMIN USER ================= */
exports.updateAdminUser = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    } else {
      delete payload.password;
    }

    const user = await Admin.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ADMIN USER ================= */
exports.deleteAdminUser = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ASSIGN ROLE ================= */
exports.assignRole = async (req, res) => {
  try {
    const { roleId } = req.body;

    const user = await Admin.findByIdAndUpdate(
      req.params.id,
      { role: roleId },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= TOGGLE STATUS ================= */
exports.toggleStatus = async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id);
    user.status = user.status === "active" ? "suspended" : "active";
    await user.save();

    res.json({ success: true, status: user.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





