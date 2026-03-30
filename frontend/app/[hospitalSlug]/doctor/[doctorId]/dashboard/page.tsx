"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../../utils/api";

import DoctorProfileCard from "../../../../doctor/dashboard/components/DoctorProfileCard";
import PatientSearchDoctor from "../../../../doctor/dashboard/components/PatientSearchDoctor";
import DoctorRecordViewer from "../../../../doctor/dashboard/components/DoctorRecordViewer";
import DoctorAISummary from "../../../../doctor/dashboard/components/DoctorAISummary";
import SmartTimeline from "../../../../doctor/dashboard/components/SmartTimeline";
import DoctorActivityLog from "../../../../doctor/dashboard/components/DoctorActivityLog";
import DoctorNotifications from "../../../../doctor/dashboard/components/DoctorNotifications";
import DoctorSchedule from "../../../../doctor/dashboard/components/DoctorSchedule";
import DoctorAssignedPatients from "../../../../doctor/dashboard/components/DoctorAssignedPatients";

import { 
    LuUser, 
    LuSearch, 
    LuUsers, 
    LuFolder, 
    LuZap, 
    LuFileClock, 
    LuCalendarDays, 
    LuActivity, 
    LuBell,
    LuLogOut,
    LuClock,
    LuAward,
    LuShield,
    LuSparkles
} from "react-icons/lu";

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
        icon: <LuUser size={18} />,
    },
    {
        id: "search", label: "Patient Search", color: "#8b5cf6",
        icon: <LuSearch size={18} />,
    },
    {
        id: "assigned", label: "Assigned Patients", color: "#f472b6",
        icon: <LuUsers size={18} />,
    },
    {
        id: "records", label: "Record Viewer", color: "#22d3ee",
        icon: <LuFolder size={18} />,
    },
    {
        id: "ai", label: "AI Health Assistant", color: "#a78bfa",
        icon: <LuSparkles size={18} />,
    },
    {
        id: "timeline", label: "Smart Timeline", color: "#1ABC9C",
        icon: <LuFileClock size={18} />,
    },
    {
        id: "schedule", label: "Schedule", color: "#10b981",
        icon: <LuCalendarDays size={18} />,
    },
    {
        id: "activity", label: "Activity Log", color: "#9ca3af",
        icon: <LuActivity size={18} />,
    },
    {
        id: "notifications", label: "Notifications", color: "#fb923c",
        icon: <LuBell size={18} />,
    },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "My Profile", subtitle: "View and manage your doctor profile and credentials" },
    search: { title: "Patient Search", subtitle: "Search patients by name, phone, Aadhaar or ID" },
    assigned: { title: "Assigned Patients", subtitle: "Patients assigned to you by your hospital admin" },
    records: { title: "Record Viewer", subtitle: "View complete medical history for patients who have granted access" },
    ai: { title: "AI Health Assistant", subtitle: "AI clinical overview — chronic conditions, risk indicators, and medication patterns" },
    timeline: { title: "Smart Timeline", subtitle: "Year-wise health history with surgery, critical and recurring illness markers" },
    schedule: { title: "Schedule & Availability", subtitle: "Set working hours, mark leave days, and view your real-time availability" },
    activity: { title: "Activity Log", subtitle: "Full audit trail of your patient record access and downloads" },
    notifications: { title: "Notifications", subtitle: "Access alerts, AI risk flags, and system updates" },
};

export default function DoctorDashboard() {
    const router = useRouter();
    const params = useParams();
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
        const storedSlug = localStorage.getItem("hospitalSlug");
        
        if (!params.hospitalSlug || !params.doctorId) return; // Wait for hydration

        // Security check
        if (role !== "DOCTOR" || storedSlug !== params.hospitalSlug) {
            router.push("/login");
            return;
        }

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
    }, [router, params.hospitalSlug]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    const handleSelectPatient = (p: { id: number; fullName: string }) => {
        setSelectedPatient(p);
        setActiveTab("records");
    };

    /* ── License warning config ────────────────────── */
    const licenseWarning = licenseStatus && (licenseStatus.status === "EXPIRING_SOON" || licenseStatus.status === "EXPIRED");
    const licenseWarnConfig = null;

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <LuUser size={22} color="white" />
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
                        {/* Selected patient chip */}
                        {selectedPatient && (
                            <div style={{ padding: "4px 12px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 16, fontSize: "0.78rem", color: "#c4b5fd", display: "flex", alignItems: "center", gap: 8 }}>
                                👤 {selectedPatient.fullName}
                                <button onClick={() => setSelectedPatient(null)} style={{ background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}>×</button>
                            </div>
                        )}
                        <button className="topbar-icon-btn">
                            <LuBell size={18} />
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
                                    <LuUser size={20} color="#10b981" />
                                </div>
                                <span className="kpi-trend up">Active</span>
                            </div>
                            <div className="kpi-value">{profile?.role?.replace(/_/g, " ") ?? "—"}</div>
                            <div className="kpi-label">Role</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(59,130,246,0.12)" }}>
                                    <LuClock size={20} color="#3b82f6" />
                                </div>
                                <span className="kpi-trend neutral">{profile?.workingHoursStart ?? "—"}</span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.4rem" }}>{profile?.workingHoursStart ? `${profile.workingHoursStart}–${profile.workingHoursEnd}` : "Not set"}</div>
                            <div className="kpi-label">Working Hours</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(245,158,11,0.12)" }}>
                                    <LuAward size={20} color="#f59e0b" />
                                </div>
                                <span className="kpi-trend up">Verified</span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.1rem" }}>{licenseStatus?.licenseNumber ?? "—"}</div>
                            <div className="kpi-label">License Number</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(244,114,182,0.12)" }}>
                                    <LuUsers size={20} color="#f472b6" />
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
