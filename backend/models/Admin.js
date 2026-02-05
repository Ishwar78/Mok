const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    userType: {
      type: String,
      enum: ["superadmin", "subadmin", "teacher"],
      default: "subadmin"
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
