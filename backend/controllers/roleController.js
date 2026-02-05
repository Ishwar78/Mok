const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  try {
    const { name, permissions, isSuperAdmin } = req.body;

    const role = await Role.create({
      name,
      permissions,
      isSuperAdmin: isSuperAdmin || false
    });

    res.status(201).json({ success: true, role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRoles = async (req, res) => {
  const roles = await Role.find();
  res.json(roles);
};

exports.deleteRole = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (role.isSuperAdmin) {
    return res.status(403).json({ message: "Super Admin role cannot be deleted" });
  }

  await role.deleteOne();
  res.json({ success: true });
};
