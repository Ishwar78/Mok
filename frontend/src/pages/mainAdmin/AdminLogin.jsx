import React, { useState } from "react";
import axios from "../../utils/axiosConfig";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Correct backend route
    // const LOGIN_URL = "/api/admin/admin-users/login";
    const LOGIN_URL = "/api/admin/login";

    console.log("Attempting admin login with URL:", LOGIN_URL);

    try {
      const res = await axios.post(LOGIN_URL, {
        email,
        password,
      });

    if (res.data?.success && res.data?.token) {
  // ✅ Token save
  localStorage.setItem("adminToken", res.data.token);

  // ✅ Admin object save (backend se aa raha hai)
  localStorage.setItem("adminUser", JSON.stringify(res.data.admin));

  console.log("✅ Admin login successful");
  window.location.href = "/admin/dashboard";
}
 else {
        throw new Error(res.data?.message || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login__container">
      <div className="admin-login__left">
        Welcome to <br /> Admin Panel
      </div>

      <div className="admin-login__right">
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <h2>Admin Login</h2>

          <input
            type="email"
            placeholder="Email"
            required
            className="admin-login__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="admin-login__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="admin-login__button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="admin-login__error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
