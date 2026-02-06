import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./AdminProfile.css";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaCamera,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaShieldAlt,
  FaSignOutAlt,
} from "react-icons/fa";

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", email: "" });
  const [changeMode, setChangeMode] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  /* ================= FETCH ADMIN ================= */
  const fetchAdmin = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.get("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin(res.data.admin);
      setEditData({
        name: res.data.admin?.name || "",
        phone: res.data.admin?.phone || "",
        email: res.data.admin?.email || "",
      });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  /* ================= HANDLERS ================= */
  const handleEditToggle = () => {
    if (editMode && admin) {
      setEditData({
        name: admin.name || "",
        phone: admin.phone || "",
        email: admin.email || "",
      });
    }
    setEditMode(!editMode);
    setMessage(null);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.put("/api/admin/profile", editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin(res.data.admin);
      setEditMode(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    setUploading(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.post("/api/admin/upload-profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin((prev) => ({ ...prev, profilePic: res.data.profilePic }));
      setMessage({ type: "success", text: "Profile picture updated" });
    } catch {
      setMessage({ type: "error", text: "Failed to upload picture" });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await axios.put("/api/admin/change-password", passwords, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: res.data.message });
      setChangeMode(false);
    } catch {
      setMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ padding: 20 }}>Loading profile...</p>
      </AdminLayout>
    );
  }

  /* ================= UI ================= */
  return (
    <AdminLayout>
      <div className="admin-profile-container">
        <h1><FaShieldAlt /> Admin Profile</h1>

        {message && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-avatar">
            {admin?.profilePic ? (
              <img src={admin.profilePic} alt="Admin" />
            ) : (
              <div className="avatar-placeholder">AD</div>
            )}
            <button onClick={() => fileInputRef.current.click()}>
              <FaCamera />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleProfilePicUpload}
            />
          </div>

          <div className="profile-fields">
            <label><FaUser /> Name</label>
            {editMode ? (
              <input name="name" value={editData.name} onChange={handleEditChange} />
            ) : (
              <p>{admin?.name || "N/A"}</p>
            )}

            <label><FaEnvelope /> Email</label>
            <p>{admin?.email}</p>

            <label><FaPhone /> Phone</label>
            {editMode ? (
              <input name="phone" value={editData.phone} onChange={handleEditChange} />
            ) : (
              <p>{admin?.phone || "N/A"}</p>
            )}

            {editMode ? (
              <button onClick={handleProfileUpdate}><FaSave /> Save</button>
            ) : (
              <button onClick={handleEditToggle}><FaEdit /> Edit</button>
            )}
          </div>
        </div>

        <div className="profile-card">
          <h3><FaLock /> Change Password</h3>
          <input type="password" placeholder="Current password"
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          <input type="password" placeholder="New password"
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          <input type="password" placeholder="Confirm password"
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
          <button onClick={handlePasswordChange}>Update Password</button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
