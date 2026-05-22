// Platform statistics from GET /api/v1/admin/stats
// Summary cards: users by role, jobs by status, applications by status
// Top jobs leaderboard
// Time series charts: apps per week, jobs per week, users per week
// Top recruiters by application count
// Average applications per job
// Request log stats from GET /api/v1/admin/request-logs/stats:
//   - slowest routes
//   - error rates
//   - requests by method and status
//   - AI service call count
// Admin only
import { useEffect, useState } from "react";
import { adminAPI } from "../services/api";

const initialStats = {
  usersByRole: {},
  jobsByStatus: {},
  appsByStatus: {},
  topJobs: [],
};

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const cardGroups = [
  {
    title: "Users",
    code: "USR",
    key: "usersByRole",
    items: [
      ["Job seekers", "jobSeeker"],
      ["Recruiters", "recruiter"],
      ["Admins", "admin"],
    ],
  },
  {
    title: "Jobs",
    code: "JOB",
    key: "jobsByStatus",
    items: [
      ["Open", "open"],
      ["Closed", "closed"],
    ],
  },
  {
    title: "Applications",
    code: "APP",
    key: "appsByStatus",
    items: [
      ["Pending", "pending"],
      ["Shortlisted", "shortlisted"],
      ["Rejected", "rejected"],
    ],
  },
];

const shellStyle = {
  minHeight: "100vh",
  background: "#030303",
  color: "#fff",
  padding: "4rem 6% 6rem",
};

const innerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};

const eyebrowStyle = {
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "3px",
  color: "rgba(0,229,204,0.65)",
  textTransform: "uppercase",
};

const titleStyle = {
  fontSize: "clamp(2rem,5vw,3.5rem)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: 1,
  margin: "0.65rem 0 0.5rem",
};

const subtitleStyle = {
  color: "rgba(255,255,255,0.45)",
  maxWidth: "680px",
  fontSize: "1rem",
  lineHeight: 1.6,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1rem",
};

const panelStyle = {
  border: "1px solid rgba(0,229,204,0.12)",
  background: "rgba(0,229,204,0.025)",
  position: "relative",
};

const cardStyle = {
  ...panelStyle,
  padding: "1.35rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.15rem",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "1rem",
};

const labelStyle = {
  fontFamily: MONO,
  color: "rgba(255,255,255,0.42)",
  fontSize: "10px",
  letterSpacing: "1.4px",
  textTransform: "uppercase",
};

const valueStyle = {
  color: "#fff",
  fontSize: "1.65rem",
  fontWeight: 700,
};

const tableCellStyle = {
  padding: "0.95rem 1rem",
  borderTop: "1px solid rgba(0,229,204,0.08)",
};

const formatCount = (value) => Number(value || 0).toLocaleString();

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load admin dashboard stats right now.";

const CornerFrame = () => (
  <>
    <span style={{ position: "absolute", top: -1, left: -1, width: 18, height: 18, borderTop: `1px solid ${TEAL}`, borderLeft: `1px solid ${TEAL}` }} />
    <span style={{ position: "absolute", right: -1, bottom: -1, width: 18, height: 18, borderRight: `1px solid ${TEAL}`, borderBottom: `1px solid ${TEAL}` }} />
  </>
);

const DarkSkeleton = () => (
  <div style={{ ...cardStyle, minHeight: 180, overflow: "hidden" }}>
    <CornerFrame />
    <div style={{ height: 12, width: "45%", background: "rgba(255,255,255,0.06)" }} />
    <div style={{ height: 34, width: "28%", background: "rgba(0,229,204,0.08)" }} />
    <div style={{ height: 10, width: "80%", background: "rgba(255,255,255,0.04)" }} />
    <div style={{ height: 10, width: "62%", background: "rgba(255,255,255,0.04)" }} />
  </div>
);

const EmptyPanel = ({ title, message }) => (
  <section style={{ ...panelStyle, padding: "1.25rem" }}>
    <CornerFrame />
    <p style={eyebrowStyle}>EMPTY STATE</p>
    <h2 style={{ color: "#fff", fontSize: "1.1rem", margin: "0.4rem 0" }}>{title}</h2>
    <p style={{ color: "rgba(255,255,255,0.48)", margin: 0 }}>{message}</p>
  </section>
);

