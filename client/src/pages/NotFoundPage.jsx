import { Link } from "react-router-dom";
import "./NotFoundPage.css";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <div className="not-found__grain" style={{ backgroundImage: GRAIN_SVG }} />
      <div className="not-found__vignette" />

      <div className="nexus-hud top-left">
        <span>SYS.<span style={{ color: "#00e5cc" }}>404</span></span>
      </div>
      <div className="nexus-hud top-right">
        <span>COORD: <span style={{ color: "#00e5cc" }}>LOST</span></span>
      </div>

      <div className="not-found__content">
        <svg
          className="not-found__face"
          viewBox="0 0 320 380"
          width="320"
          height="380"
          aria-label="A 404 becomes a face, looks to the sides, and blinks. The 4s slide up, the 0 slides down, and then a mouth appears."
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="25"
          >
            <g className="face__eyes" transform="translate(0, 112.5)">
              <g transform="translate(15, 0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
              </g>
              <g transform="translate(230, 0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
              </g>
            </g>
            <rect className="face__nose" rx="4" ry="4" x="132.5" y="112.5" width="55" height="155" />
            <g strokeDasharray="102 102" transform="translate(65, 334)">
              <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" strokeDashoffset="-102" />
              <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" strokeDashoffset="102" />
            </g>
          </g>
        </svg>

        <h1 className="nexus-display-lg not-found__title">Page Not Found</h1>
        <p className="nexus-body-lg not-found__subtitle">
          The requested route does not exist.
        </p>

        <Link to="/" className="nexus-btn primary not-found__btn">
          Return Home
        </Link>
      </div>
    </section>
  );
}
