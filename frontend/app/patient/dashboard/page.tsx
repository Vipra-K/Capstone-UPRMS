"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import TimelineView from "./components/TimelineView";
import PatientProfile from "./components/PatientProfile";
import Analytics from "./components/Analytics";
import DocumentVault from "./components/DocumentVault";
import AccessManager from "./components/AccessManager";
import ChatBotEmbed from "./components/ChatBotEmbed";
import { 
    LuFileClock, 
    LuZap, 
    LuLayoutDashboard, 
    LuFolder, 
    LuShield,
    LuActivity,
    LuLogOut,
    LuBell,
    LuHospital,
    LuShieldCheck,
    LuClock,
    LuShieldPlus,
    LuUser
} from "react-icons/lu";

type Tab = "timeline" | "profile" | "analytics" | "vault" | "access" ;

const TABS: { id: Tab; label: string; icon: React.ReactElement; color: string }[] = [
    {
        id: "timeline", label: "Medical Timeline", color: "#1ABC9C",
        icon: <LuFileClock size={18} />,
    },
    {
        id: "profile", label: "My Profile", color: "#8b5cf6",
        icon: <LuUser size={18} />,
    },
    {
        id: "analytics", label: "Health Analytics", color: "#F39C12",
        icon: <LuLayoutDashboard size={18} />,
    },
    {
        id: "vault", label: "Document Vault", color: "#3b82f6",
        icon: <LuFolder size={18} />,
    },
    {
        id: "access", label: "Hospital Access", color: "#E74C3C",
        icon: <LuShield size={18} />,
    }
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    timeline: { title: "Medical Timeline", subtitle: "Chronological history of hospital visits and treatments" },
    profile: { title: "My Profile", subtitle: "View and update your personal information and emergency contacts" },
    analytics: { title: "Health Analytics", subtitle: "Statistical overview and trends in your medical history" },
    vault: { title: "Document Vault", subtitle: "Secure repository for your medical reports and prescriptions" },
    access: { title: "Hospital Access Manager", subtitle: "Control which healthcare providers can access your records" },
 };

export default function PatientDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [profile, setProfile] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAll = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "PATIENT") { router.push("/login"); return; }
        try {
            const [p, r, h, perms] = await Promise.all([
                api.get("/patient/profile"),
                api.get("/medical-records/patient-records"),
                api.get("/hospitals"),
                api.get("/access/my-permissions"),
            ]);
            setProfile(p.data);
            setRecords(r.data);
            setHospitals(h.data);
            setPermissions(perms.data);
        } catch {
            setError("Failed to load dashboard data. Please log in again.");
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1ABC9C,#2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <LuActivity size={22} color="white" />
            </div>
            <div className="spinner" />
            <p style={{ color: "#5A6A7A", fontWeight: 500, fontSize: "0.9rem" }}>Loading Dashboard…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: "32px 40px", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", color: "#E74C3C", fontWeight: 600 }}>⚠ {error}</div>
        </div>
    );

    const currentTab = TABS.find(t => t.id === activeTab)!;
    const initials = profile?.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "P";

    return (
        <div className="dashboard-shell">
            {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
            <aside className="dashboard-sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">U</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Patient Portal</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main Menu</div>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`sidebar-nav-btn${activeTab === t.id ? " active" : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <span className="nav-icon">{t.icon}</span>
                            {t.label}
                            {activeTab === t.id && (
                                <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--teal-500)", flexShrink: 0 }} />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Profile at bottom */}
                <div className="sidebar-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1ABC9C,#2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>{initials}</div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.fullName ?? "Patient"}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Patient ID #{profile?.id ?? "—"}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-outline" style={{
                        width: "100%", marginTop: 8, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)",
                        fontSize: "0.82rem", padding: "9px 14px", justifyContent: "flex-start", gap: 8
                    }}>
                        <LuLogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── RIGHT BODY ───────────────────────────────────── */}
            <div className="dashboard-body">
                {/* Top Header */}
                <header className="dashboard-topbar">
                    <div>
                        <div className="topbar-title">{TAB_META[activeTab].title}</div>
                        <div className="topbar-subtitle">{TAB_META[activeTab].subtitle}</div>
                    </div>
                    <div className="topbar-actions">
                        {/* Notification bell */}
                        <button className="topbar-icon-btn">
                            <LuBell size={18} />
                            <span className="notification-dot" />
                        </button>
                        {/* Avatar */}
                        <div className="topbar-avatar" title={profile?.fullName}>{initials}</div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-content">
                    {/* Quick stats row at top of every page */}
                    <div className="kpi-grid animate-fade-up" style={{ marginBottom: 28 }}>
                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(26,188,156,0.12)" }}>
                                    <LuActivity size={20} color="#1ABC9C" />
                                </div>
                                <span className="kpi-trend up">↑ Active</span>
                            </div>
                            <div className="kpi-value">{records.length}</div>
                            <div className="kpi-label">Total Records</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(30,42,95,0.08)" }}>
                                    <LuHospital size={20} color="#1E2A5F" />
                                </div>
                                <span className="kpi-trend neutral">Linked</span>
                            </div>
                            <div className="kpi-value">{permissions.length}</div>
                            <div className="kpi-label">Hospitals</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(243,156,18,0.1)" }}>
                                    <LuShieldCheck size={20} color="#F39C12" />
                                </div>
                                <span className="kpi-trend up">Granted</span>
                            </div>
                            <div className="kpi-value">{permissions.filter((p: any) => p.status === 'APPROVED').length}</div>
                            <div className="kpi-label">Active Permissions</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(139,92,246,0.1)" }}>
                                    <LuClock size={20} color="#8b5cf6" />
                                </div>
                                <span className="kpi-trend neutral">
                                    {records.length > 0
                                        ? new Date(records[records.length - 1]?.createdAt ?? records[records.length - 1]?.visitDate).getFullYear()
                                        : "—"}
                                </span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.5rem" }}>
                                {records.length > 0
                                    ? new Date(records[records.length - 1]?.createdAt ?? records[records.length - 1]?.visitDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                                    : "—"}
                            </div>
                            <div className="kpi-label">Last Visit</div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-up-delay-1">
                        {activeTab === "timeline" && <TimelineView records={records} />}
                        {activeTab === "profile" && <PatientProfile />}
                        {activeTab === "analytics" && <Analytics records={records} />}
                        {activeTab === "vault" && <DocumentVault records={records} />}
                        {activeTab === "access" && <AccessManager hospitals={hospitals} permissions={permissions} onRefresh={fetchAll} />}
                    </div>
                </main>
            </div>

            <ChatBotEmbed />
        </div>
    );
}
