const Course = require("../models/course/Course");
const { upsertCourseOverviewToBuilder } = require("../services/builderService");

/* ================= HELPERS ================= */

const toList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const buildOverviewPayload = (payload = {}) => ({
  description: typeof payload.description === "string" ? payload.description : "",
  about: typeof payload.about === "string" ? payload.about : "",
  materialIncludes: toList(payload.materialIncludes),
  requirements: toList(payload.requirements),
  videoUrl: typeof payload.videoUrl === "string" ? payload.videoUrl.trim() : "",
});

/* ================= CREATE COURSE ================= */

const createCourse = async (req, res) => {
  try {
    console.log("📥 Received course creation request");

    const {
      name,
      description,
      price,
      oldPrice,
      courseType,
      startDate,
      endDate,
      keepAccessAfterEnd,
    } = req.body;

    const thumbnail = req.file ? req.file.filename : null;

    console.log("✅ req.body:", req.body);
    console.log("✅ req.file:", req.file);

    // 🔧 FIX: thumbnail OPTIONAL, core fields REQUIRED
    if (!name || !description || !price) {
      console.warn("⚠️ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Name, description and price are required.",
      });
    }

    // Duplicate course check
    const existing = await Course.findOne({ name });
    if (existing) {
      console.warn("⚠️ Course already exists:", name);
      return res.status(400).json({
        success: false,
        message: "Course already exists",
      });
    }

    const course = new Course({
      name,
      description,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      thumbnail, // can be null
      courseType: courseType || "full_course",
      createdBy: req.user?.id || null,
      startDate: startDate || null,
      endDate: endDate || null,
      keepAccessAfterEnd: keepAccessAfterEnd === "false" ? false : true,
    });

    await course.save();
    console.log("✅ Course saved to DB:", course);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    console.error("❌ Error creating course:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Failed to create course.",
      error: err.message,
    });
  }
};

/* ================= GET ALL COURSES ================= */

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= GET COURSE BY ID ================= */

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= UPDATE COURSE ================= */

const updateCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
      overview,
      courseType,
      startDate,
      endDate,
      keepAccessAfterEnd,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (oldPrice !== undefined) updateData.oldPrice = oldPrice ? Number(oldPrice) : null;
    if (courseType !== undefined) updateData.courseType = courseType;
    if (startDate !== undefined) updateData.startDate = startDate || null;
    if (endDate !== undefined) updateData.endDate = endDate || null;
    if (keepAccessAfterEnd !== undefined) {
      updateData.keepAccessAfterEnd = keepAccessAfterEnd === "false" ? false : true;
    }

    if (req.file) {
      updateData.thumbnail = req.file.filename;
    }

    if (overview) {
      updateData.overview = buildOverviewPayload(overview);
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    try {
      if (updateData.overview) {
        await upsertCourseOverviewToBuilder(updated);
      }
    } catch (e) {
      console.warn("Builder sync skipped/failed on updateCourse:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= DELETE COURSE ================= */

const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/* ================= LOCK / UNLOCK ================= */

const toggleLock = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.locked = !course.locked;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.locked ? "locked" : "unlocked"}`,
      course,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Toggle failed" });
  }
};

/* ================= PUBLISH / UNPUBLISH ================= */

const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.published = !course.published;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.published ? "published" : "unpublished"} successfully`,
      course,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Publish toggle failed" });
  }
};

/* ================= STUDENT COURSES ================= */

const getPublishedCourses = async (req, res) => {
  console.log("📚 getPublishedCourses called");

  const mockCourses = [
    {
      _id: "dev_mock_1",
      name: "CAT Complete Course 2024",
      description: "Complete CAT preparation course with all subjects covered",
      price: 15999,
      thumbnail: "cat-course.jpg",
      published: true,
      createdAt: new Date(),
    },
    {
      _id: "dev_mock_2",
      name: "XAT Preparation Course",
      description: "Comprehensive XAT preparation with mock tests and study materials",
      price: 12999,
      thumbnail: "xat-course.jpg",
      published: true,
      createdAt: new Date(),
    },
    {
      _id: "dev_mock_3",
      name: "NMAT Crash Course",
      description: "Intensive NMAT preparation course for quick results",
      price: 8999,
      thumbnail: "nmat-course.jpg",
      published: true,
      createdAt: new Date(),
    },
  ];

  try {
    const mongoose = require("mongoose");

    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ DB not connected, using mock data");
      return res.status(200).json({ success: true, courses: mockCourses });
    }

    const courses = await Course.find({ published: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error("❌ Error in getPublishedCourses:", err);
    res.status(200).json({ success: true, courses: mockCourses });
  }
};

/* ================= STUDENT COURSE BY ID ================= */

const getPublishedCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.published) {
      return res.status(403).json({ message: "Course not published or not found" });
    }
    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= OVERVIEW ================= */

const upsertCourseOverview = async (req, res) => {
  try {
    const overview = buildOverviewPayload(req.body);

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: { overview } },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    try {
      await upsertCourseOverviewToBuilder(updatedCourse);
    } catch (e) {
      console.warn("Builder sync skipped:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Course overview saved successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save course overview",
      error: error.message,
    });
  }
};

/* ================= EXPORTS ================= */

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleLock,
  togglePublish,
  getPublishedCourses,
  getPublishedCourseById,
  upsertCourseOverview,
};
