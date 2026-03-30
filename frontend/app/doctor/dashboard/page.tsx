"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";

import DoctorProfileCard from "./components/DoctorProfileCard";
import PatientSearchDoctor from "./components/PatientSearchDoctor";
import DoctorRecordViewer from "./components/DoctorRecordViewer";
import DoctorAISummary from "./components/DoctorAISummary";
import SmartTimeline from "./components/SmartTimeline";
import DoctorActivityLog from "./components/DoctorActivityLog";
import DoctorNotifications from "./components/DoctorNotifications";
import DoctorSchedule from "./components/DoctorSchedule";
import DoctorAssignedPatients from "./components/DoctorAssignedPatients";

type Tab =
    | "overview"
    | "search"
    | "records"
    | "ai"
    | "timeline"
    | "activity"
    | "notifications"
    | "schedule"
    | "assigned";

interface SelectedPatient { id: number; fullName: string; }
interface LicenseStatus { status: string; daysRemaining: number | null; licenseNumber: string; }

const INACTIVITY_MS = 30 * 60 * 1000;

const TABS: { id: Tab; label: string; icon: React.ReactElement; color: string }[] = [
    {
        id: "overview", label: "My Profile", color: "#3b82f6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
    {
        id: "search", label: "Patient Search", color: "#8b5cf6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    },
    {
        id: "assigned", label: "Assigned Patients", color: "#f472b6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    {
        id: "records", label: "Record Viewer", color: "#22d3ee",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    },
    {
        id: "ai", label: "AI Summary", color: "#a78bfa",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    },
    {
        id: "timeline", label: "Smart Timeline", color: "#1ABC9C",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    },
    {
        id: "schedule", label: "Schedule", color: "#10b981",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
        id: "activity", label: "Activity Log", color: "#9ca3af",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    },
    {
        id: "notifications", label: "Notifications", color: "#fb923c",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "My Profile", subtitle: "View and manage your doctor profile and credentials" },
    search: { title: "Patient Search", subtitle: "Search patients by name, phone, Aadhaar or ID" },
    assigned: { title: "Assigned Patients", subtitle: "Patients assigned to you by your hospital admin" },
    records: { title: "Record Viewer", subtitle: "View complete medical history for patients who have granted access" },
    ai: { title: "AI Medical Summary", subtitle: "AI clinical overview — chronic conditions, risk indicators, medication patterns" },
    timeline: { title: "Smart Timeline", subtitle: "Year-wise health history with surgery, critical and recurring illness markers" },
    schedule: { title: "Schedule & Availability", subtitle: "Set working hours, mark leave days, and view your real-time availability" },
    activity: { title: "Activity Log", subtitle: "Full audit trail of your patient record access and downloads" },
    notifications: { title: "Notifications", subtitle: "Access alerts, AI risk flags, and system updates" },
};

export default function DoctorDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [profile, setProfile] = useState<any>(null);
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);

    /* ── auto-logout on inactivity ─────────────────── */
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetTimer = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            localStorage.clear();
            router.push("/login?reason=inactivity");
        }, INACTIVITY_MS);
    }, [router]);

    useEffect(() => {
        const events = ["mousemove", "keydown", "click", "touchstart"];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (timer.current) clearTimeout(timer.current);
        };
    }, [resetTimer]);

    /* ── role guard + profile load ─────────────────── */
    const fetchProfile = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "DOCTOR") { router.push("/login"); return; }
        try {
            const [profileRes, licenseRes] = await Promise.allSettled([
                api.get("/doctors/profile"),
                api.get("/doctors/license-status"),
            ]);
            if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
            if (licenseRes.status === "fulfilled") setLicenseStatus(licenseRes.value.data);
        } catch {
            setError("Failed to load profile. Please log in again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    const handleSelectPatient = (p: { id: number; fullName: string }) => {
        setSelectedPatient(p);
        setActiveTab("records");
    };

    /* ── License warning config ────────────────────── */
    const licenseWarning = false;
    const licenseWarnConfig = null;

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div className="spinner" />
            <p style={{ color: "#5A6A7A", fontWeight: 500, fontSize: "0.9rem" }}>Loading Doctor Portal…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: "32px 40px", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", color: "#E74C3C", fontWeight: 600 }}>⚠ {error}</div>
        </div>
    );

    const initials = profile?.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "DR";

    return (
        <div className="dashboard-shell">
            {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
            <aside className="dashboard-sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>D</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Doctor Portal</div>
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
                                <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Hospital info chip */}
                {profile?.hospitalName && (
                    <div style={{ margin: "8px 12px 0", padding: "10px 12px", borderRadius: 8, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(110,231,183,0.7)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Hospital</div>
                        <div style={{ fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 500 }}>{profile.hospitalName}</div>
                    </div>
                )}

                {/* Profile at bottom */}
                <div className="sidebar-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>{initials}</div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.fullName ?? "Doctor"}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: 1 }}>{profile?.specialization ?? "General"}</div>
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
                        {/* Selected patient chip */}
                        {selectedPatient && (
                            <div style={{ padding: "4px 12px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 16, fontSize: "0.78rem", color: "#c4b5fd", display: "flex", alignItems: "center", gap: 8 }}>
                                👤 {selectedPatient.fullName}
                                <button onClick={() => setSelectedPatient(null)} style={{ background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}>×</button>
                            </div>
                        )}
                        <button className="topbar-icon-btn">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            <span className="notification-dot" />
                        </button>
                        <div className="topbar-avatar" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }} title={profile?.fullName}>{initials}</div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-content">
                    {/* KPI Stats Row */}
                    <div className="kpi-grid animate-fade-up" style={{ marginBottom: 28 }}>
                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(16,185,129,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <span className="kpi-trend up">Active</span>
                            </div>
                            <div className="kpi-value">{profile?.role?.replace(/_/g, " ") ?? "—"}</div>
                            <div className="kpi-label">Role</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(59,130,246,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                </div>
                                <span className="kpi-trend neutral">{profile?.workingHoursStart ?? "—"}</span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.4rem" }}>{profile?.workingHoursStart ? `${profile.workingHoursStart}–${profile.workingHoursEnd}` : "Not set"}</div>
                            <div className="kpi-label">Working Hours</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(245,158,11,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                </div>
                                <span className="kpi-trend up">Verified</span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.1rem" }}>{licenseStatus?.licenseNumber ?? "—"}</div>
                            <div className="kpi-label">License Number</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(244,114,182,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                </div>
                                <span className="kpi-trend up">Assigned</span>
                            </div>
                            <div className="kpi-value">{profile?.department ?? "—"}</div>
                            <div className="kpi-label">Department</div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="dark-panel animate-fade-up-delay-1">
                        {activeTab === "overview" && <DoctorProfileCard onProfileUpdate={fetchProfile} />}
                        {activeTab === "search" && <PatientSearchDoctor onSelectPatient={handleSelectPatient} />}
                        {activeTab === "assigned" && <DoctorAssignedPatients onSelectPatient={handleSelectPatient} />}
                        {activeTab === "records" && <DoctorRecordViewer patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "ai" && <DoctorAISummary patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "timeline" && <SmartTimeline patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "schedule" && <DoctorSchedule />}
                        {activeTab === "activity" && <DoctorActivityLog />}
                        {activeTab === "notifications" && <DoctorNotifications />}
                    </div>
                </main>
            </div>
        </div>
    );
}
