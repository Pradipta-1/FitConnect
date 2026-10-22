import Link from "next/link";
import LiveNeonBackground from "@/components/LiveNeonBackground";

export default function LandingPage() {
  return (
    <main className="landing-hero">
      <LiveNeonBackground />
      <div className="landing-hero-content">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <img
              src="/logo.png"
              alt="FitConnect Logo"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
            />
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