const SummaryCard = ({ title, code, values, items }) => (
  <section style={cardStyle}>
    <CornerFrame />
    <div style={rowStyle}>
      <div>
        <p style={eyebrowStyle}>SYS.{code}</p>
        <h2 style={{ color: "#fff", fontSize: "1.05rem", marginTop: "0.35rem" }}>{title}</h2>
      </div>
      <span style={{ fontFamily: MONO, color: TEAL, fontSize: 10, letterSpacing: 2 }}>LIVE</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {items.map(([label, key]) => (
        <div key={key} style={rowStyle}>
          <span style={labelStyle}>{label}</span>
          <strong style={valueStyle}>{formatCount(values?.[key])}</strong>
        </div>
      ))}
    </div>
  </section>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await adminAPI.getStats();
        const nextStats = response.data?.stats || initialStats;

        if (isMounted) {
          setStats({
            usersByRole: nextStats.usersByRole || {},
            jobsByStatus: nextStats.jobsByStatus || {},
            appsByStatus: nextStats.appsByStatus || {},
            topJobs: Array.isArray(nextStats.topJobs) ? nextStats.topJobs : [],
          });
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAnyCounts = cardGroups.some((group) =>
    group.items.some(([, key]) => Number(stats[group.key]?.[key] || 0) > 0)
  );

  return (
    <div style={shellStyle}>
      <div style={innerStyle}>
        <header>
          <p style={eyebrowStyle}>SYS.ADMIN / OVERVIEW</p>
          <h1 style={titleStyle}>Admin Dashboard</h1>
          <p style={subtitleStyle}>
            Platform totals, listing health, and application demand in one control surface.
          </p>
          <div style={{ height: 1, background: "linear-gradient(to right, rgba(0,229,204,0.45), transparent)", marginTop: "1.5rem" }} />
        </header>

        {loading && (
          <div style={gridStyle}>
            <DarkSkeleton />
            <DarkSkeleton />
            <DarkSkeleton />
          </div>
        )}

        {!loading && error && (
          <section style={{ ...panelStyle, padding: "1.25rem", borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)" }} role="alert">
            <p style={{ ...eyebrowStyle, color: "#ef4444" }}>ERROR</p>
            <h2 style={{ color: "#fff", margin: "0.35rem 0" }}>Could not load dashboard</h2>
            <p style={{ color: "rgba(255,255,255,0.58)" }}>{error}</p>
          </section>
        )}

        {!loading && !error && (
          <>
            <div style={gridStyle}>
              {cardGroups.map((group) => (
                <SummaryCard
                  key={group.key}
                  title={group.title}
                  code={group.code}
                  values={stats[group.key]}
                  items={group.items}
                />
              ))}
            </div>

            {!hasAnyCounts && stats.topJobs.length === 0 && (
              <EmptyPanel
                title="No platform activity yet"
                message="Dashboard data will appear here once users, jobs, or applications are created."
              />
            )}

            <section style={{ ...panelStyle, overflow: "hidden" }}>
              <CornerFrame />
              <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(0,229,204,0.1)" }}>
                <p style={eyebrowStyle}>SYS.LEADERBOARD</p>
                <h2 style={{ color: "#fff", margin: "0.35rem 0 0", fontSize: "1.25rem" }}>Top Jobs</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "0.35rem" }}>Listings ranked by application count.</p>
              </div>

              {stats.topJobs.length === 0 ? (
                <div style={{ padding: "1.25rem" }}>
                  <p style={{ color: "rgba(255,255,255,0.48)" }}>No applications have been submitted yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                    <thead>
                      <tr style={{ background: "rgba(0,229,204,0.04)" }}>
                        {["Rank", "Job", "Company", "Applications"].map((heading, index) => (
                          <th key={heading} style={{ ...tableCellStyle, borderTop: "none", textAlign: index === 3 ? "right" : "left", color: "rgba(255,255,255,0.5)", fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" }}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topJobs.map((job, index) => (
                        <tr key={job._id || `${job.title}-${index}`}>
                          <td style={{ ...tableCellStyle, color: TEAL, fontFamily: MONO, fontSize: 12 }}>#{index + 1}</td>
                          <td style={{ ...tableCellStyle, color: "#fff", fontWeight: 700 }}>{job.title || "Untitled job"}</td>
                          <td style={{ ...tableCellStyle, color: "rgba(255,255,255,0.5)" }}>{job.company || "Unknown company"}</td>
                          <td style={{ ...tableCellStyle, color: "#fff", textAlign: "right", fontWeight: 700 }}>{formatCount(job.applicationCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;