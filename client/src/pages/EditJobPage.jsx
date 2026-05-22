import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jobsAPI } from "../services/api";

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

const HIRING_STAGES = ["pending", "screening", "interview", "offer", "contract_sent", "accepted", "rejected"];
const QUESTION_TYPES = ["text", "multiple_choice", "yes_no"];

const EditJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [updatedJob, setUpdatedJob] = useState(null);
  const [reqInput, setReqInput] = useState("");
  const [perkInput, setPerkInput] = useState("");
  const [screeningQuestion, setScreeningQuestion] = useState({ question: "", type: "text", options: "", required: false });
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    requirements: [],
    location: { city: "", country: "" },
    type: "full-time",
    salary: { min: "", max: "", currency: "USD", period: "monthly" },
    totalSlots: 1,
    applicationDeadline: "",
    requiresCv: false,
    requiresCoverLetter: false,
    experience: { minYears: "" },
    requiredEducation: "none",
    requiredEducationField: "",
    workplaceType: "on_site",
    perks: [],
    hiringStages: ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
    screeningQuestions: [],
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await jobsAPI.getJobById(id);
        const job = res.data.job || res.data;
        setForm({
          title: job.title || "",
          company: job.company || "",
          description: job.description || "",
          requirements: job.requirements || [],
          location: job.location || { city: "", country: "" },
          type: job.type || "full-time",
          salary: job.salary || { min: "", max: "", currency: "USD", period: "monthly" },
          totalSlots: job.totalSlots || 1,
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "",
          requiresCv: Boolean(job.requiresCv),
          requiresCoverLetter: Boolean(job.requiresCoverLetter),
          experience: { minYears: job.experience?.minYears ?? "" },
          requiredEducation: job.requiredEducation || "none",
          requiredEducationField: job.requiredEducationField || "",
          workplaceType: job.workplaceType || "on_site",
          perks: job.perks || [],
          hiringStages: job.hiringStages || ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
          screeningQuestions: job.screeningQuestions || [],
        });
      } catch (err) {
        setError("Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

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

  const addPerk = () => {
    if (!perkInput.trim()) return;
    setForm({ ...form, perks: [...form.perks, perkInput.trim()] });
    setPerkInput("");
  };

  const removePerk = (index) => {
    setForm({ ...form, perks: form.perks.filter((_, i) => i !== index) });
  };

  const toggleStage = (stage) => {
    setForm((current) => ({
      ...current,
      hiringStages: current.hiringStages.includes(stage)
        ? current.hiringStages.filter((item) => item !== stage)
        : [...current.hiringStages, stage],
    }));
  };

  const addScreeningQuestion = () => {
    if (!screeningQuestion.question.trim()) return;
    const question = {
      question: screeningQuestion.question.trim(),
      type: screeningQuestion.type,
      required: screeningQuestion.required,
    };
    if (screeningQuestion.type === "multiple_choice") {
      question.options = screeningQuestion.options.split(",").map((item) => item.trim()).filter(Boolean);
    }
    setForm({ ...form, screeningQuestions: [...form.screeningQuestions, question] });
    setScreeningQuestion({ question: "", type: "text", options: "", required: false });
  };

  const removeScreeningQuestion = (index) => {
    setForm({ ...form, screeningQuestions: form.screeningQuestions.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        totalSlots: Number(form.totalSlots),
        salary: {
          ...form.salary,
          min: form.salary.min === "" ? undefined : Number(form.salary.min),
          max: form.salary.max === "" ? undefined : Number(form.salary.max),
        },
        applicationDeadline: form.applicationDeadline || undefined,
        experience: { minYears: form.experience.minYears === "" ? undefined : Number(form.experience.minYears) },
        requiredEducationField: form.requiredEducationField || undefined,
      };
      const res = await jobsAPI.updateJob(id, payload);
      setUpdatedJob(res.data.job);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "3rem" }}>Loading job...</div>;

  if (success && updatedJob) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <h2>Job Updated Successfully! ✅</h2>
        <p><strong>Title:</strong> {updatedJob.title}</p>
        <p><strong>Company:</strong> {updatedJob.company}</p>
        <p><strong>Location:</strong> {updatedJob.location?.city}, {updatedJob.location?.country}</p>
        <p><strong>Type:</strong> {updatedJob.type}</p>
        <p><strong>Salary:</strong> {formatSalary(updatedJob.salary)}</p>
        <p><strong>Total Slots:</strong> {updatedJob.totalSlots ?? "Not specified"}</p>
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
            {updatedJob.category || "Uncategorized"}
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
      <h2>Edit Job</h2>

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
          <option value="contract">Contract</option>
        </select>

        <select value={form.workplaceType} onChange={(e) => setForm({ ...form, workplaceType: e.target.value })}>
          <option value="on_site">On-site</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <input type="number" placeholder="Salary Min (optional)" value={form.salary.min} onChange={(e) => setForm({ ...form, salary: { ...form.salary, min: e.target.value } })} />
        <input type="number" placeholder="Salary Max (optional)" value={form.salary.max} onChange={(e) => setForm({ ...form, salary: { ...form.salary, max: e.target.value } })} />

        <select value={form.salary.currency} onChange={(e) => setForm({ ...form, salary: { ...form.salary, currency: e.target.value } })}>
          <option value="USD">USD</option>
          <option value="EGP">EGP</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="AED">AED</option>
          <option value="SAR">SAR</option>
        </select>

        <select value={form.salary.period} onChange={(e) => setForm({ ...form, salary: { ...form.salary, period: e.target.value } })}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="hourly">Hourly</option>
        </select>

        <input name="totalSlots" type="number" placeholder="Total Slots" value={form.totalSlots} onChange={handleChange} min={1} required />
        <input type="date" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} />
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={form.requiresCv} onChange={(e) => setForm({ ...form, requiresCv: e.target.checked })} />
          Requires CV
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={form.requiresCoverLetter} onChange={(e) => setForm({ ...form, requiresCoverLetter: e.target.checked })} />
          Requires cover letter
        </label>
        <input type="number" min={0} placeholder="Minimum experience in years" value={form.experience.minYears} onChange={(e) => setForm({ ...form, experience: { minYears: e.target.value } })} />
        <select value={form.requiredEducation} onChange={(e) => setForm({ ...form, requiredEducation: e.target.value })}>
          <option value="none">No education requirement</option>
          <option value="high_school">High school</option>
          <option value="bachelor">Bachelor</option>
          <option value="master">Master</option>
          <option value="phd">PhD</option>
        </select>
        <input placeholder="Required education field (optional)" value={form.requiredEducationField} onChange={(e) => setForm({ ...form, requiredEducationField: e.target.value })} />

        <div>
          <label>Perks</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input placeholder="Add a perk" value={perkInput} onChange={(e) => setPerkInput(e.target.value)} />
            <button type="button" onClick={addPerk}>Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {form.perks.map((perk, i) => (
              <span key={perk} style={{ background: "#0d8bd4", padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>
                {perk} <button type="button" onClick={() => removePerk(i)} style={{ background: "none", border: "none", cursor: "pointer" }}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label>Hiring stages</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {HIRING_STAGES.map((stage) => (
              <label key={stage} style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                <input type="checkbox" checked={form.hiringStages.includes(stage)} onChange={() => toggleStage(stage)} />
                {stage.replace("_", " ")}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Screening questions</label>
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input placeholder="Question" value={screeningQuestion.question} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, question: e.target.value })} />
            <select value={screeningQuestion.type} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, type: e.target.value })}>
              {QUESTION_TYPES.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
            </select>
            {screeningQuestion.type === "multiple_choice" && (
              <input placeholder="Options separated by commas" value={screeningQuestion.options} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, options: e.target.value })} />
            )}
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="checkbox" checked={screeningQuestion.required} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, required: e.target.checked })} />
              Required question
            </label>
            <button type="button" onClick={addScreeningQuestion}>Add Question</button>
          </div>
          <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.5rem" }}>
            {form.screeningQuestions.map((question, i) => (
              <div key={`${question.question}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span>{question.question} ({question.type}{question.required ? ", required" : ""})</span>
                <button type="button" onClick={() => removeScreeningQuestion(i)}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditJobPage;
