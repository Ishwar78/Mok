const jwt = require("jsonwebtoken");

/* ===== Helper ===== */
const verifyToken = (req) => {
  const authHeader = req.headers.authorization || req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token missing");
  }
  const token = authHeader.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

/* ===== OPTIONAL AUTH ===== */
const optionalAuth = (req, res, next) => {
  try {
    req.user = verifyToken(req);
  } catch {
    req.user = null;
  }
  next();
};

/* ===== NORMAL AUTH ===== */
const authMiddleware = (req, res, next) => {
  try {
    req.user = verifyToken(req);
    next();
  } catch {
    req.user = null;
    next();
  }
};

/* ===== ADMIN / SUBADMIN ===== */
const adminAuth = (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    if (!["admin", "subadmin"].includes(decoded.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = {
  authMiddleware,
  adminAuth,
  optionalAuth
};
