"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

// ── Types ──────────────────────────────────────────────────────────────────────
type ApprovedPatient = { patientId: number; fullName: string; maskedAadhaar: string; };
interface MedicalRecord {
    id: number; visitDate: string; diagnosis: string; prescription: string;
    hospital: { id: number; hospitalName: string };
}
interface Surgery { name: string; date: string; hospital: string; notes: string; }
interface ImportantTreatment {
    rank: number; treatment: string; date: string;
    reason: string; severity: "critical" | "high" | "moderate" | "routine";
}
interface RankedRecord {
    recordId: number; visitDate: string; diagnosis: string; hospital: string;
    importanceScore: number; importanceReason: string;
    severityTag: "emergency" | "surgical" | "critical" | "chronic" | "moderate" | "routine";
    prescription: string;
}
interface AIAnalysis {
    clinicalBrief: string; healthScore: number; riskLevel: "high" | "medium" | "low";
    chronicConditions: string[]; surgeries: Surgery[];
    importantTreatments: ImportantTreatment[]; rankedRecords: RankedRecord[];
    topMeds: [string, number][]; essentialFindings: string[]; suggestions: string[];
    treatmentHistory: { date: string; treatment: string; medicines: string[]; isSurgery: boolean }[];
    predictiveRisks: { diabetes: number; cardiac: number; kidney: number; riskContext: string; };
}

// ── Style helpers ──────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
    emergency: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", color: "#f87171", dot: "#ef4444", label: "EMERGENCY" },
    surgical:  { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.35)", color: "#c084fc", dot: "#a855f7", label: "SURGICAL" },
    critical:  { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  color: "#fca5a5", dot: "#f87171", label: "CRITICAL" },
    chronic:   { bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.25)",  color: "#fde047", dot: "#eab308", label: "CHRONIC" },
    high:      { bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)", color: "#fdba74", dot: "#fb923c", label: "HIGH" },
    moderate:  { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", color: "#93c5fd", dot: "#3b82f6", label: "MODERATE" },
    routine:   { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)",   color: "#86efac", dot: "#22c55e", label: "ROUTINE" },
};
const RISK_COLOR = (r: string) => r === "high" ? "#f87171" : r === "medium" ? "#fbbf24" : "#4ade80";
const SCORE_COLOR = (s: number) => s >= 75 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171";

const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "24px", backdropFilter: "blur(12px)"
};
const sectionTitle = (color = "#fff"): React.CSSProperties => ({
    fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em",
    textTransform: "uppercase", color, marginBottom: 16,
    display: "flex", alignItems: "center", gap: 8
});

// ── Subcomponents ──────────────────────────────────────────────────────────────
function SeverityBadge({ tag }: { tag: string }) {
    const cfg = SEVERITY_CONFIG[tag] || SEVERITY_CONFIG.routine;
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
        </span>
    );
}

