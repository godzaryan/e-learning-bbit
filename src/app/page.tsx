import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <section className="hero" id="hero-section">
      {/* Animated Background Orbs */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-gradient-orb" />
        <div className="hero-gradient-orb" />
        <div className="hero-gradient-orb" />
      </div>

      <div className="hero-content page-enter">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Pedagogical Initiative
        </div>

        <h1 className="hero-title">
          Learn Without
          <br />
          <span className="hero-title-accent">Boundaries</span>
        </h1>

        <p className="hero-subtitle">
          Access curated study materials from {siteConfig.fullName}. 
          Browse, preview, and download resources organized for your academic journey.
        </p>

        <div className="hero-actions">
          <Link href="/explore" className="btn btn-primary" id="cta-explore">
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Explore Content
          </Link>

          <a
            href={siteConfig.lmsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            id="cta-lms"
          >
            Go to LMS
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
