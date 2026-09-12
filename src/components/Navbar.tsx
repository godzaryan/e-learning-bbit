"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { siteConfig } from "@/config/site";

import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand" id="nav-home">
            <Image
              src="/logo.jpg"
              alt="BBIT Logo"
              width={32}
              height={32}
              className="navbar-brand-logo"
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <span>{siteConfig.name}</span>
          </Link>

          <div className="navbar-actions">
            <Link
              href="/"
              className={`navbar-link ${pathname === "/" ? "active" : ""}`}
              id="nav-link-home"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className={`navbar-link ${pathname.startsWith("/explore") ? "active" : ""}`}
              id="nav-link-explore"
            >
              Explore
            </Link>
            <ThemeToggle />
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              id="nav-mobile-toggle"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <Link
          href="/"
          className="mobile-link"
          onClick={() => setMobileOpen(false)}
          id="nav-mobile-home"
        >
          Home
        </Link>
        <Link
          href="/explore"
          className="mobile-link"
          onClick={() => setMobileOpen(false)}
          id="nav-mobile-explore"
        >
          Explore Content
        </Link>
        <a
          href={siteConfig.lmsUrl}
          className="mobile-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          id="nav-mobile-lms"
        >
          Go to LMS ↗
        </a>
      </div>
    </>
  );
}
