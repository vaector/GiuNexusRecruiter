import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const formatSalary = (salary) => {
  if (!salary) return "Not specified";

  const parts = [];

  if (salary.min !== "" && salary.min !== undefined && salary.min !== null) {
    parts.push(`${salary.min}`);
  }

  if (salary.max !== "" && salary.max !== undefined && salary.max !== null) {
    parts.push(`${salary.max}`);
  }

  const range = parts.length === 2 ? `${parts[0]} - ${parts[1]}` : parts[0] || "Not specified";
  const currency = salary.currency ? ` ${salary.currency}` : "";
  const period = salary.period ? ` / ${salary.period}` : "";

  return `${range}${currency}${period}`;
};

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);
  const [reqInput, setReqInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    requirements: [],
    location: { city: "", country: "" },
    type: "full-time",
    salary: { min: "", max: "", currency: "USD", period: "monthly" },
    totalSlots: 1,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addRequirement = () => {
    if (!reqInput.trim()) return;
    setForm({ ...form, requirements: [...form.requirements, reqInput.trim()] });
    setReqInput("");
  };

  const removeRequirement = (index) => {
    setForm({ ...form, requirements: form.requirements.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        totalSlots: Number(form.totalSlots),
        salary: {
          ...form.salary,
          min: form.salary.min === "" ? "" : Number(form.salary.min),
          max: form.salary.max === "" ? "" : Number(form.salary.max),
        },
      };
      const res = await api.post("/jobs", payload);
      setCreatedJob(res.data.job);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (createdJob) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <h2>Job Created Successfully! 🎉</h2>
        <p><strong>Title:</strong> {createdJob.title}</p>
        <p><strong>Company:</strong> {createdJob.company}</p>
        <p><strong>Location:</strong> {createdJob.location?.city}, {createdJob.location?.country}</p>
        <p><strong>Type:</strong> {createdJob.type}</p>
        <p><strong>Salary:</strong> {formatSalary(createdJob.salary)}</p>
        <p><strong>Total Slots:</strong> {createdJob.totalSlots ?? "Not specified"}</p>
        <p>
          <strong>AI Category: </strong>
          <span style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: "#e0f2fe",
            color: "#0369a1",
          }}>
            {createdJob.category || "Uncategorized"}
          </span>
        </p>
        <button onClick={() => navigate("/recruiter/dashboard")}
          style={{ marginTop: "1rem", padding: "0.6rem 1.2rem", cursor: "pointer" }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
      <h2>Post a New Job</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input name="title" placeholder="Job Title" value={form.title} onChange={handleChange} required />
        <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required rows={4} />

        <div>
          <label>Requirements</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input placeholder="Add a requirement" value={reqInput} onChange={(e) => setReqInput(e.target.value)} />
            <button type="button" onClick={addRequirement}>Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {form.requirements.map((req, i) => (
              <span key={i} style={{ background: "#0d8bd4", padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>
                {req} <button type="button" onClick={() => removeRequirement(i)} style={{ background: "none", border: "none", cursor: "pointer" }}>×</button>
              </span>
            ))}
          </div>
        </div>

        <input placeholder="City" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} required />
        <input placeholder="Country" value={form.location.country} onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} required />

        <select name="type" value={form.type} onChange={handleChange}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
        </select>

        <input type="number" placeholder="Salary Min (optional)" value={form.salary.min} onChange={(e) => setForm({ ...form, salary: { ...form.salary, min: e.target.value } })} />
        <input type="number" placeholder="Salary Max (optional)" value={form.salary.max} onChange={(e) => setForm({ ...form, salary: { ...form.salary, max: e.target.value } })} />

        <select value={form.salary.currency} onChange={(e) => setForm({ ...form, salary: { ...form.salary, currency: e.target.value } })}>
          <option value="USD">USD</option>
          <option value="EGP">EGP</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>

        <select value={form.salary.period} onChange={(e) => setForm({ ...form, salary: { ...form.salary, period: e.target.value } })}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="hourly">Hourly</option>
        </select>

        <input name="totalSlots" type="number" placeholder="Total Slots" value={form.totalSlots} onChange={handleChange} min={1} required />

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default CreateJobPage;