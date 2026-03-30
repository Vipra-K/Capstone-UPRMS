"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../utils/api";

import HospitalProfileCard from "@/app/hospital/dashboard/components/HospitalProfileCard";
import PatientSearch from "@/app/hospital/dashboard/components/PatientSearch";
import UploadRecordForm from "@/app/hospital/dashboard/components/UploadRecordForm";
import HospitalTimelineView from "@/app/hospital/dashboard/components/HospitalTimelineView";
import AuditLogs from "@/app/hospital/dashboard/components/AuditLogs";
import DoctorManagement from "@/app/hospital/dashboard/components/DoctorManagement";
import CreateDoctorTab from "@/app/hospital/dashboard/components/CreateDoctorTab";
import FindPatient from "@/app/hospital/dashboard/components/FindPatient";
import AssignPatient from "@/app/hospital/dashboard/components/AssignPatient";
import AIPatientSummary from "@/app/hospital/dashboard/components/AIPatientSummary";

import { 
    LuLayoutDashboard, 
    LuSearch,
    LuFilePlus,
    LuClock,
    LuSparkles,
    LuActivity,
    LuStethoscope,
    LuUserPlus,
    LuLogOut,
    LuBell,
    LuShield,
    LuUsers
} from "react-icons/lu";

type Tab = "overview" | "find_patient" | "search" | "ai_summary" | "assign_patient" | "upload" | "timeline" | "audit" | "doctors" | "create_doctor";

const TABS: { id: Tab; label: string; icon: React.ReactElement; color: string }[] = [
    {
        id: "overview", label: "Dashboard Overview", color: "#3b82f6",
        icon: <LuLayoutDashboard size={18} />,
    },
    {
        id: "find_patient", label: "Find Patient", color: "#fbbf24",
        icon: <LuSearch size={18} />,
    },
    {
        id: "search", label: "My Patients", color: "#8b5cf6",
        icon: <LuUsers size={18} />,
    },
    {
        id: "ai_summary", label: "AI Clinical Summary", color: "#f59e0b",
        icon: <LuSparkles size={18} />,
    },
    {
        id: "assign_patient", label: "Assign Patient", color: "#10b981",
        icon: <LuUserPlus size={18} />,
    },
    {
        id: "upload", label: "Upload Record", color: "#22d3ee",
        icon: <LuFilePlus size={18} />,
    },
    {
        id: "timeline", label: "Patient Timeline", color: "#1ABC9C",
        icon: <LuClock size={18} />,
    },
    {
        id: "audit", label: "Audit Logs", color: "#9ca3af",
        icon: <LuActivity size={18} />,
    },
    {
        id: "doctors", label: "Doctor Management", color: "#f472b6",
        icon: <LuStethoscope size={18} />,
    },
    {
        id: "create_doctor", label: "Create Doctor", color: "#a78bfa",
        icon: <LuUserPlus size={18} />,
    },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "Dashboard Overview", subtitle: "Hospital profile, key statistics, and recent activity" },
    find_patient: { title: "Find New Patient", subtitle: "Enter Patient Registration Number to request access" },
    search: { title: "My Patients", subtitle: "View and manage patients currently linked to your hospital" },
    ai_summary: { title: "AI Clinical Intelligence", subtitle: "AI analyzes all patient records — surgeries, ranked history, and treatment recommendations" },
    assign_patient: { title: "Assign Patient to Doctor", subtitle: "Link authorized patients to medical staff for consultation" },
    upload: { title: "Upload Medical Record", subtitle: "Create new medical entries for patients who have granted access" },
    timeline: { title: "Patient Timeline", subtitle: "View chronological health history for authorized patients" },
    audit: { title: "Audit Logs", subtitle: "Track record uploads and access requests made by this hospital" },
    doctors: { title: "Doctor Management", subtitle: "Register, manage, and monitor doctors in your hospital" },
    create_doctor: { title: "Create Doctor Account", subtitle: "Register a new doctor and assign them to your hospital" },
};

export default function HospitalDashboard() {
    const router = useRouter();
    const params = useParams();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfileAndStats = useCallback(async () => {
        const role = localStorage.getItem("role");
        const storedSlug = localStorage.getItem("hospitalSlug");
        const currentSlug = params.hospitalSlug as string;

        // Wait until the slug param has hydrated before running the security check
        if (!currentSlug) return;

        // Security check: role must be HOSPITAL and slug must match
        if (role !== "HOSPITAL" || storedSlug !== currentSlug) {
            router.push("/login");
            return;
        }

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
    }, [router, params.hospitalSlug]);

    // Re-run once the slug param hydrates (fixes the Next.js SSR undefined params issue)
    useEffect(() => { fetchProfileAndStats(); }, [fetchProfileAndStats]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <LuShield size={22} color="white" />
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

    const initials = profile?.hospitalName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "H";

    return (
        <div className="dashboard-shell">
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
                        <button className="topbar-icon-btn">
                            <LuBell size={18} />
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
                                    <LuUsers size={20} color="#3b82f6" />
                                </div>
                                <span className="kpi-trend up">↑ Active</span>
                            </div>
                            <div className="kpi-value">{stats?.totalPatients ?? "—"}</div>
                            <div className="kpi-label">Authorized Patients</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(26,188,156,0.12)" }}>
                                    <LuActivity size={20} color="#1ABC9C" />
                                </div>
                                <span className="kpi-trend neutral">Records</span>
                            </div>
                            <div className="kpi-value">{stats?.totalRecords ?? "—"}</div>
                            <div className="kpi-label">Total Records</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(244,114,182,0.12)" }}>
                                    <LuStethoscope size={20} color="#f472b6" />
                                </div>
                                <span className="kpi-trend up">Staff</span>
                            </div>
                            <div className="kpi-value">{profile?.id ? "Active" : "—"}</div>
                            <div className="kpi-label">Hospital Status</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(139,92,246,0.1)" }}>
                                    <LuShield size={20} color="#8b5cf6" />
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
                    <div className="dark-panel animate-fade-up-delay-1">
                        {activeTab === "overview" && profile && stats && (
                            <HospitalProfileCard profile={profile} stats={stats} onProfileUpdate={fetchProfileAndStats} />
                        )}
                        {activeTab === "find_patient" && <FindPatient />}
                        {activeTab === "search" && <PatientSearch onlyLinked={true} />}
                        {activeTab === "ai_summary" && <AIPatientSummary />}
                        {activeTab === "assign_patient" && <AssignPatient />}
                        {activeTab === "upload" && <UploadRecordForm onUploadSuccess={() => setActiveTab("timeline")} />}
                        {activeTab === "timeline" && <HospitalTimelineView />}
                        {activeTab === "audit" && <AuditLogs />}
                        {activeTab === "doctors" && <DoctorManagement />}
                        {activeTab === "create_doctor" && <CreateDoctorTab />}
                    </div>
                </main>
            </div>
        </div>
    );
}
