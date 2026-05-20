import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../services/api";

const RecommendedJobsPage = () => {
	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let isMounted = true;

		const loadRecommendedJobs = async () => {
			try {
				setLoading(true);
				setError("");
				const response = await jobsAPI.getRecommendedJobs();
				const recommendedJobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];

				if (isMounted) {
					setJobs(
						[...recommendedJobs].sort((firstJob, secondJob) => (secondJob.score || 0) - (firstJob.score || 0))
					);
				}
			} catch (requestError) {
				if (isMounted) {
					setError(requestError.response?.data?.message || "Failed to load recommended jobs.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadRecommendedJobs();

		return () => {
			isMounted = false;
		};
	}, []);

	const containerStyle = {
		maxWidth: "1180px",
		margin: "0 auto",
		padding: "3rem 1.5rem 4rem",
	};

	const cardStyle = {
		background: "var(--color-surface)",
		border: "1px solid var(--color-border)",
		borderRadius: "18px",
		boxShadow: "0 14px 40px rgba(32, 21, 21, 0.06)",
	};

	const mutedTextStyle = {
		color: "var(--color-text-muted)",
		lineHeight: 1.7,
	};

	const gridStyle = {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
		gap: "1rem",
		marginTop: "1.5rem",
	};

	if (loading) {
		return (
			<div style={containerStyle}>
				<div style={cardStyle} className="card">
					Loading recommended jobs... 🔃💪🏻💪🏿
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={containerStyle}>
				<div style={{ ...cardStyle, padding: "1.5rem" }}>
					<h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Recommended Jobs</h1>
					<p style={mutedTextStyle}>{error}</p>
					<Link to="/jobs" className="btn-primary" style={{ display: "inline-flex", marginTop: "1rem" }}>
						Browse all jobs
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			<div style={{ marginBottom: "1.5rem" }}>
				<div className="eyebrow" style={{ marginBottom: "0.5rem" }}>Job Seeker</div>
				<h1 style={{ fontSize: "2.5rem", lineHeight: 1.05, marginBottom: "0.5rem" }}>
					Recommended jobs for you 🤔💭
				</h1>
				<p style={mutedTextStyle}>
					These jobs are ranked by AI similarity score using your profile skills. 🏆
				</p>
			</div>

			{jobs.length === 0 ? (
				<div style={{ ...cardStyle, padding: "1.5rem" }}>
					<h2 style={{ marginBottom: "0.5rem" }}>No recommendations yet 🤔</h2>
					<p style={mutedTextStyle}>
						We could not rank any jobs for your profile. Try adding skills to your profile and come back again. 😕
					</p>
					<Link to="/profile" className="btn-primary" style={{ display: "inline-flex", marginTop: "1rem" }}>
						View profile
					</Link>
				</div>
			) : (
				<div style={gridStyle}>
					{jobs.map((job) => {
						const score = typeof job.score === "number" ? Math.round(job.score * 100) : null;

						return (
							<article
								key={job._id}
								style={{
									...cardStyle,
									padding: "1.25rem",
									display: "flex",
									flexDirection: "column",
									gap: "0.9rem",
								}}
							>
								<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
									<div>
										<h2 style={{ fontSize: "1.1rem", lineHeight: 1.25, marginBottom: "0.35rem" }}>
											<Link to={`/jobs/${job._id}`} style={{ color: "var(--color-text)", textDecoration: "none" }}>
												{job.title}
											</Link>
										</h2>
										<p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{job.company}</p>
									</div>

									<span
										style={{
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											minWidth: "4.5rem",
											padding: "0.3rem 0.55rem",
											borderRadius: "999px",
											background: "var(--color-accent-subtle)",
											border: "1px solid var(--color-accent-border)",
											color: "var(--color-accent)",
											fontSize: "0.78rem",
											fontWeight: 700,
											whiteSpace: "nowrap",
										}}
									>
										{score !== null ? `${score}% match` : "AI match"}
									</span>
								</div>

								<p style={{ ...mutedTextStyle, fontSize: "0.94rem" }}>
									{job.description || "No description available."}
								</p>

								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
									{job.location ? <span className="badge">{job.location}</span> : null}
									{job.type ? <span className="badge">{job.type}</span> : null}
									{job.category ? <span className="badge">{job.category}</span> : null}
								</div>

								<Link to={`/jobs/${job._id}`} className="btn-tertiary" style={{ alignSelf: "flex-start" }}>
									View job 🔍
								</Link>
							</article>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default RecommendedJobsPage;