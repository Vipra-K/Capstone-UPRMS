"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuX, LuBrain, LuActivity, LuStethoscope, LuHistory, LuUser, LuCalendar, LuPhone, LuHeartPulse, LuShieldCheck, LuDownload } from "react-icons/lu";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: { hospitalName: string };
}

interface Patient {
    id: number;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    assignedDoctor?: {
        fullName: string;
        specialization: string;
        isEmergency: boolean;
        isSameHospital: boolean;
    } | null;
}

interface AIAnalysis {
    clinicalBrief: string;
    healthScore: number;
    riskLevel: "high" | "medium" | "low";
}

export default function PatientDossier({ patient, onClose }: { patient: Patient, onClose: () => void }) {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [ai, setAi] = useState<AIAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<"summary" | "timeline">("summary");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const res = await api.get(`/medical-records/patient/${patient.id}`);
                setRecords(res.data);
                
                if (res.data.length > 0) {
                    setAnalyzing(true);
                    const aiRes = await fetch("/api/analyze-records", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ records: res.data })
                    });
                    const aiData = await aiRes.json();
                    setAi(aiData);
                }
            } catch (err) {
                console.error("Failed to load patient history", err);
            } finally {
                setLoading(false);
                setAnalyzing(false);
            }
        }
        loadData();
    }, [patient.id]);

    const calculateAge = (dob: string) => {
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        return age;
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const formatSmallDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    const handleDownload = async (fileUrl: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const filename = fileUrl.replace("uploads/", "").replace("uploads\\", "");
        try {
            const res = await api.get(`/medical-records/download/${filename}`, { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error("Failed to fetch file", error);
            alert("No medical file was found for this specific entry.");
        }
    };

    const exportToCSV = () => {
        const headers = ["Visit Date", "Hospital", "Diagnosis", "Prescription"];
        const rows = records.map(r => [r.visitDate, r.hospital.hospitalName, r.diagnosis, r.prescription]);
        const content = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Health_Summary_${patient.fullName.replace(" ", "_")}.csv`;
        a.click();
    };

    
    return (
        <div className="animate-fade-up" style={{ 
            padding: "32px", 
            background: "rgba(2, 6, 23, 1)", 
            minHeight: "100vh", 
            width: "100%", 
            borderRadius: 24,
            display: "flex", 
            flexDirection: "column",
            alignItems: "center"
        }}>
            {/* Mobile override handles the sidebar hidden state */}
            <style>{`
                @media (max-width: 768px) {
                    div[style*="fixed"] { left: 0 !important; top: 64px !important; }
                }
            `}</style>
            <div style={{ width: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 24, minHeight: "fit-content", paddingBottom: 40 }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 20,
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.8rem", fontWeight: 900, color: "#fff",
                            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.4)"
                        }}>
                            {patient.fullName[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", margin: 0 }}>{patient.fullName}</h2>
                            <div style={{ display: "flex", gap: 16, marginTop: 6, color: "#94a3b8", fontSize: "0.95rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><LuUser size={16} /> {patient.gender}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><LuCalendar size={16} /> {calculateAge(patient.dateOfBirth)} Years</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><LuPhone size={16} /> {patient.phone}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                    }} onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"} onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                        <LuX size={24} />
                    </button>
                </div>

                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                    gap: 24,
                    alignItems: "start"
                }}>
                    {/* Main Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
                        
                        {/* Status Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                            <div style={{ padding: "24px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <LuStethoscope size={16} color="#3b82f6" /> Current Care Team
                                </div>
                                {patient.assignedDoctor ? (
                                    <div>
                                        <div style={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}>Dr. {patient.assignedDoctor.fullName}</div>
                                        <div style={{ color: "#3b82f6", fontSize: "0.85rem", fontWeight: 700, marginTop: 4, textTransform: "uppercase" }}>{patient.assignedDoctor.specialization}</div>
                                        {patient.assignedDoctor.isEmergency && (
                                            <div style={{ marginTop: 12, display: "inline-flex", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", padding: "4px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 800 }}>EMERGENCY CASE</div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ color: "#475569", fontSize: "0.95rem" }}>No doctor assigned yet.</div>
                                )}
                            </div>
                            
                            <div style={{ padding: "24px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <LuHeartPulse size={16} color="#ef4444" /> Health Vitality
                                </div>
                                {ai ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                        <div style={{ position: "relative", width: 64, height: 64 }}>
                                            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                                <circle cx="18" cy="18" r="16" fill="none" stroke={(ai.healthScore ?? 0) > 70 ? "#10b981" : "#f59e0b"} strokeWidth="4" strokeDasharray={`${ai.healthScore ?? 0}, 100`} />
                                            </svg>
                                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 900, color: "#fff" }}>{ai.healthScore ?? 0}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: "#fff", fontWeight: 700 }}>{(ai.riskLevel || "Moderate").toUpperCase()} RISK</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>AI Risk Assessment</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: "#475569", fontSize: "0.95rem" }}>Analyzing patient data...</div>
                                )}
                            </div>
                        </div>

                        {/* Tabs content */}
                        <div style={{ display: "flex", gap: 8, background: "rgba(15, 23, 42, 0.4)", padding: 6, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                            <button onClick={() => setActiveTab("summary")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: activeTab === "summary" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: activeTab === "summary" ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <LuBrain size={18} /> Clinical Intelligence
                            </button>
                            <button onClick={() => setActiveTab("timeline")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: activeTab === "timeline" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: activeTab === "timeline" ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <LuHistory size={18} /> Full Timeline
                            </button>
                        </div>

                        {activeTab === "summary" && (
                            <div style={{ padding: "32px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", minHeight: 400 }}>
                                {analyzing ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 20 }}>
                                        <div className="spinner" />
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontWeight: 800, color: "#fff", fontSize: "1.2rem" }}>Analyzing Clinical History</div>
                                            <div style={{ color: "#64748b", marginTop: 4 }}>AI is processing medical findings...</div>
                                        </div>
                                    </div>
                                ) : ai ? (
                                    <div className="animate-fade-up">
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                                            <div style={{ fontSize: "2rem" }}>💬</div>
                                            <div>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Treatment Brief</div>
                                                <p style={{ fontSize: "1.1rem", color: "#e2e8f0", lineHeight: 1.8, margin: 0 }}>{ai.clinicalBrief}</p>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            {/* We can add more AI content here like chronic conditions etc. */}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "100px 0", color: "#475569" }}>No medical records available for analysis yet.</div>
                                )}
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div style={{ padding: "32px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", minHeight: 400 }}>
                                {loading ? (
                                    <div className="spinner" style={{ margin: "100px auto" }} />
                                ) : records.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "100px 0", color: "#475569" }}>No visit history found.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                        {records.map((r, i) => (
                                            <div key={r.id} style={{ display: "flex", gap: 20 }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
                                                    {i < records.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />}
                                                </div>
                                                <div style={{ flex: 1, paddingBottom: 24 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>{formatDate(r.visitDate)} · {r.hospital.hospitalName}</div>
                                                        {r.reportFileURL && (
                                                            <button onClick={(e) => handleDownload(r.reportFileURL!, e)} style={{ background: "rgba(59, 130, 246, 0.1)", border: "none", color: "#3b82f6", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
                                                                <LuDownload size={12} /> REPORT
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>{r.diagnosis}</div>
                                                    <div style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.6 }}>{r.prescription}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ padding: "24px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(96, 165, 250, 0.2)" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Actions</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <button 
                                    className="btn-primary" 
                                    onClick={() => window.location.reload()}
                                    style={{ padding: "14px", fontSize: "0.9rem", width: "100%", justifyContent: "center" }}
                                >
                                    <LuBrain size={18} /> Update AI Report
                                </button>
                                <button 
                                    className="btn-outline" 
                                    onClick={exportToCSV}
                                    style={{ padding: "14px", fontSize: "0.9rem", width: "100%", justifyContent: "center", borderColor: "rgba(255,255,255,0.1)" }}
                                >
                                    <LuDownload size={18} /> Export Records
                                </button>
                                <button 
                                    className="btn-outline" 
                                    onClick={onClose}
                                    style={{ padding: "14px", fontSize: "0.9rem", width: "100%", justifyContent: "center", borderColor: "rgba(255,255,255,0.1)", color: "#fca5a5" }}
                                >
                                    <LuX size={18} /> Finish Session
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: "24px", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Privacy Check</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>
                                <LuShieldCheck size={16} /> Access Active
                            </div>
                            <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: 8, lineHeight: 1.5 }}>You have active permission to view and upload records for this patient.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
