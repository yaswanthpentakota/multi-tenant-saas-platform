import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register-tenant", { email, password, tenantName, companyName });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Multi-Tenant SaaS</h1>
        <h2>{isRegister ? "Register" : "Login"}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <>
              <input type="text" placeholder="Tenant Name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
              <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? "Processing..." : isRegister ? "Register" : "Login"}</button>
        </form>
        <p className="toggle-text">{isRegister ? "Already have an account?" : "Need an account?"} <button type="button" className="toggle-button" onClick={() => { setIsRegister(!isRegister); setError(""); }}>{isRegister ? "Login" : "Register"}</button></p>
      </div>
    </div>
  );
}

export default Login;
