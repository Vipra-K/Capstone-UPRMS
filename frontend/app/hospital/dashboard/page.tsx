"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";

import HospitalProfileCard from "./components/HospitalProfileCard";
import PatientSearch from "./components/PatientSearch";
import UploadRecordForm from "./components/UploadRecordForm";
import HospitalTimelineView from "./components/HospitalTimelineView";
import AIPatientSummary from "./components/AIPatientSummary";
import AuditLogs from "./components/AuditLogs";
import DoctorManagement from "./components/DoctorManagement";
import CreateDoctorTab from "./components/CreateDoctorTab";
import PatientList from "./components/PatientList";

type Tab = "overview" | "patients" | "search" | "upload" | "timeline" | "ai" | "audit" | "doctors" | "create_doctor";

const TABS: { id: Tab; label: string; icon: React.ReactElement; color: string }[] = [
    {
        id: "overview", label: "Dashboard Overview", color: "#3b82f6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    },
    {
        id: "patients", label: "Linked Patients", color: "#3b82f6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    {
        id: "search", label: "Patient Search & Access", color: "#8b5cf6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    {
        id: "upload", label: "Upload Record", color: "#22d3ee",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
    },
    {
        id: "timeline", label: "Patient Timeline", color: "#1ABC9C",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    },
    {
        id: "ai", label: "AI Health Assistant", color: "#a78bfa",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /></svg>,
    },
    {
        id: "audit", label: "Audit Logs", color: "#9ca3af",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    },
    {
        id: "doctors", label: "Doctor Management", color: "#f472b6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4" /><circle cx="19" cy="19" r="2" /><path d="M19 15v2m0 4v2m-3-5.5.87.5m4.26 2.46-.87-.5" /></svg>,
    },
    {
        id: "create_doctor", label: "Create Doctor", color: "#a78bfa",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-4" /><path d="M20 9v4" /></svg>,
    },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "Dashboard Overview", subtitle: "Hospital profile, key statistics, and recent activity" },
    patients: { title: "Linked Patients", subtitle: "View and manage patients who have authorized your hospital" },
    search: { title: "Patient Search & Access", subtitle: "Search patients and manage access permissions" },
    upload: { title: "Upload Medical Record", subtitle: "Create new medical entries for patients who have granted access" },
    timeline: { title: "Patient Timeline", subtitle: "View chronological health history for authorized patients" },
    ai: { title: "AI Health Assistant", subtitle: "Generate clinical summaries and risk analysis using AI" },
    audit: { title: "Audit Logs", subtitle: "Track record uploads and access requests made by this hospital" },
    doctors: { title: "Doctor Management", subtitle: "Register, manage, and monitor doctors in your hospital" },
    create_doctor: { title: "Create Doctor Account", subtitle: "Register a new doctor and assign them to your hospital" },
};

export default function HospitalDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfileAndStats = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "HOSPITAL") { router.push("/login"); return; }
        try {
            const [p, s] = await Promise.all([
                api.get("/hospitals/profile"),
                api.get("/hospitals/stats"),
            ]);
            setProfile(p.data);
            setStats(s.data);
        } catch {
            setError("Failed to load dashboard data. Please log in again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchProfileAndStats(); }, [fetchProfileAndStats]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </div>
            <div className="spinner" />
            <p style={{ color: "#5A6A7A", fontWeight: 500, fontSize: "0.9rem" }}>Loading Hospital Portal…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: "32px 40px", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", color: "#E74C3C", fontWeight: 600 }}>⚠ {error}</div>
        </div>
    );

    const currentTab = TABS.find(t => t.id === activeTab)!;
    const initials = profile?.hospitalName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "H";

    return (
        <div className="dashboard-shell dark-theme">
            {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
            <aside className="dashboard-sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>H</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Hospital Portal</div>
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
                                <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Profile at bottom */}
                <div className="sidebar-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>{initials}</div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.hospitalName ?? "Hospital"}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Reg #{profile?.registrationNumber ?? "—"}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-outline" style={{
                        width: "100%", marginTop: 8, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)",
                        fontSize: "0.82rem", padding: "9px 14px", justifyContent: "flex-start", gap: 8
                    }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
                        <button className="topbar-icon-btn">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            <span className="notification-dot" />
                        </button>
                        <div className="topbar-avatar" style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }} title={profile?.hospitalName}>{initials}</div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-content">
                    {/* KPI Stats Row */}
                    <div className="kpi-grid animate-fade-up" style={{ marginBottom: 28 }}>
                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(59,130,246,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <span className="kpi-trend up">↑ Active</span>
                            </div>
                            <div className="kpi-value">{stats?.totalPatients ?? "—"}</div>
                            <div className="kpi-label">Authorized Patients</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(26,188,156,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#1ABC9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                </div>
                                <span className="kpi-trend neutral">Records</span>
                            </div>
                            <div className="kpi-value">{stats?.totalRecords ?? "—"}</div>
                            <div className="kpi-label">Total Records</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(244,114,182,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4" /></svg>
                                </div>
                                <span className="kpi-trend up">Staff</span>
                            </div>
                            <div className="kpi-value">{profile?.id ? "Active" : "—"}</div>
                            <div className="kpi-label">Hospital Status</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(139,92,246,0.1)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <span className="kpi-trend neutral">
                                    {stats?.recentActivity?.length > 0
                                        ? new Date(stats.recentActivity[0]?.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                                        : "—"}
                                </span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.5rem" }}>
                                {stats?.recentActivity?.length > 0
                                    ? new Date(stats.recentActivity[0]?.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                                    : "—"}
                            </div>
                            <div className="kpi-label">Last Upload</div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-up-delay-1">
                        {activeTab === "overview" && profile && stats && (
                            <HospitalProfileCard profile={profile} stats={stats} onProfileUpdate={fetchProfileAndStats} />
                        )}
                        {activeTab === "patients" && <PatientList />}
                        {activeTab === "search" && <PatientSearch />}
                        {activeTab === "upload" && <UploadRecordForm onUploadSuccess={() => setActiveTab("timeline")} />}
                        {activeTab === "timeline" && <HospitalTimelineView />}
                        {activeTab === "ai" && <AIPatientSummary />}
                        {activeTab === "audit" && <AuditLogs />}
                        {activeTab === "doctors" && <DoctorManagement />}
                        {activeTab === "create_doctor" && <CreateDoctorTab />}
                    </div>
                </main>
            </div>
        </div>
    );
}