function RiskBar({ label, value }: { label: string; value: number }) {
    const color = value >= 65 ? "#f43f5e" : value >= 40 ? "#fbbf24" : "#22c55e";
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>
                <span>{label}</span>
                <span style={{ color }}>{value}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                    height: "100%", width: `${value}%`, background: color,
                    borderRadius: 4, transition: "width 1.2s cubic-bezier(.4,0,.2,1)"
                }} />
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AIPatientSummary() {
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [selectedName, setSelectedName] = useState<string>("");
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [error, setError] = useState("");
    const [ai, setAi] = useState<AIAnalysis | null>(null);
    const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "records" | "treatments" | "timeline">("overview");

    useEffect(() => {
        api.get("/access/hospital-requests").then((res: any) => {
            setPatients(res.data.filter((r: any) => r.status === "APPROVED"));
            setLoadingPatients(false);
        }).catch(() => {
            setError("Failed to load authorized patients.");
            setLoadingPatients(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedPatient) { setRecords([]); setAi(null); return; }
        setLoadingRecords(true);
        setError("");
        api.get(`/medical-records/patient/${selectedPatient}`).then((res: any) => {
            setRecords(res.data);
            setLoadingRecords(false);
        }).catch(() => {
            setError("Failed to load records. Access may have been revoked.");
            setLoadingRecords(false);
        });
    }, [selectedPatient]);

    useEffect(() => {
        if (!records || records.length === 0) { setAi(null); return; }
        let isMounted = true;
        setLoadingAi(true);
        setAi(null);

        fetch("/api/analyze-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        })
            .then(res => res.json())
            .then(data => { if (isMounted) { setAi(data); setLoadingAi(false); } })
            .catch(err => {
                console.error("AI Error:", err);
                if (isMounted) { setError("AI analysis failed. Please try again."); setLoadingAi(false); }
            });

        return () => { isMounted = false; };
    }, [records]);

    if (loadingPatients) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            Loading AI Clinical Intelligence…
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── Header Banner ─────────────────────────────────────── */}
            <div style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.12))",
                border: "1px solid rgba(59,130,246,0.25)", borderRadius: 16, padding: "24px 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem", boxShadow: "0 8px 24px rgba(59,130,246,0.3)"
                    }}>🧠</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#fff" }}>
                            AI Clinical Intelligence
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                            Full patient history analysis · Surgeries · Ranked records · Doctor recommendations
                        </div>
                    </div>
                </div>

                {/* Patient Selector */}
                <div style={{ minWidth: 280 }}>
                    <select
                        value={selectedPatient}
                        onChange={e => {
                            setSelectedPatient(e.target.value);
                            const p = patients.find(p => String(p.patientId) === e.target.value);
                            setSelectedName(p?.fullName ?? "");
                            setActiveTab("overview");
                        }}
                        className="input-field"
                        style={{ padding: "12px 16px", cursor: "pointer", color: "#fff", background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" }}
                    >
                        <option value="" disabled style={{ color: "#0f172a" }}>— Select Authorized Patient —</option>
                        {patients.map(p => (
                            <option key={p.patientId} value={p.patientId} style={{ color: "#0f172a" }}>
                                {p.fullName}  ·  {p.maskedAadhaar}
                            </option>
                        ))}
                    </select>
                    {patients.length === 0 && (
                        <p style={{ fontSize: "0.8rem", color: "#fca5a5", marginTop: 6 }}>
                            No patients have granted you access yet.
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", color: "#fca5a5", borderRadius: 10, fontSize: "0.9rem", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                    ⚠ {error}
                </div>
            )}

            {/* ── Loading ────────────────────────────────────────────── */}
            {selectedPatient && (loadingRecords || loadingAi) && (
                <div style={{ ...card, textAlign: "center", padding: "56px 20px" }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
                        background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem",
                        boxShadow: "0 0 30px rgba(59,130,246,0.2)"
                    }}>🧠</div>
                    <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>
                        {loadingRecords ? "Fetching patient records…" : "AI is analyzing the full clinical history…"}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                        {loadingAi && `Analyzing ${records.length} medical record${records.length !== 1 ? "s" : ""} for ${selectedName}`}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: 8, height: 8, borderRadius: "50%", background: "#3b82f6",
                                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                            }} />
                        ))}
                    </div>
                    <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
                </div>
            )}

            {/* ── AI Results ─────────────────────────────────────────── */}
            {selectedPatient && !loadingRecords && !loadingAi && ai && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-up">

                    {/* Disclaimer */}
                    <div style={{ padding: "10px 16px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 10, fontSize: "0.82rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1rem" }}>ℹ️</span>
                        AI-generated clinical brief based on {records.length} record{records.length !== 1 ? "s" : ""} for <strong style={{ color: "#fff" }}>{selectedName}</strong>. Always cross-reference with raw clinical data.
                    </div>

                    {/* ── Clinical Brief + Score Row ─────────────────── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "stretch" }}>

                        {/* Clinical Brief */}
                        <div style={{ ...card, background: "rgba(59,130,246,0.07)", borderColor: "rgba(59,130,246,0.2)" }}>
                            <div style={sectionTitle("#93c5fd")}>
                                <span>📋</span> Clinical Brief for Treating Doctor
                            </div>
                            <p style={{ fontSize: "1rem", color: "#e2e8f0", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
                                {ai.clinicalBrief}
                            </p>
                            {ai.chronicConditions?.length > 0 && (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                                    {ai.chronicConditions.map((c, i) => (
                                        <span key={i} style={{
                                            padding: "5px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700,
                                            background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)", color: "#fde047"
                                        }}>⚕ {c}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Health Score */}
                        <div style={{ ...card, textAlign: "center", minWidth: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            <div style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Vitality Score</div>
                            <div style={{ position: "relative", width: 110, height: 110 }}>
                                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.9" fill="none"
                                        stroke={SCORE_COLOR(ai.healthScore)} strokeWidth="3"
                                        strokeDasharray={`${ai.healthScore} ${100 - ai.healthScore}`}
                                        strokeLinecap="round" style={{ transition: "stroke-dasharray 1.2s ease" }}
                                    />
                                </svg>
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: "1.8rem", fontWeight: 900, color: SCORE_COLOR(ai.healthScore), lineHeight: 1 }}>{ai.healthScore}</span>
                                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>/ 100</span>
                                </div>
                            </div>
                            <div style={{
                                padding: "5px 14px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 800,
                                background: ai.riskLevel === "high" ? "rgba(239,68,68,0.15)" : ai.riskLevel === "medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                                border: `1px solid ${ai.riskLevel === "high" ? "rgba(239,68,68,0.3)" : ai.riskLevel === "medium" ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)"}`,
                                color: RISK_COLOR(ai.riskLevel), letterSpacing: "0.06em", textTransform: "uppercase"
                            }}>
                                {ai.riskLevel === "high" ? "⚠ HIGH RISK" : ai.riskLevel === "medium" ? "~ MODERATE" : "✓ LOW RISK"}
                            </div>
                        </div>
                    </div>

                    {/* ── Surgeries ──────────────────────────────────── */}
                    {ai.surgeries?.length > 0 && (
                        <div style={{ ...card, borderColor: "rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.07)" }}>
                            <div style={sectionTitle("#c084fc")}>
                                <span>🔪</span> Surgical & Major Procedure History ({ai.surgeries.length})
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                {ai.surgeries.map((s, i) => (
                                    <div key={i} style={{
                                        padding: "18px 20px", borderRadius: 12,
                                        background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                                            <div style={{ fontWeight: 800, color: "#e9d5ff", fontSize: "0.95rem" }}>🔪 {s.name}</div>
                                            <SeverityBadge tag="surgical" />
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                                            📅 {s.date}  ·  🏥 {s.hospital || "Unknown Hospital"}
                                        </div>
                                        {s.notes && (
                                            <div style={{ fontSize: "0.85rem", color: "#c4b5fd", lineHeight: 1.6, marginTop: 8, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                                                {s.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Tab Navigation ─────────────────────────────── */}
                    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 6, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                        {([
                            { id: "overview", label: "📊 Overview", desc: "Key findings & risks" },
                            { id: "records", label: `📋 Ranked Records (${ai.rankedRecords?.length ?? 0})`, desc: "By importance" },
                            { id: "treatments", label: "💊 Treatments", desc: "Top clinical treatments" },
                            { id: "timeline", label: "📅 Timeline", desc: "Chronological history" },
                        ] as const).map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                flex: 1, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                                background: activeTab === tab.id ? "rgba(59,130,246,0.25)" : "transparent",
                                color: activeTab === tab.id ? "#93c5fd" : "rgba(255,255,255,0.45)",
                                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "0.82rem",
                                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                                transition: "all 0.18s ease"
                            }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab: Overview ──────────────────────────────── */}
                    {activeTab === "overview" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {/* Essential Findings */}
                            {ai.essentialFindings?.length > 0 && (
                                <div style={card}>
                                    <div style={sectionTitle("#34d399")}>
                                        <span>🔍</span> Essential Clinical Findings
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {ai.essentialFindings.map((f, i) => (
                                            <div key={i} style={{
                                                display: "flex", gap: 12, alignItems: "flex-start",
                                                padding: "12px 16px", background: "rgba(255,255,255,0.03)",
                                                borderRadius: 10, border: "1px solid rgba(52,211,153,0.15)"
                                            }}>
                                                <span style={{ color: "#34d399", fontSize: "0.85rem", flexShrink: 0, marginTop: 1 }}>✦</span>
                                                <span style={{ fontSize: "0.9rem", color: "#e2e8f0", lineHeight: 1.6, fontWeight: 500 }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Predictive Risk + Meds */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                {/* Predictive Risks */}
                                {ai.predictiveRisks && (
                                    <div style={card}>
                                        <div style={sectionTitle("#f43f5e")}>
                                            <span>📈</span> Predictive Health Risks
                                        </div>
                                        <div style={{ padding: "12px 14px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.18)", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", color: "#fda4af", lineHeight: 1.6 }}>
                                            {ai.predictiveRisks.riskContext}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <RiskBar label="Diabetes" value={ai.predictiveRisks.diabetes} />
                                            <RiskBar label="Cardiac Issues" value={ai.predictiveRisks.cardiac} />
                                            <RiskBar label="Kidney Disease" value={ai.predictiveRisks.kidney} />
                                        </div>
                                    </div>
                                )}

                                {/* High-Freq Medications */}
                                {ai.topMeds?.length > 0 && (
                                    <div style={card}>
                                        <div style={sectionTitle("#60a5fa")}>
                                            <span>💊</span> High-Frequency Medications
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                            {ai.topMeds.map(([med, count], i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "#60a5fa", flexShrink: 0 }}>
                                                        {i + 1}
                                                    </div>
                                                    <div style={{ flex: 1, fontSize: "0.88rem", color: "#e2e8f0", fontWeight: 500, textTransform: "capitalize" }}>{med}</div>
                                                    <div style={{ width: 80, height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                                                        <div style={{ height: "100%", width: `${Math.min(100, count * 30)}%`, background: "#3b82f6", borderRadius: 4 }} />
                                                    </div>
                                                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontWeight: 600, width: 32, textAlign: "right" }}>{count}×</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Doctor Recommendations */}
                            {ai.suggestions?.length > 0 && (
                                <div style={{ ...card, borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.04)" }}>
                                    <div style={sectionTitle("#4ade80")}>
                                        <span>✅</span> Clinical Recommendations for Treating Doctor
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                                        {ai.suggestions.map((s, i) => (
                                            <div key={i} style={{
                                                display: "flex", gap: 12, alignItems: "flex-start",
                                                padding: "14px 16px", background: "rgba(34,197,94,0.06)",
                                                borderRadius: 10, border: "1px solid rgba(34,197,94,0.15)"
                                            }}>
                                                <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, fontSize: "0.9rem" }}>→</span>
                                                <span style={{ fontSize: "0.88rem", color: "#d1fae5", lineHeight: 1.6 }}>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Ranked Records ─────────────────────────── */}
                    {activeTab === "records" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                                Records are sorted from most clinically important (score 10) to routine (score 1) by AI.
                            </div>
                            {ai.rankedRecords?.map((rec, i) => {
                                const cfg = SEVERITY_CONFIG[rec.severityTag] || SEVERITY_CONFIG.routine;
                                const expanded = expandedRecord === rec.recordId;
                                return (
                                    <div key={rec.recordId} style={{
                                        ...card, cursor: "pointer",
                                        borderColor: expanded ? cfg.border : "rgba(255,255,255,0.07)",
                                        background: expanded ? cfg.bg : "rgba(255,255,255,0.03)",
                                        transition: "all 0.2s ease"
                                    }} onClick={() => setExpandedRecord(expanded ? null : rec.recordId)}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                            {/* Rank Badge */}
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                                background: rec.importanceScore >= 8 ? "rgba(239,68,68,0.2)" : rec.importanceScore >= 5 ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.1)",
                                                border: `1px solid ${rec.importanceScore >= 8 ? "rgba(239,68,68,0.3)" : rec.importanceScore >= 5 ? "rgba(234,179,8,0.25)" : "rgba(34,197,94,0.2)"}`,
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>#{i + 1}</span>
                                                <span style={{ fontSize: "1rem", fontWeight: 900, color: rec.importanceScore >= 8 ? "#f87171" : rec.importanceScore >= 5 ? "#fbbf24" : "#4ade80" }}>
                                                    {rec.importanceScore}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{rec.diagnosis}</div>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        <SeverityBadge tag={rec.severityTag} />
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>
                                                    📅 {new Date(rec.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                    &nbsp;&nbsp;·&nbsp;&nbsp;🏥 {rec.hospital}
                                                </div>
                                                <div style={{ fontSize: "0.82rem", color: cfg.color, fontStyle: "italic", opacity: 0.85 }}>
                                                    {rec.importanceReason}
                                                </div>
                                            </div>

                                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", flexShrink: 0, marginTop: 4 }}>
                                                {expanded ? "▲" : "▼"}
                                            </div>
                                        </div>

                                        {/* Expanded */}
                                        {expanded && rec.prescription && (
                                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                                                    Prescription / Treatment Plan
                                                </div>
                                                <div style={{ fontSize: "0.88rem", color: "#e2e8f0", lineHeight: 1.7, background: "rgba(255,255,255,0.04)", padding: "12px 16px", borderRadius: 10 }}>
                                                    {rec.prescription}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Tab: Important Treatments ───────────────────── */}
                    {activeTab === "treatments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {ai.importantTreatments?.length > 0 ? ai.importantTreatments.map((t) => {
                                const cfg = SEVERITY_CONFIG[t.severity] || SEVERITY_CONFIG.routine;
                                return (
                                    <div key={t.rank} style={{
                                        ...card,
                                        borderLeft: `4px solid ${cfg.dot}`,
                                        borderColor: cfg.border,
                                        background: cfg.bg
                                    }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                background: cfg.bg, border: `1px solid ${cfg.border}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontWeight: 900, fontSize: "0.95rem", color: cfg.color
                                            }}>#{t.rank}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                                                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff" }}>{t.treatment}</div>
                                                    <SeverityBadge tag={t.severity} />
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>📅 {t.date}</div>
                                                <div style={{ fontSize: "0.88rem", color: cfg.color, lineHeight: 1.65, padding: "10px 14px", background: "rgba(0,0,0,0.15)", borderRadius: 8 }}>
                                                    <strong>Why important:</strong> {t.reason}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ ...card, textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.4)" }}>
                                    No significant treatments detected beyond routine care.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Treatment Timeline ─────────────────────── */}
                    {activeTab === "timeline" && (
                        <div style={card}>
                            <div style={sectionTitle("#a78bfa")}>
                                <span>📅</span> Chronological Treatment History
                            </div>
                            {ai.treatmentHistory?.length > 0 ? (
                                <div style={{ position: "relative", paddingLeft: 28 }}>
                                    <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.08)" }} />
                                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                                        {ai.treatmentHistory.map((th, i) => (
                                            <div key={i} style={{ position: "relative" }}>
                                                <div style={{
                                                    position: "absolute", left: -28, top: 4, width: 16, height: 16,
                                                    borderRadius: "50%", background: th.isSurgery ? "#a855f7" : "#3b82f6",
                                                    border: "2px solid #0f172a", boxShadow: `0 0 8px ${th.isSurgery ? "#a855f7" : "#3b82f6"}55`
                                                }} />
                                                <div style={{ fontSize: "0.78rem", color: th.isSurgery ? "#c084fc" : "#60a5fa", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {th.isSurgery ? "🔪 Surgery · " : ""}{th.date}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", marginBottom: 8 }}>{th.treatment}</div>
                                                {th.medicines?.length > 0 && (
                                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                        {th.medicines.map((m, mi) => (
                                                            <span key={mi} style={{
                                                                padding: "4px 10px", borderRadius: 6,
                                                                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                                                                color: "#93c5fd", fontSize: "0.75rem", fontWeight: 600
                                                            }}>💊 {m}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>No treatment timeline data available.</p>
                            )}
                        </div>
                    )}

                </div>
            )}

            {/* ── Empty state ───────────────────────────────────────── */}
            {!selectedPatient && !loadingPatients && (
                <div style={{ ...card, textAlign: "center", padding: "56px 20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧠</div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>Select a Patient to Begin AI Analysis</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", maxWidth: 400, margin: "0 auto" }}>
                        AI will analyze the complete medical history and generate a clinical intelligence report including surgeries, ranked records, and treatment recommendations.
                    </div>
                </div>
            )}
        </div>
    );
}
