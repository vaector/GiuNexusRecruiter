import { useContext, useEffect, useState } from "react";
import SkillChip from "../components/SkillChip";
import { AuthContext } from "../context/AuthContext";
import { profileAPI } from "../services/api";

const ProfilePage = () => {
	const { setUser } = useContext(AuthContext);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [pageError, setPageError] = useState("");
	const [extractError, setExtractError] = useState("");
	const [statusMessage, setStatusMessage] = useState("");
	const [isExtracting, setIsExtracting] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const loadProfile = async () => {
			try {
				setLoading(true);
				setPageError("");
				const response = await profileAPI.getMyProfile();
				const user = response.data?.user || null;

				if (!isMounted) {
					return;
				}

				setProfile(user);
				if (user) {
					setUser?.(user);
				}
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setPageError(error.response?.data?.message || "Failed to load your profile.");
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadProfile();

		return () => {
			isMounted = false;
		};
	}, [setUser]);

	const handleExtractSkills = async () => {
		setExtractError("");
		setStatusMessage("");

		try {
			setIsExtracting(true);
			const response = await profileAPI.extractSkills();
			const skills = response.data?.skills || response.data?.extracted || [];

			setProfile((currentProfile) =>
				currentProfile ? { ...currentProfile, skills } : currentProfile
			);
			if (profile) {
				setUser?.({ ...profile, skills });
			}

			setStatusMessage("Skills updated from your bio. ✅");
		} catch (error) {
			if (error.response?.status === 400) {
				setExtractError(error.response?.data?.message || "Bio is empty. Add a bio before extracting skills. 😕");
				return;
			}

			setExtractError(error.response?.data?.message || "Unable to extract skills right now. 😕");
		} finally {
			setIsExtracting(false);
		}
	};

	const containerStyle = {
		maxWidth: "1040px",
		margin: "0 auto",
		padding: "3rem 1.5rem 4rem",
	};

	const shellStyle = {
		display: "grid",
		gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr)",
		gap: "1.5rem",
		alignItems: "start",
	};

	const cardStyle = {
		background: "var(--color-surface)",
		border: "1px solid var(--color-border)",
		borderRadius: "18px",
		boxShadow: "0 14px 40px rgba(32, 21, 21, 0.06)",
	};

	const headerCardStyle = {
		...cardStyle,
		padding: "1.5rem",
		position: "sticky",
		top: "88px",
	};

	const contentCardStyle = {
		...cardStyle,
		padding: "1.5rem",
	};

	const sectionTitleStyle = {
		fontSize: "0.8rem",
		fontWeight: 700,
		letterSpacing: "0.14em",
		textTransform: "uppercase",
		color: "var(--color-text-muted)",
		marginBottom: "0.75rem",
	};

	const mutedTextStyle = {
		color: "var(--color-text-muted)",
		lineHeight: 1.7,
	};

	const avatarUrl = profile?.profilePicture;
	const initials = (profile?.name || "User")
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
	const skills = Array.isArray(profile?.skills) ? profile.skills : [];

	if (loading) {
		return (
			<div style={containerStyle}>
				<div style={contentCardStyle}>Loading your profile... 👏🏻</div>
			</div>
		);
	}

	if (pageError) {
		return (
			<div style={containerStyle}>
				<div style={contentCardStyle}>
					<h1 style={{ marginBottom: "0.75rem" }}>Profile</h1>
					<p style={mutedTextStyle}>{pageError}</p>
					<button
						type="button"
						className="btn-primary"
						onClick={() => window.location.reload()}
						style={{ marginTop: "1rem" }}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			<div style={{ marginBottom: "1.5rem" }}>
				<div className="eyebrow" style={{ marginBottom: "0.5rem" }}>Job Seeker Profile</div>
				<h1 style={{ fontSize: "2.25rem", lineHeight: 1.05, marginBottom: "0.5rem" }}>
					Your profile and extracted skills
				</h1>
				<p style={mutedTextStyle}>
					Review the profile details returned by the API and extract skill chips directly from your bio.
				</p>
			</div>

			<div style={shellStyle}>
				<aside style={headerCardStyle}>
					<div
						style={{
							width: "104px",
							height: "104px",
							borderRadius: "50%",
							overflow: "hidden",
							background: "var(--color-surface-alt)",
							border: "1px solid var(--color-border)",
							display: "grid",
							placeItems: "center",
							marginBottom: "1rem",
							fontSize: "1.75rem",
							fontWeight: 700,
							color: "var(--color-text-muted)",
						}}
					>
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={`${profile?.name || "Profile"} profile`}
								style={{ width: "100%", height: "100%", objectFit: "cover" }}
							/>
						) : (
							initials
						)}
					</div>

					<h2 style={{ fontSize: "1.6rem", lineHeight: 1.1, marginBottom: "0.4rem" }}>
						{profile?.name || "Unnamed profile"}
					</h2>
					<p style={mutedTextStyle}>{profile?.bio?.trim() ? profile.bio : "No bio added yet. 😕"}</p>

					<button
						type="button"
						className="btn-primary"
						onClick={handleExtractSkills}
						disabled={isExtracting}
						style={{ width: "100%", marginTop: "1.25rem" }}
					>
						{isExtracting ? "Extracting skills..." : "Extract Skills from Bio"}
					</button>

					{extractError ? (
						<div
							role="alert"
							aria-live="assertive"
							style={{
								marginTop: "0.9rem",
								padding: "0.85rem 0.95rem",
								borderRadius: "12px",
								background: "#fff3f0",
								border: "1px solid #f3b7a4",
								color: "#a43d18",
								lineHeight: 1.5,
							}}
						>
							{extractError}
						</div>
					) : null}

					{statusMessage ? (
						<div
							role="status"
							aria-live="polite"
							style={{
								marginTop: "0.9rem",
								padding: "0.85rem 0.95rem",
								borderRadius: "12px",
								background: "var(--color-accent-subtle)",
								border: "1px solid var(--color-accent-border)",
								color: "var(--color-accent)",
								lineHeight: 1.5,
							}}
						>
							{statusMessage}
						</div>
					) : null}
				</aside>

				<section style={contentCardStyle}>
					<div style={{ marginBottom: "1.75rem" }}>
						<div style={sectionTitleStyle}>Bio</div>
						<p style={{ ...mutedTextStyle, whiteSpace: "pre-wrap" }}>
							{profile?.bio?.trim() ? profile.bio : "No bio available. 😕"}
						</p>
					</div>

					<div>
						<div style={sectionTitleStyle}>Skill Chips 🏆</div>
						{skills.length > 0 ? (
							<div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
								{skills.map((skill) => (
									<SkillChip key={skill} skill={skill} />
								))}
							</div>
						) : (
							<p style={mutedTextStyle}>No skills extracted yet. 😕</p>
						)}
					</div>
				</section>
			</div>
		</div>
	);
};

export default ProfilePage;