// Public landing page
// Shows trending job listings from GET /api/v1/jobs
// Shows Recommended for You section for authenticated job seekers
// GET /api/v1/jobs/recommended
// Shows empty state with link to extract skills if user has no skills

import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Hero Section */}
      <header style={{ marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Welcome to GIU Nexus
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem", lineHeight: "1.6" }}>
           This homepage is very temporary replace it asap.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link 
            to="/jobs" 
            style={{ padding: "10px 24px", backgroundColor: "#007bff", color: "white", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
            Browse Open Jobs
          </Link>
          <Link 
            to="/register" 
            style={{ padding: "10px 24px", backgroundColor: "#e2e8f0", color: "#333", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
            Create a Profile
          </Link>
        </div>
      </header>

    </div>
  );
};

export default HomePage;