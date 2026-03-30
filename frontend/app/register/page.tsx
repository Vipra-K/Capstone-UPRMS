"use client";

import Link from "next/link";
import { 
    LuLock, 
    LuBot, 
    LuFileText, 
    LuHospital, 
    LuUser, 
    LuHand, 
    LuArrowRight, 
    LuShieldCheck,
    LuFingerprint,
    LuZap
} from "react-icons/lu";

const FEATURES = [
    {
        icon: <LuShieldCheck />,
        title: "Secure & Compliant",
        desc: "End-to-end encrypted records with role-based access control",
    },
    {
        icon: <LuBot />,
        title: "AI-Powered Insights",
        desc: "AI clinical summaries, risk scores & predictive analytics",
    },
    {
        icon: <LuFileText />,
        title: "Unified Patient Records",
        desc: "Complete medical history across hospitals in one place",
    },
];

export default function RegisterPage() {
    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
            display: "flex",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Background orbs */}
            <div className="orb orb-violet" style={{ width: 500, height: 500, top: -120, right: -80, opacity: 0.25 }} />
            <div className="orb orb-cyan" style={{ width: 350, height: 350, bottom: -80, left: 300, animationDelay: "3s", opacity: 0.2 }} />
            <div className="orb orb-blue" style={{ width: 280, height: 280, top: "40%", left: -80, animationDelay: "1.5s", opacity: 0.18 }} />

            {/* ── LEFT PANEL ── */}
            <div style={{
                flex: "0 0 45%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 56px",
                position: "relative",
                zIndex: 1,
            }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 64 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", fontWeight: 900, color: "#fff",
                        boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                    }}>U</div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>UPRMS</span>
                </Link>

                {/* Headline */}
                <div style={{ marginBottom: 48 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "5px 14px",
                        background: "rgba(26,188,156,0.12)",
                        border: "1px solid rgba(26,188,156,0.25)",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--accent-teal)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 20,
                    }}>
                        <LuHospital size={16} /> UPRMS Portal
                    </div>
                    <h1 style={{
                        fontSize: "2.6rem",
                        fontWeight: 900,
                        lineHeight: 1.15,
                        margin: "0 0 16px",
                        color: "#f1f5f9",
                        letterSpacing: "-0.03em",
                    }}>
                        Unified Patient<br />
                        <span style={{
                            background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Record Management
                        </span>
                    </h1>
                    <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
                        A single unified platform giving patients full control, and empowering hospitals and doctors with secure clinical data.
                    </p>
                </div>

                {/* Feature list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.1rem", flexShrink: 0,
                            }}>{f.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.92rem", marginBottom: 2 }}>{f.title}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 48px",
                position: "relative",
                zIndex: 1,
            }}>
                {/* Vertical divider */}
                <div style={{
                    position: "absolute", left: 0, top: "10%", bottom: "10%",
                    width: 1,
                    background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)",
                }} />

                <div style={{ width: "100%", maxWidth: 420 }}>
                    {/* Card */}
                    <div className="animate-fade-up" style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: 24,
                        padding: "44px 40px",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}>
                        {/* Card header */}
                        <div style={{ marginBottom: 36, textAlign: "center" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: "linear-gradient(135deg, #1ABC9C, #3b82f6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.6rem",
                                boxShadow: "0 8px 24px rgba(26,188,156,0.3)",
                                margin: "0 auto 20px",
                                color: "#fff"
                            }}><LuHand /></div>
                            <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                                Create your Account
                            </h2>
                            <p style={{ margin: "12px 0 0", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                Choose your account type to get started
                            </p>
                        </div>

                        {/* Options */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                            <Link href="/register/patient" style={{
                                padding: "20px 24px",
                                background: "rgba(15,212,176,0.06)",
                                border: "1px solid rgba(15,212,176,0.25)",
                                borderRadius: 16,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 20,
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15,212,176,0.12)"; e.currentTarget.style.borderColor = "rgba(15,212,176,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(15,212,176,0.06)"; e.currentTarget.style.borderColor = "rgba(15,212,176,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                                <div style={{ fontSize: "2.2rem", color: "#0fd4b0", display: "flex" }}><LuUser /></div>
                                <div>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>I'm a Patient</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Manage and view your medical records</div>
                                </div>
                                <div style={{ marginLeft: "auto", color: "var(--accent-teal)" }}><LuArrowRight /></div>
                            </Link>

                            <Link href="/register/hospital" style={{
                                padding: "20px 24px",
                                background: "rgba(139,92,246,0.06)",
                                border: "1px solid rgba(139,92,246,0.25)",
                                borderRadius: 16,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 20,
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.06)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                                <div style={{ fontSize: "2.2rem", color: "#a78bfa", display: "flex" }}><LuHospital /></div>
                                <div>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>I'm a Hospital</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Register your hospital facility</div>
                                </div>
                                <div style={{ marginLeft: "auto", color: "#a78bfa" }}><LuArrowRight /></div>
                            </Link>
                        </div>

                        {/* Divider */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            margin: "24px 0",
                        }}>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                            <span style={{ fontSize: "0.78rem", color: "#475569" }}>or</span>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                        </div>

                        <p style={{ textAlign: "center", margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Already have an account?{" "}
                            <Link href="/login" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                Sign in <LuArrowRight />
                            </Link>
                        </p>
                    </div>

                    {/* Trust badges */}
                    <div style={{
                        display: "flex", justifyContent: "center", gap: 24,
                        marginTop: 24,
                    }}>
                        <div style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <LuLock size={12} /> Encrypted
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <LuFingerprint size={14} /> Aadhaar-linked
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <LuZap size={14} /> Real-time
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
