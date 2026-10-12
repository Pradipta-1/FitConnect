import Link from "next/link";
import LiveNeonBackground from "@/components/LiveNeonBackground";

export default function LandingPage() {
  return (
    <main className="landing-hero">
      <LiveNeonBackground />
      <div className="landing-hero-content">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg width="56" height="56" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" fill="url(#gradient)" stroke="#00f5a0" strokeWidth="2.5"/>
              <text x="30" y="38" textAnchor="middle" fill="#060907" fontSize="19" fontWeight="900" fontFamily="Arial Black, system-ui, sans-serif">FC</text>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#00f5a0'}}/>
                  <stop offset="100%" style={{stopColor:'#00d2ff'}}/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="landing-logo-text">FitConnect</span>
        </div>
        <h1 className="landing-hero-title">
          Connect. Train. Achieve.
        </h1>
        <p className="landing-hero-text">
          Join a powerful community of fitness enthusiasts. Find workout partners, connect with
          trainers, and discover local sports events near you.
        </p>
        <div className="landing-buttons">
          <Link href="/auth/register" className="landing-signup">
            Sign Up
          </Link>
          <Link href="/auth/login" className="landing-login">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}

