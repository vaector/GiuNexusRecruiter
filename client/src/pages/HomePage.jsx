// Public landing page
// Shows trending job listings from GET /api/v1/jobs
// Shows Recommended for You section for authenticated job seekers
// GET /api/v1/jobs/recommended
// Shows empty state with link to extract skills if user has no skills


// THIS HOMEPAGE IS TEMPORARY 
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="container section">
      
      <header style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto", marginBottom: "var(--space-4xl)" }}>
        <h1 className="display-xl" style={{ marginBottom: "var(--space-md)" }}>
          Welcome to GIU Nexus
        </h1>
        <p className="body-lg" style={{ marginBottom: "var(--space-2xl)" }}>
          This homepage is temporary replace it.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)" }}>
          <Link to="/jobs" className="btn-primary">
            Browse Open Jobs
          </Link>
          <Link to="/register" className="btn-tertiary">
            Create a Profile
          </Link>
        </div>
      </header>

    </div>
  );
};

export default HomePage;