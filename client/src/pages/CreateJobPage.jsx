import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jobsAPI } from "../services/api";

const HIRING_STAGES = ["pending", "screening", "interview", "offer", "contract_sent", "accepted", "rejected"];
const QUESTION_TYPES = ["text", "multiple_choice", "yes_no"];

const formatLabel = (val) =>
  (val || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);
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

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addRequirement = () => {
    if (!reqInput.trim()) return;
    set("requirements", [...form.requirements, reqInput.trim()]);
    setReqInput("");
  };

  const addPerk = () => {
    if (!perkInput.trim()) return;
    set("perks", [...form.perks, perkInput.trim()]);
    setPerkInput("");
  };

  const toggleStage = (stage) => {
    set("hiringStages", form.hiringStages.includes(stage)
      ? form.hiringStages.filter((s) => s !== stage)
      : [...form.hiringStages, stage]);
  };

  const addScreeningQuestion = () => {
    if (!screeningQuestion.question.trim()) return;
    const q = {
      question: screeningQuestion.question.trim(),
      type: screeningQuestion.type,
      required: screeningQuestion.required,
    };
    if (screeningQuestion.type === "multiple_choice") {
      q.options = screeningQuestion.options.split(",").map((s) => s.trim()).filter(Boolean);
    }
    set("screeningQuestions", [...form.screeningQuestions, q]);
    setScreeningQuestion({ question: "", type: "text", options: "", required: false });
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
          min: form.salary.min === "" ? undefined : Number(form.salary.min),
          max: form.salary.max === "" ? undefined : Number(form.salary.max),
        },
        applicationDeadline: form.applicationDeadline || undefined,
        experience: { minYears: form.experience.minYears === "" ? undefined : Number(form.experience.minYears) },
        requiredEducationField: form.requiredEducationField || undefined,
      };
      const res = await jobsAPI.createJob(payload);
      setCreatedJob(res.data.job);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (createdJob) {
    return (
      <div className="cj-page">
      <div className="cj-bg-grid" aria-hidden="true" />
      <div className="cj-vignette" aria-hidden="true" />
      <div className="cj-grain" aria-hidden="true" />
      <div className="cj-container" style={{ position: "relative", zIndex: 1 }}>
        <div className="cj-success-card">
            <p className="cj-eyebrow">Job Posted</p>
            <h1 className="cj-success-title">Job created successfully</h1>
            <p className="cj-success-sub">Your listing is live and accepting applications.</p>
            <div className="cj-success-details">
              <div className="cj-detail-row"><span className="cj-detail-label">Title</span><span>{createdJob.title}</span></div>
              <div className="cj-detail-row"><span className="cj-detail-label">Company</span><span>{createdJob.company}</span></div>
              <div className="cj-detail-row"><span className="cj-detail-label">Location</span><span>{createdJob.location?.city}, {createdJob.location?.country}</span></div>
              <div className="cj-detail-row"><span className="cj-detail-label">Type</span><span>{formatLabel(createdJob.type)}</span></div>
              {createdJob.category && (
                <div className="cj-detail-row">
                  <span className="cj-detail-label">AI Category</span>
                  <span className="cj-category-pill">{createdJob.category}</span>
                </div>
              )}
            </div>
            <div className="cj-success-actions">
              <button className="cj-btn-primary" onClick={() => navigate("/recruiter/dashboard")}>Go to Dashboard</button>
              <button className="cj-btn-secondary" onClick={() => { setCreatedJob(null); setForm({ title: "", company: "", description: "", requirements: [], location: { city: "", country: "" }, type: "full-time", salary: { min: "", max: "", currency: "USD", period: "monthly" }, totalSlots: 1, applicationDeadline: "", requiresCv: false, requiresCoverLetter: false, experience: { minYears: "" }, requiredEducation: "none", requiredEducationField: "", workplaceType: "on_site", perks: [], hiringStages: ["pending", "screening", "interview", "offer", "contract_sent", "accepted"], screeningQuestions: [] }); }}>Post Another</button>
            </div>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  return (
    <div className="cj-page">
      <div className="cj-bg-grid" aria-hidden="true" />
      <div className="cj-vignette" aria-hidden="true" />
      <div className="cj-grain" aria-hidden="true" />
      <div className="cj-container" style={{ position: "relative", zIndex: 1 }}>

        <div className="cj-page-header">
          <p className="cj-eyebrow">Recruiter</p>
          <h1 className="cj-page-title">Post a new job</h1>
          <p className="cj-page-sub">Fill in the details below to publish your listing.</p>
        </div>

        {error && <div className="cj-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="cj-form">

          {/* Basic Info */}
          <section className="cj-card">
            <h2 className="cj-section-title">Basic Information</h2>
            <div className="cj-grid-2">
              <div className="cj-field">
                <label className="cj-label">Job Title <span className="cj-required">*</span></label>
                <input className="cj-input" name="title" placeholder="e.g. Senior Frontend Developer" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="cj-field">
                <label className="cj-label">Company <span className="cj-required">*</span></label>
                <input className="cj-input" name="company" placeholder="e.g. Acme Corp" value={form.company} onChange={(e) => set("company", e.target.value)} required />
              </div>
            </div>
            <div className="cj-field">
              <label className="cj-label">Description <span className="cj-required">*</span></label>
              <textarea className="cj-input cj-textarea" placeholder="Describe the role, responsibilities, and what you're looking for..." value={form.description} onChange={(e) => set("description", e.target.value)} required rows={5} />
            </div>
          </section>

          {/* Location & Type */}
          <section className="cj-card">
            <h2 className="cj-section-title">Location & Work Type</h2>
            <div className="cj-grid-2">
              <div className="cj-field">
                <label className="cj-label">City <span className="cj-required">*</span></label>
                <input className="cj-input" placeholder="e.g. Cairo" value={form.location.city} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))} required />
              </div>
              <div className="cj-field">
                <label className="cj-label">Country <span className="cj-required">*</span></label>
                <input className="cj-input" placeholder="e.g. Egypt" value={form.location.country} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, country: e.target.value } }))} required />
              </div>
              <div className="cj-field">
                <label className="cj-label">Employment Type</label>
                <select className="cj-input cj-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div className="cj-field">
                <label className="cj-label">Workplace</label>
                <select className="cj-input cj-select" value={form.workplaceType} onChange={(e) => set("workplaceType", e.target.value)}>
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </section>

          {/* Compensation */}
          <section className="cj-card">
            <h2 className="cj-section-title">Compensation</h2>
            <div className="cj-grid-4">
              <div className="cj-field">
                <label className="cj-label">Min Salary</label>
                <input className="cj-input" type="number" placeholder="0" value={form.salary.min} onChange={(e) => setForm((f) => ({ ...f, salary: { ...f.salary, min: e.target.value } }))} />
              </div>
              <div className="cj-field">
                <label className="cj-label">Max Salary</label>
                <input className="cj-input" type="number" placeholder="0" value={form.salary.max} onChange={(e) => setForm((f) => ({ ...f, salary: { ...f.salary, max: e.target.value } }))} />
              </div>
              <div className="cj-field">
                <label className="cj-label">Currency</label>
                <select className="cj-input cj-select" value={form.salary.currency} onChange={(e) => setForm((f) => ({ ...f, salary: { ...f.salary, currency: e.target.value } }))}>
                  <option value="USD">USD</option>
                  <option value="EGP">EGP</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div className="cj-field">
                <label className="cj-label">Period</label>
                <select className="cj-input cj-select" value={form.salary.period} onChange={(e) => setForm((f) => ({ ...f, salary: { ...f.salary, period: e.target.value } }))}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="cj-card">
            <h2 className="cj-section-title">Requirements</h2>
            <div className="cj-field">
              <label className="cj-label">Add Requirement</label>
              <div className="cj-input-row">
                <input className="cj-input" placeholder="e.g. 3+ years React experience" value={reqInput} onChange={(e) => setReqInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())} />
                <button type="button" className="cj-btn-add" onClick={addRequirement}>Add</button>
              </div>
              {form.requirements.length > 0 && (
                <div className="cj-chips">
                  {form.requirements.map((req, i) => (
                    <span key={i} className="cj-chip">
                      {req}
                      <button type="button" className="cj-chip-remove" onClick={() => set("requirements", form.requirements.filter((_, j) => j !== i))}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Qualifications & Details */}
          <section className="cj-card">
            <h2 className="cj-section-title">Qualifications & Details</h2>
            <div className="cj-grid-2">
              <div className="cj-field">
                <label className="cj-label">Min. Experience (years)</label>
                <input className="cj-input" type="number" min={0} placeholder="0" value={form.experience.minYears} onChange={(e) => setForm((f) => ({ ...f, experience: { minYears: e.target.value } }))} />
              </div>
              <div className="cj-field">
                <label className="cj-label">Education Required</label>
                <select className="cj-input cj-select" value={form.requiredEducation} onChange={(e) => set("requiredEducation", e.target.value)}>
                  <option value="none">None</option>
                  <option value="high_school">High School</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div className="cj-field">
                <label className="cj-label">Education Field (optional)</label>
                <input className="cj-input" placeholder="e.g. Computer Science" value={form.requiredEducationField} onChange={(e) => set("requiredEducationField", e.target.value)} />
              </div>
              <div className="cj-field">
                <label className="cj-label">Total Slots <span className="cj-required">*</span></label>
                <input className="cj-input" type="number" min={1} value={form.totalSlots} onChange={(e) => set("totalSlots", e.target.value)} required />
              </div>
              <div className="cj-field">
                <label className="cj-label">Application Deadline</label>
                <input className="cj-input cj-date" type="date" value={form.applicationDeadline} onChange={(e) => set("applicationDeadline", e.target.value)} />
              </div>
            </div>
            <div className="cj-checks">
              <label className="cj-check-label">
                <input type="checkbox" checked={form.requiresCv} onChange={(e) => set("requiresCv", e.target.checked)} />
                <span>Requires CV</span>
              </label>
              <label className="cj-check-label">
                <input type="checkbox" checked={form.requiresCoverLetter} onChange={(e) => set("requiresCoverLetter", e.target.checked)} />
                <span>Requires Cover Letter</span>
              </label>
            </div>
          </section>

          {/* Perks */}
          <section className="cj-card">
            <h2 className="cj-section-title">Perks & Benefits</h2>
            <div className="cj-field">
              <label className="cj-label">Add Perk</label>
              <div className="cj-input-row">
                <input className="cj-input" placeholder="e.g. Health insurance, Remote work" value={perkInput} onChange={(e) => setPerkInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPerk())} />
                <button type="button" className="cj-btn-add" onClick={addPerk}>Add</button>
              </div>
              {form.perks.length > 0 && (
                <div className="cj-chips">
                  {form.perks.map((perk, i) => (
                    <span key={i} className="cj-chip">
                      {perk}
                      <button type="button" className="cj-chip-remove" onClick={() => set("perks", form.perks.filter((_, j) => j !== i))}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Hiring Stages */}
          <section className="cj-card">
            <h2 className="cj-section-title">Hiring Pipeline</h2>
            <p className="cj-section-sub">Select which stages applicants move through.</p>
            <div className="cj-stages">
              {HIRING_STAGES.map((stage) => (
                <label key={stage} className={`cj-stage-pill ${form.hiringStages.includes(stage) ? "active" : ""}`}>
                  <input type="checkbox" checked={form.hiringStages.includes(stage)} onChange={() => toggleStage(stage)} style={{ display: "none" }} />
                  {formatLabel(stage)}
                </label>
              ))}
            </div>
          </section>

          {/* Screening Questions */}
          <section className="cj-card">
            <h2 className="cj-section-title">Screening Questions</h2>
            <div className="cj-grid-2">
              <div className="cj-field" style={{ gridColumn: "1 / -1" }}>
                <label className="cj-label">Question</label>
                <input className="cj-input" placeholder="e.g. Do you have a valid driving license?" value={screeningQuestion.question} onChange={(e) => setScreeningQuestion((q) => ({ ...q, question: e.target.value }))} />
              </div>
              <div className="cj-field">
                <label className="cj-label">Type</label>
                <select className="cj-input cj-select" value={screeningQuestion.type} onChange={(e) => setScreeningQuestion((q) => ({ ...q, type: e.target.value }))}>
                  {QUESTION_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                </select>
              </div>
              {screeningQuestion.type === "multiple_choice" && (
                <div className="cj-field">
                  <label className="cj-label">Options (comma-separated)</label>
                  <input className="cj-input" placeholder="Yes, No, Maybe" value={screeningQuestion.options} onChange={(e) => setScreeningQuestion((q) => ({ ...q, options: e.target.value }))} />
                </div>
              )}
              <div className="cj-field" style={{ alignSelf: "end" }}>
                <label className="cj-check-label">
                  <input type="checkbox" checked={screeningQuestion.required} onChange={(e) => setScreeningQuestion((q) => ({ ...q, required: e.target.checked }))} />
                  <span>Required question</span>
                </label>
              </div>
            </div>
            <button type="button" className="cj-btn-secondary" style={{ marginTop: "0.75rem" }} onClick={addScreeningQuestion}>
              + Add Question
            </button>
            {form.screeningQuestions.length > 0 && (
              <div className="cj-question-list">
                {form.screeningQuestions.map((q, i) => (
                  <div key={i} className="cj-question-row">
                    <div>
                      <span className="cj-question-text">{q.question}</span>
                      <span className="cj-question-meta">{formatLabel(q.type)}{q.required ? " - Required" : ""}</span>
                    </div>
                    <button type="button" className="cj-btn-remove" onClick={() => set("screeningQuestions", form.screeningQuestions.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="cj-submit-row">
            <Link to="/recruiter/dashboard" className="cj-btn-ghost">Cancel</Link>
            <button type="submit" className="cj-btn-primary" disabled={loading}>
              {loading ? "Posting..." : "Post Job"}
            </button>
          </div>

        </form>
      </div>
      <Styles />
    </div>
  );
};

const Styles = () => (
  <style>{`
    .cj-page {
      min-height: 100vh;
      color: #eaf2ff;
      padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
      font-family: 'Inter', system-ui, sans-serif;
      position: relative;
      overflow-x: hidden;
      background:
        linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
        radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
        #030303;
    }
    .cj-bg-grid {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 80%, transparent);
      opacity: 0.4;
      pointer-events: none;
      z-index: 0;
    }
    .cj-grain {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }
    .cj-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%);
      pointer-events: none;
      z-index: 0;
    }
    .cj-container {
      max-width: 860px;
      margin: 0 auto;
    }
    .cj-eyebrow {
      color: #00e5cc;
      font: 600 0.68rem 'JetBrains Mono', monospace;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin: 0 0 0.6rem;
    }
    .cj-page-header {
      margin-bottom: 2rem;
    }
    .cj-page-title {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
      margin: 0 0 0.5rem;
      line-height: 1.1;
    }
    .cj-page-sub {
      color: rgba(234,242,255,0.5);
      font-size: 0.95rem;
      margin: 0;
    }
    .cj-error-banner {
      background: rgba(255, 60, 80, 0.1);
      border: 1px solid rgba(255, 60, 80, 0.3);
      color: #ff9aa5;
      border-radius: 6px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .cj-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .cj-card {
      background: rgba(6, 12, 24, 0.9);
      border: 1px solid rgba(0, 229, 204, 0.12);
      border-radius: 6px;
      padding: 1.5rem;
    }
    .cj-section-title {
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00e5cc;
      margin: 0 0 1.1rem;
    }
    .cj-section-sub {
      color: rgba(234,242,255,0.45);
      font-size: 0.85rem;
      margin: -0.6rem 0 0.9rem;
    }
    .cj-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .cj-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .cj-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .cj-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(234,242,255,0.5);
    }
    .cj-required {
      color: #00e5cc;
      font-weight: 700;
    }
    .cj-input {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #eaf2ff;
      border-radius: 4px;
      padding: 0.65rem 0.75rem;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      width: 100%;
      box-sizing: border-box;
    }
    .cj-input:focus {
      border-color: rgba(0, 229, 204, 0.45);
    }
    .cj-input::placeholder {
      color: rgba(234,242,255,0.25);
    }
    .cj-textarea {
      resize: vertical;
      min-height: 110px;
    }
    .cj-select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300e5cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2rem;
    }
    .cj-select option {
      background: #0a1628;
      color: #eaf2ff;
    }
    .cj-date::-webkit-calendar-picker-indicator {
      filter: invert(0.7) sepia(1) saturate(3) hue-rotate(130deg);
      cursor: pointer;
    }
    .cj-input-row {
      display: flex;
      gap: 0.5rem;
    }
    .cj-input-row .cj-input {
      flex: 1;
    }
    .cj-btn-add {
      background: rgba(0, 229, 204, 0.12);
      border: 1px solid rgba(0, 229, 204, 0.3);
      color: #00e5cc;
      border-radius: 4px;
      padding: 0 1rem;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .cj-btn-add:hover {
      background: rgba(0, 229, 204, 0.2);
    }
    .cj-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.6rem;
    }
    .cj-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(0, 229, 204, 0.08);
      border: 1px solid rgba(0, 229, 204, 0.22);
      color: #00e5cc;
      border-radius: 4px;
      padding: 0.25rem 0.55rem;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .cj-chip-remove {
      background: none;
      border: none;
      color: rgba(0, 229, 204, 0.6);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
    }
    .cj-chip-remove:hover { color: #ff9aa5; }
    .cj-checks {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-top: 1rem;
    }
    .cj-check-label {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      cursor: pointer;
      font-size: 0.88rem;
      color: rgba(234,242,255,0.75);
    }
    .cj-check-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #00e5cc;
      cursor: pointer;
    }
    .cj-stages {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .cj-stage-pill {
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.06em;
      color: rgba(234,242,255,0.45);
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .cj-stage-pill.active {
      background: rgba(0, 229, 204, 0.12);
      border-color: rgba(0, 229, 204, 0.35);
      color: #00e5cc;
    }
    .cj-stage-pill:hover:not(.active) {
      border-color: rgba(255,255,255,0.25);
      color: rgba(234,242,255,0.7);
    }
    .cj-question-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .cj-question-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 4px;
      padding: 0.65rem 0.85rem;
    }
    .cj-question-text {
      display: block;
      font-size: 0.88rem;
      color: #eaf2ff;
      margin-bottom: 0.2rem;
    }
    .cj-question-meta {
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      color: rgba(234,242,255,0.4);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .cj-btn-remove {
      background: none;
      border: 1px solid rgba(255,60,80,0.3);
      color: rgba(255,100,120,0.8);
      border-radius: 4px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
      cursor: pointer;
      white-space: nowrap;
      font-family: 'JetBrains Mono', monospace;
      transition: all 0.15s;
    }
    .cj-btn-remove:hover {
      background: rgba(255,60,80,0.1);
      color: #ff9aa5;
    }
    .cj-submit-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }
    .cj-btn-primary {
      background: #00e5cc;
      color: #030303;
      border: none;
      border-radius: 4px;
      padding: 0.75rem 1.75rem;
      font-weight: 700;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .cj-btn-primary:hover { opacity: 0.88; }
    .cj-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .cj-btn-secondary {
      background: rgba(0,229,204,0.08);
      border: 1px solid rgba(0,229,204,0.3);
      color: #00e5cc;
      border-radius: 4px;
      padding: 0.65rem 1.25rem;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: background 0.15s;
      text-decoration: none;
      display: inline-block;
    }
    .cj-btn-secondary:hover { background: rgba(0,229,204,0.15); }
    .cj-btn-ghost {
      color: rgba(234,242,255,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px;
      padding: 0.75rem 1.25rem;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;
      display: inline-block;
    }
    .cj-btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #eaf2ff; }
    /* Success card */
    .cj-success-card {
      max-width: 580px;
      margin: 0 auto;
      background: rgba(6,12,24,0.9);
      border: 1px solid rgba(0,229,204,0.2);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 0 60px rgba(0,229,204,0.06);
    }
    .cj-success-title {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      text-transform: uppercase;
      margin: 0.4rem 0 0.5rem;
    }
    .cj-success-sub {
      color: rgba(234,242,255,0.5);
      margin: 0 0 1.5rem;
    }
    .cj-success-details {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .cj-detail-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.9rem;
    }
    .cj-detail-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(234,242,255,0.4);
      min-width: 90px;
    }
    .cj-category-pill {
      background: rgba(0,229,204,0.1);
      border: 1px solid rgba(0,229,204,0.25);
      color: #00e5cc;
      border-radius: 20px;
      padding: 0.2rem 0.65rem;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .cj-success-actions {
      display: flex;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .cj-grid-2, .cj-grid-4 { grid-template-columns: 1fr; }
      .cj-page { padding: 5.5rem 1rem 2rem; }
      .cj-card { padding: 1.1rem; }
    }
  `}</style>
);

export default CreateJobPage;
