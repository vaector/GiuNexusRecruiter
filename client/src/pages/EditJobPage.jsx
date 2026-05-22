import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Lenis from "lenis";
import { jobsAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";

const formatSalary = (salary) => {
  if (!salary) return "NOT SPECIFIED";
  const parts = [];
  if (salary.min !== "" && salary.min !== undefined && salary.min !== null) parts.push(`${salary.min}`);
  if (salary.max !== "" && salary.max !== undefined && salary.max !== null) parts.push(`${salary.max}`);
  
  const range = parts.length === 2 ? `${parts[0]} - ${parts[1]}` : parts[0] || "NOT SPECIFIED";
  const currency = salary.currency ? ` ${salary.currency}` : "";
  const period = salary.period ? ` / ${salary.period.toUpperCase()}` : "";
  return `${range}${currency}${period}`;
};

const HIRING_STAGES = ["pending", "screening", "interview", "offer", "contract_sent", "accepted", "rejected"];
const QUESTION_TYPES = ["text", "multiple_choice", "yes_no"];

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [success, setSuccess] = useState(false);
  const [updatedJob, setUpdatedJob] = useState(null);
  
  const [reqInput, setReqInput] = useState("");
  const [perkInput, setPerkInput] = useState("");
  const [screeningQuestion, setScreeningQuestion] = useState({ question: "", type: "text", options: "", required: false });
  
  const [form, setForm] = useState({
    title: "", company: "", description: "", requirements: [],
    location: { city: "", country: "" }, type: "full-time",
    salary: { min: "", max: "", currency: "USD", period: "monthly" },
    totalSlots: 1, applicationDeadline: "", requiresCv: false,
    requiresCoverLetter: false, experience: { minYears: "" },
    requiredEducation: "none", requiredEducationField: "",
    workplaceType: "on_site", perks: [],
    hiringStages: ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
    screeningQuestions: [],
  });

  // HUD & Scroll tracking
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await jobsAPI.getJobById(id);
        const job = res.data.job || res.data;
        setForm({
          title: job.title || "", company: job.company || "", description: job.description || "",
          requirements: job.requirements || [], location: job.location || { city: "", country: "" },
          type: job.type || "full-time", salary: job.salary || { min: "", max: "", currency: "USD", period: "monthly" },
          totalSlots: job.totalSlots || 1, applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "",
          requiresCv: Boolean(job.requiresCv), requiresCoverLetter: Boolean(job.requiresCoverLetter),
          experience: { minYears: job.experience?.minYears ?? "" }, requiredEducation: job.requiredEducation || "none",
          requiredEducationField: job.requiredEducationField || "", workplaceType: job.workplaceType || "on_site",
          perks: job.perks || [], hiringStages: job.hiringStages || ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
          screeningQuestions: job.screeningQuestions || [],
        });
      } catch (err) {
        showToast("SYS.ERR: FAILED_TO_LOAD_JOB", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Robust Scroll Engine
  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    
    lenis.on('scroll', (e) => {
      const pct = e.progress;
      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
        scrollbarTrackRef.current.style.opacity = isScrollable ? "1" : "0";
      }
    });

    let raf;
    function tick(time) { lenis.raf(time); raf = requestAnimationFrame(tick); }
    raf = requestAnimationFrame(tick);

    const trackMouse = (e) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", trackMouse);

    return () => { lenis.destroy(); cancelAnimationFrame(raf); window.removeEventListener("mousemove", trackMouse); };
  }, [success]); // Re-init on success screen

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleArrayAdd = (type) => {
    if (type === 'req' && reqInput.trim()) {
      setForm({ ...form, requirements: [...form.requirements, reqInput.trim()] });
      setReqInput("");
    } else if (type === 'perk' && perkInput.trim()) {
      setForm({ ...form, perks: [...form.perks, perkInput.trim()] });
      setPerkInput("");
    }
  };

  const handleArrayRemove = (type, index) => {
    if (type === 'req') setForm({ ...form, requirements: form.requirements.filter((_, i) => i !== index) });
    else if (type === 'perk') setForm({ ...form, perks: form.perks.filter((_, i) => i !== index) });
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
    const question = { question: screeningQuestion.question.trim(), type: screeningQuestion.type, required: screeningQuestion.required };
    if (screeningQuestion.type === "multiple_choice") question.options = screeningQuestion.options.split(",").map(i => i.trim()).filter(Boolean);
    setForm({ ...form, screeningQuestions: [...form.screeningQuestions, question] });
  };

  const removeScreeningQuestion = (index) => {
    setForm({ ...form, screeningQuestions: form.screeningQuestions.filter((_, i) => i !== index) });
    setScreeningQuestion({ question: "", type: "text", options: "", required: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form, totalSlots: Number(form.totalSlots),
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showToast(err.response?.data?.message || "SYS.ERR: UPDATE_FAILED", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* STATIC DARK BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#030303", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 120%)" }}></div>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}></div>
      </div>

      <GooeyCursor />
      <Navbar />

      {/* --- HUD Elements --- */}
      <div className="nexus-hud top-left">SYS.READY // COORD: {coords.x}, {coords.y}</div>
      <div className="nexus-hud top-right">PROGRESS: <strong ref={pctRef} className="text-accent">0.0%</strong></div>

      {/* --- Custom Scrollbar --- */}
      <div ref={scrollbarTrackRef} className="nexus-scrollbar-track">
        <div ref={scrollbarRef} className="nexus-scrollbar-thumb" />
      </div>

      {/* --- Toasts --- */}
      {toast && (
        <div className={`nexus-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.message}
        </div>
      )}

      {/* --- Main View --- */}
      <main className="nexus-page-wrapper">
        <div className="nexus-container" style={{ maxWidth: 800 }}>
          
          {loading ? (
            <div className="state-panel">
              <Spinner />
              <p className="nexus-mono-sm text-tertiary" style={{ marginTop: '1.5rem' }}>FETCHING_RECORD...</p>
            </div>
          ) : success && updatedJob ? (
            /* --- SUCCESS SCREEN --- */
            <div className="nexus-glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", animation: "panelEntry 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div style={{ fontSize: "2rem", color: "#00e5cc", marginBottom: "1rem", fontFamily: "'Syncopate', sans-serif" }}>// SUCCESS</div>
              <h2 className="nexus-display-md text-primary" style={{ marginBottom: "2rem" }}>RECORD_MODIFIED</h2>
              
              <div style={{ textAlign: "left", background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)", display: "inline-block", minWidth: "300px" }}>
                <p className="summary-line"><span className="label">TITLE:</span> <span className="val">{updatedJob.title}</span></p>
                <p className="summary-line"><span className="label">CORP:</span> <span className="val">{updatedJob.company}</span></p>
                <p className="summary-line"><span className="label">LOC:</span> <span className="val">{updatedJob.location?.city}, {updatedJob.location?.country}</span></p>
                <p className="summary-line"><span className="label">TYPE:</span> <span className="val">{updatedJob.type.toUpperCase()}</span></p>
                <p className="summary-line"><span className="label">COMP:</span> <span className="val text-accent">{formatSalary(updatedJob.salary)}</span></p>
                <p className="summary-line"><span className="label">SLOTS:</span> <span className="val">{updatedJob.totalSlots ?? "N/A"}</span></p>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <button onClick={() => navigate("/recruiter/dashboard")} className="nexus-btn primary">
                  RETURN_TO_DASHBOARD
                </button>
              </div>
            </div>
          ) : (
            <>
              <header style={{ marginBottom: "3rem" }}>
                <div className="nexus-eyebrow">Recruiter Subsystem</div>
                <h1 className="nexus-display-lg" style={{ marginBottom: "0.5rem" }}>Edit Job Profile</h1>
              </header>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <section className="nexus-glass-panel form-panel">
                  <h3 className="panel-title">// CORE_IDENTIFIERS</h3>
                  
                  <div className="form-group">
                    <label className="form-label">JOB_TITLE</label>
                    <input className="nexus-input" name="title" value={form.title} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">COMPANY</label>
                    <input className="nexus-input" name="company" value={form.company} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">DESCRIPTION</label>
                    <textarea className="nexus-textarea" name="description" value={form.description} onChange={handleChange} required rows={5} />
                  </div>
                </section>

                <section className="nexus-glass-panel form-panel">
                  <h3 className="panel-title">// LOCATION & PARAMETERS</h3>
                  
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">CITY</label>
                      <input className="nexus-input" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} required />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">COUNTRY</label>
                      <input className="nexus-input" value={form.location.country} onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">JOB_TYPE</label>
                      <select className="nexus-select" name="type" value={form.type} onChange={handleChange}>
                        <option value="full-time">FULL-TIME</option>
                        <option value="part-time">PART-TIME</option>
                        <option value="internship">INTERNSHIP</option>
                        <option value="contract">CONTRACT</option>
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">WORKPLACE</label>
                      <select className="nexus-select" value={form.workplaceType} onChange={(e) => setForm({ ...form, workplaceType: e.target.value })}>
                        <option value="on_site">ON-SITE</option>
                        <option value="remote">REMOTE</option>
                        <option value="hybrid">HYBRID</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="nexus-glass-panel form-panel">
                  <h3 className="panel-title">// COMPENSATION</h3>
                  
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">MIN_SALARY</label>
                      <input className="nexus-input" type="number" value={form.salary.min} onChange={(e) => setForm({ ...form, salary: { ...form.salary, min: e.target.value } })} />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">MAX_SALARY</label>
                      <input className="nexus-input" type="number" value={form.salary.max} onChange={(e) => setForm({ ...form, salary: { ...form.salary, max: e.target.value } })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">CURRENCY</label>
                      <select className="nexus-select" value={form.salary.currency} onChange={(e) => setForm({ ...form, salary: { ...form.salary, currency: e.target.value } })}>
                        {["USD", "EGP", "EUR", "GBP", "AED", "SAR"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">PERIOD</label>
                      <select className="nexus-select" value={form.salary.period} onChange={(e) => setForm({ ...form, salary: { ...form.salary, period: e.target.value } })}>
                        <option value="monthly">MONTHLY</option>
                        <option value="yearly">YEARLY</option>
                        <option value="hourly">HOURLY</option>
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">OPEN_SLOTS</label>
                      <input className="nexus-input" name="totalSlots" type="number" value={form.totalSlots} onChange={handleChange} min={1} required />
                    </div>
                  </div>
                </section>

                <section className="nexus-glass-panel form-panel">
                  <h3 className="panel-title">// QUALIFICATIONS</h3>
                  
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">MIN_EXPERIENCE (YRS)</label>
                      <input className="nexus-input" type="number" min={0} value={form.experience.minYears} onChange={(e) => setForm({ ...form, experience: { minYears: e.target.value } })} />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">EDUCATION_LVL</label>
                      <select className="nexus-select" value={form.requiredEducation} onChange={(e) => setForm({ ...form, requiredEducation: e.target.value })}>
                        <option value="none">NONE REQUIRED</option>
                        <option value="high_school">HIGH SCHOOL</option>
                        <option value="bachelor">BACHELOR'S</option>
                        <option value="master">MASTER'S</option>
                        <option value="phd">PHD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">EDUCATION_FIELD</label>
                    <input className="nexus-input" value={form.requiredEducationField} onChange={(e) => setForm({ ...form, requiredEducationField: e.target.value })} />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">REQUIREMENTS</label>
                    <div className="input-with-btn">
                      <input className="nexus-input" placeholder="Add requirement..." value={reqInput} onChange={(e) => setReqInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('req'))} />
                      <button type="button" className="nexus-btn secondary" onClick={() => handleArrayAdd('req')}>ADD</button>
                    </div>
                    <div className="badge-container">
                      {form.requirements.map((req, i) => (
                        <span key={i} className="tech-badge">
                          {req} <button type="button" className="badge-remove" onClick={() => handleArrayRemove('req', i)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">PERKS</label>
                    <div className="input-with-btn">
                      <input className="nexus-input" placeholder="Add perk..." value={perkInput} onChange={(e) => setPerkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('perk'))} />
                      <button type="button" className="nexus-btn secondary" onClick={() => handleArrayAdd('perk')}>ADD</button>
                    </div>
                    <div className="badge-container">
                      {form.perks.map((perk, i) => (
                        <span key={i} className="tech-badge">
                          {perk} <button type="button" className="badge-remove" onClick={() => handleArrayRemove('perk', i)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="nexus-glass-panel form-panel">
                  <h3 className="panel-title">// PIPELINE_SETTINGS</h3>
                  
                  <div className="form-group">
                    <label className="form-label">DEADLINE</label>
                    <input className="nexus-input" type="date" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} />
                  </div>

                  <div className="checkbox-row">
                    <label className="tech-checkbox">
                      <input type="checkbox" checked={form.requiresCv} onChange={(e) => setForm({ ...form, requiresCv: e.target.checked })} />
                      <span className="chk-box"></span> REQUIRES_CV
                    </label>
                    <label className="tech-checkbox">
                      <input type="checkbox" checked={form.requiresCoverLetter} onChange={(e) => setForm({ ...form, requiresCoverLetter: e.target.checked })} />
                      <span className="chk-box"></span> REQUIRES_COVER_LETTER
                    </label>
                  </div>

                  <div className="form-group" style={{ marginTop: "1.5rem" }}>
                    <label className="form-label">HIRING_STAGES</label>
                    <div className="badge-container">
                      {HIRING_STAGES.map((stage) => (
                        <label key={stage} className={`tech-toggle ${form.hiringStages.includes(stage) ? "active" : ""}`}>
                          <input type="checkbox" style={{ display: "none" }} checked={form.hiringStages.includes(stage)} onChange={() => toggleStage(stage)} />
                          {stage.replace("_", " ").toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1.5rem" }}>
                    <label className="form-label">SCREENING_QUESTIONS</label>
                    <div className="question-builder">
                      <input className="nexus-input" placeholder="Question text..." value={screeningQuestion.question} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, question: e.target.value })} />
                      <div className="form-row" style={{ marginTop: "0.5rem" }}>
                        <select className="nexus-select flex-1" value={screeningQuestion.type} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, type: e.target.value })}>
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>)}
                        </select>
                        <label className="tech-checkbox flex-1">
                          <input type="checkbox" checked={screeningQuestion.required} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, required: e.target.checked })} />
                          <span className="chk-box"></span> REQUIRED
                        </label>
                      </div>
                      {screeningQuestion.type === "multiple_choice" && (
                        <input className="nexus-input" style={{ marginTop: "0.5rem" }} placeholder="Options (comma separated)" value={screeningQuestion.options} onChange={(e) => setScreeningQuestion({ ...screeningQuestion, options: e.target.value })} />
                      )}
                      <button type="button" className="nexus-btn secondary" style={{ marginTop: "0.5rem", width: "100%" }} onClick={addScreeningQuestion}>
                        ADD_QUESTION
                      </button>
                    </div>

                    <div className="question-list">
                      {form.screeningQuestions.map((q, i) => (
                        <div key={i} className="question-card">
                          <div>
                            <span className="q-text">{q.question}</span>
                            <div className="q-meta">
                              <span className="text-accent">{q.type.replace("_", " ").toUpperCase()}</span>
                              {q.required && <span className="text-primary"> // REQUIRED</span>}
                            </div>
                          </div>
                          <button type="button" className="badge-remove" onClick={() => removeScreeningQuestion(i)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="button" onClick={() => navigate("/recruiter/dashboard")} className="nexus-btn secondary">
                    CANCEL
                  </button>
                  <button type="submit" disabled={saving} className="nexus-btn primary">
                    {saving ? "SAVING..." : "Accept Changes"}
                  </button>
                </div>

              </form>
            </>
          )}
        </div>
      </main>

      <style>{`
        /* --- Strict Layout Containment --- */
        .nexus-page-wrapper { position: relative; z-index: 10; padding: 8rem 0; min-height: 100vh; }
        .nexus-container { margin: 0 auto; padding: 0 clamp(1.5rem, 5vw, 3rem); }

        /* --- HUD & Scrollbar --- */
        .nexus-hud { position: fixed; z-index: 60; pointer-events: none; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; color: rgba(140,230,240,0.38); }
        .top-left { top: 1.5rem; left: 1.5rem; }
        .top-right { top: 1.5rem; right: 1.5rem; text-align: right; }
        .nexus-scrollbar-track { position: fixed; right: 6px; top: 12%; bottom: 12%; width: 3px; z-index: 60; pointer-events: none; background: rgba(255,255,255,0.04); borderRadius: 2px; transition: opacity 0.6s ease; opacity: 0; }
        .nexus-scrollbar-thumb { position: absolute; top: 0; left: 0; width: 100%; height: 36px; background: rgba(0,229,204,0.5); border-radius: 2px; box-shadow: 0 0 8px rgba(0,229,204,0.25); will-change: transform; }

        /* --- Forms & Inputs --- */
        .form-panel { padding: 2rem; }
        .panel-title { font-family: 'Syncopate', sans-serif; font-size: 1rem; color: var(--accent); margin-bottom: 1.5rem; letter-spacing: 1px; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .flex-1 { flex: 1; min-width: 200px; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
        
        .form-label {
          font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-tertiary);
          letter-spacing: 0.1em;
        }

        .nexus-input, .nexus-textarea, .nexus-select {
          width: 100%; background: rgba(6, 12, 24, 0.4); border: 1px solid var(--border-glass);
          border-radius: 2px; color: var(--text-primary); font-family: var(--font-sans);
          padding: 0.75rem 1rem; outline: none; transition: all 0.2s; font-size: 0.9rem;
        }
        .nexus-input:focus, .nexus-textarea:focus, .nexus-select:focus {
          border-color: var(--accent); box-shadow: 0 0 12px var(--accent-glow); background: rgba(6, 12, 24, 0.8);
        }
        .nexus-textarea { resize: vertical; min-height: 100px; }
        .nexus-select { appearance: none; cursor: pointer; color: var(--text-secondary); }
        .nexus-select option { background: #060c18; color: var(--text-primary); }

        /* Color Scheme Dark for Date Picker */
        input[type="date"] { color-scheme: dark; }

        /* --- Arrays & Badges --- */
        .input-with-btn { display: flex; gap: 0.5rem; }
        .badge-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        
        .tech-badge {
          display: inline-flex; align-items: center; gap: 0.5rem; height: 26px; padding: 0 0.5rem 0 0.75rem;
          background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass);
          border-radius: 2px; color: var(--text-secondary); font-family: var(--font-mono);
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.05em;
        }
        .badge-remove {
          background: none; border: none; color: var(--text-tertiary); cursor: pointer;
          font-size: 1rem; padding: 0; line-height: 1; transition: color 0.2s;
        }
        .badge-remove:hover { color: #ef4444; }

        /* --- Checkboxes & Toggles --- */
        .checkbox-row { display: flex; gap: 1.5rem; flex-wrap: wrap; margin: 1rem 0; }
        .tech-checkbox {
          display: inline-flex; align-items: center; gap: 0.75rem; cursor: pointer;
          font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-secondary); letter-spacing: 0.05em;
        }
        .tech-checkbox input { display: none; }
        .chk-box {
          width: 16px; height: 16px; border: 1px solid var(--border-glass); border-radius: 2px;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .tech-checkbox input:checked + .chk-box {
          background: rgba(0, 229, 204, 0.15); border-color: var(--accent); box-shadow: 0 0 8px var(--accent-glow);
        }
        .tech-checkbox input:checked + .chk-box::after { content: ""; width: 8px; height: 8px; background: var(--accent); border-radius: 1px; }

        .tech-toggle {
          display: inline-flex; padding: 0.4rem 0.75rem; border: 1px dashed var(--border-glass);
          border-radius: 2px; cursor: pointer; font-family: var(--font-mono); font-size: 0.65rem;
          color: var(--text-tertiary); transition: all 0.2s;
        }
        .tech-toggle.active {
          background: rgba(0, 229, 204, 0.1); border: 1px solid var(--accent); color: var(--accent);
        }

        /* --- Screening Questions --- */
        .question-builder { background: rgba(0,0,0,0.2); padding: 1rem; border: 1px solid var(--border-glass); border-radius: 2px; }
        .question-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
        .question-card {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
          padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border-left: 2px solid var(--accent); border-radius: 2px;
        }
        .q-text { display: block; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.25rem; }
        .q-meta { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-tertiary); }

        /* --- Success Screen --- */
        .summary-line { margin: 0.5rem 0; font-family: var(--font-mono); font-size: 0.75rem; }
        .summary-line .label { color: var(--text-tertiary); display: inline-block; width: 60px; }
        .summary-line .val { color: var(--text-secondary); }

        /* --- Toasts --- */
        .nexus-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 1000;
          background: var(--bg-surface-solid); backdrop-filter: blur(20px); border: 1px solid var(--accent);
          color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; padding: 1rem 1.5rem;
          border-radius: 2px; box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 12px var(--accent-glow);
          animation: toastEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nexus-toast.error { border-color: #ef4444; color: #ef4444; box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(239,68,68,0.25); }

        @keyframes panelEntry { 0% { transform: translateY(16px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes toastEntry { 0% { transform: translate(-50%, 16px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </>
  );
}