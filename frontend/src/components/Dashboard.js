import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: "Bearer " + token },
      });
      setProjects(response.data.data || []);
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </nav>
      <div className="content">
        <div className="user-info"><p>Welcome, {user?.email || "User"}!</p></div>
        {error && <div className="error-message">{error}</div>}
        <div className="projects-section">
          <h2>Projects</h2>
          {loading ? <p>Loading...</p> : projects.length === 0 ? <p>No projects yet.</p> : <div className="projects-grid">{projects.map((project) => (<div key={project.id} className="project-card"><h3>{project.name}</h3><p>{project.description || "No description"}</p></div>))}</div>}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
