const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CustomPermissionSchema = new mongoose.Schema({
  view: Boolean,
  create: Boolean,
  edit: Boolean,
  delete: Boolean,
  export: Boolean,
  approve: Boolean
}, { _id: false });

const AdminUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },

    userType: {
      type: String,
      enum: ["superadmin", "subadmin", "teacher"],
      default: "subadmin"
    },

    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },

    customPermissions: {
      dashboard: CustomPermissionSchema,
      students: CustomPermissionSchema,
      courses: CustomPermissionSchema,
      batches: CustomPermissionSchema,
      liveClasses: CustomPermissionSchema,
      liveBatches: CustomPermissionSchema,
      mockTests: CustomPermissionSchema,
      mockTestFeedback: CustomPermissionSchema,
      practiceTests: CustomPermissionSchema,
      payments: CustomPermissionSchema,
      coupons: CustomPermissionSchema,
      notifications: CustomPermissionSchema,
      announcements: CustomPermissionSchema,
      popupAnnouncements: CustomPermissionSchema,
      leads: CustomPermissionSchema,
      reports: CustomPermissionSchema,
      faculty: CustomPermissionSchema,
      blogs: CustomPermissionSchema,
      demoVideos: CustomPermissionSchema,
      studyMaterials: CustomPermissionSchema,
      pdfManagement: CustomPermissionSchema,
      discussions: CustomPermissionSchema,
      bschools: CustomPermissionSchema,
      iimPredictor: CustomPermissionSchema,
      responseSheets: CustomPermissionSchema,
      downloads: CustomPermissionSchema,
      gallery: CustomPermissionSchema,
      scoreCards: CustomPermissionSchema,
      successStories: CustomPermissionSchema,
      topPerformers: CustomPermissionSchema,
      coursePurchaseContent: CustomPermissionSchema,
      crm: CustomPermissionSchema,
      billing: CustomPermissionSchema,
      roleManagement: CustomPermissionSchema
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },

    lastLogin: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" }
  },
  { timestamps: true }
);

// 🔐 hash password
AdminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

AdminUserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

AdminUserSchema.methods.getEffectivePermissions = async function () {
  if (this.userType === "superadmin") {
    const perms = {};
    Object.keys(this.customPermissions || {}).forEach(k => {
      perms[k] = {
        view: true, create: true, edit: true,
        delete: true, export: true, approve: true
      };
    });
    return perms;
  }
  return this.customPermissions || {};
};

module.exports = mongoose.model("AdminUser", AdminUserSchema);
