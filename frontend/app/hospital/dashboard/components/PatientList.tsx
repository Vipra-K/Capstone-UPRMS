"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import { LuSearch, LuUser, LuPhone, LuHistory, LuStethoscope, LuExternalLink, LuShieldCheck } from "react-icons/lu";
import PatientDossier from "./PatientDossier";

interface Patient {
    id: number;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    grantedAt: string;
    assignedDoctor?: {
        fullName: string;
        specialization: string;
        isEmergency: boolean;
        isSameHospital: boolean;
    } | null;
}

export default function PatientList() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const r = await api.get("/hospitals/patients");
            setPatients(r.data);
        } catch { setPatients([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPatients(); }, []);

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return !q || p.fullName?.toLowerCase().includes(q) || p.phone?.includes(q);
    });

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    if (selectedPatient) {
        return <PatientDossier patient={selectedPatient} onClose={() => setSelectedPatient(null)} />;
    }

    return (
        <div className="animate-fade-up">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                        Clinical Directory <span style={{ fontSize: "1rem", color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "4px 12px", borderRadius: 20 }}>{patients.length} ACTIVE</span>
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "8px 0 0" }}>
                        Manage linked patients and view comprehensive AI-driven health dossiers
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ position: "relative", maxWidth: 500 }}>
                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#475569" }}>
                        <LuSearch size={20} />
                    </span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search dossier by name or mobile…"
                        style={{ width: "100%", padding: "16px 16px 16px 52px", background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 16, color: "#fff", fontSize: "1rem", outline: "none", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"}
                        onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0", color: "#64748b" }}>
                    <div className="spinner" style={{ margin: "0 auto 24px" }} />
                    <p style={{ fontWeight: 600 }}>Syncing Patient Directory...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "100px 40px", background: "rgba(15, 23, 42, 0.4)", borderRadius: 24, border: "2px dashed rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 80, height: 80, background: "rgba(59,130,246,0.05)", color: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <LuUser size={40} />
                    </div>
                    <h3 style={{ color: "#fff", fontWeight: 800, margin: "0 0 12px", fontSize: "1.2rem" }}>No Records Found</h3>
                    <p style={{ color: "#64748b", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                        {patients.length === 0 ? "You do not have any patients linked to your hospital yet." : "No patient matches your current search filters."}
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            style={{ 
                                padding: "28px", borderRadius: 24, 
                                background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.08)", 
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "default",
                                position: "relative", overflow: "hidden"
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = "translateY(-6px)";
                                e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                                e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
                                <div style={{ 
                                    width: 60, height: 60, borderRadius: 18, 
                                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", 
                                    display: "flex", alignItems: "center", justifyContent: "center", 
                                    fontSize: "1.5rem", fontWeight: 900, color: "#fff", flexShrink: 0,
                                    boxShadow: "0 8px 16px rgba(59, 130, 246, 0.2)"
                                }}>
                                    {p.fullName?.[0]?.toUpperCase() || "P"}
                                </div>
                                <div style={{ overflow: "hidden", flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "1.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.fullName}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                                        <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{p.gender}</span>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#475569" }} />
                                        <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>{calculateAge(p.dateOfBirth)} Years</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: 16, marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}>
                                    <LuPhone size={16} color="#3b82f6" />
                                    {p.phone}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}>
                                    <LuHistory size={16} color="#3b82f6" />
                                    <span style={{ color: "#64748b" }}>Granted:</span> {new Date(p.grantedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Assigned Care</div>
                                    {p.assignedDoctor ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}><LuStethoscope size={16} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Dr. {p.assignedDoctor.fullName}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>{p.assignedDoctor.specialization}</div>
                                            </div>
                                            {!p.assignedDoctor.isSameHospital && <div title="Assigned by another hospital" style={{ opacity: 0.6 }}><LuShieldCheck size={14} color="#f59e0b" /></div>}
                                        </div>
                                    ) : (
                                        <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textAlign: "center" }}>
                                            No Active Assignment
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setSelectedPatient(p)}
                                    className="btn-primary" 
                                    style={{ 
                                        padding: "14px", fontSize: "0.95rem", fontWeight: 700, 
                                        borderRadius: 14, width: "100%", justifyContent: "center", gap: 12,
                                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                        boxShadow: "0 10px 20px -5px rgba(59, 130, 246, 0.4)",
                                        border: "none", cursor: "pointer"
                                    }}
                                >
                                    <LuExternalLink size={18} />
                                    Manage Dossier
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
