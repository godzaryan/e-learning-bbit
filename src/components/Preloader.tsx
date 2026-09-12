"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import packageJson from "../../package.json";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const version = packageJson.version;

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
          <div className="preloader-logo-inner">
            <Image 
              src="/icon.jpg" 
              alt="BBIT Logo" 
              width={50} 
              height={50}
              className="preloader-img"
              priority
            />
          </div>
        </div>
        <div className="preloader-text-group">
          <span className="preloader-text">BBIT</span>
          <span className="preloader-version">v{version}</span>
        </div>
      </div>
    </div>
  );
}
