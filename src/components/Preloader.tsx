"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Minimum display time of 1.5s, then hide
    const timer = setTimeout(() => {
      setHidden(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader ${hidden ? "hidden" : ""}`} aria-hidden={hidden}>
      <div className="preloader-content">
        <div className="preloader-logo">
          <div className="preloader-ring" />
          <div className="preloader-ring" />
        </div>
        <span className="preloader-text">BBIT</span>
      </div>
    </div>
  );
}
