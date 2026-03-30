"use client";

import { useState, useEffect } from "react";
import { 
    LuInfo, 
    LuShieldAlert, 
    LuActivity, 
    LuStethoscope, 
    LuPill, 
    LuLightbulb, 
    LuCheck,
    LuLoader,
    LuCalendar,
    LuChevronRight
} from "react-icons/lu";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    hospital: { id: number; hospitalName: string };
}

interface Props { records: MedicalRecord[]; }

const RISK_STYLE: Record<string, { bg: string, border: string, color: string, label: string }> = {
    high: { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", label: "HIGH RISK" },
    medium: { bg: "#fefce8", border: "#fde047", color: "#a16207", label: "MODERATE" },
    low: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "LOW RISK" },
};

const SCORE_COLOR = (s: number) => s >= 75 ? "#16a34a" : s >= 50 ? "#ca8a04" : "#dc2626";

export default function AIInsights({ records }: Props) {
    const [ai, setAi] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        if (!records || records.length === 0) { setAi(null); return; }
        let isMounted = true;
        setLoadingAi(true);
        fetch("/api/analyze-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        })
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    setAi(data);
                    setLoadingAi(false);
                }
            })
            .catch(err => {
                console.error("AI Error:", err);
                if (isMounted) setLoadingAi(false);
            });

        return () => { isMounted = false; };
    }, [records]);

    const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", backdropFilter: "blur(12px)" };
    const headerStyle = { fontWeight: 700, fontSize: "0.95rem", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 };

    if (loadingAi) {
        return (
            <div className="glass-strong" style={{ padding: 40, textAlign: "center", background: "rgba(15, 23, 42, 0.8)", borderRadius: 12, color: "#ffffff" }}>
                <div style={{ marginBottom: 16 }}>
                    <LuLoader className="animate-spin" size={32} style={{ margin: "0 auto", color: "#60a5fa" }} />
                </div>
                Generating personalized insights...
            </div>
        );
    }

    if (!ai) return null;

    const risk = RISK_STYLE[ai.riskLevel] || RISK_STYLE.low;

    return (
        <div className="glass-strong" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "32px", background: "rgba(0, 0, 0, 1)" }}>
            {/* AI disclaimer */}
            <div style={{ background: "rgba(255, 255, 255, 1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 8, padding: "12px 16px", fontSize: "0.85rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: 12 }}>
                <LuInfo size={20} />
                AI insights are derived from your medical record history by AI. Not a substitute for professional medical advice.
            </div>

            {/* Top row: Health Score + Risk Level */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Health Score */}
                <div style={{ ...cardStyle, textAlign: "center",backgroundColor:"#1e1e1eff" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>Health Score</div>
                    <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 12px" }}>
                        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke={SCORE_COLOR(ai.healthScore)} strokeWidth="3"
                                strokeDasharray={`${ai.healthScore} ${100 - ai.healthScore}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "1.6rem", fontWeight: 800, color: SCORE_COLOR(ai.healthScore) }}>{ai.healthScore}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>out of 100</div>
                </div>

                {/* Risk Level */}
                <div style={{ ...cardStyle, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, background: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 1)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 1)" : "rgba(34, 197, 94, 1)", borderColor: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 0.2)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                    <LuShieldAlert size={32} color={risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80"} />
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", color: risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80", letterSpacing: "0.05em" }}>{risk.label}</div>
                    <div style={{ fontSize: "0.85rem", color: risk.color === "#b91c1c" ? "#fca5a5" : risk.color === "#a16207" ? "#fde047" : "#86efac", textAlign: "center", opacity: 0.9, fontWeight: 500 }}>
                        Based on {records.length} medical record{records.length !== 1 ? "s" : ""}
                    </div>
                </div>
            </div>

            {/* Predictive Health Risks */}
            {ai.predictiveRisks && (
                <div style={cardStyle}>
                    <h4 style={headerStyle}>
                        <LuActivity size={20} color="#f43f5e" />
                        <span>Predictive Health Risks</span>
                    </h4>

                    <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(244, 63, 94, 1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: 8, color: "#fda4af", fontSize: "0.9rem", lineHeight: 1.5 }}>
                        <strong>AI Prediction:</strong> {ai.predictiveRisks.riskContext}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 20 }}>
                        {/* Diabetes Risk */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>
                                <span>Diabetes</span>
                                <span style={{ color: ai.predictiveRisks.diabetes > 50 ? "#f43f5e" : "#fbbf24" }}>{ai.predictiveRisks.diabetes}%</span>
                            </div>
                            <div style={{ height: 8, background: "rgba(255,255,255,1)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${ai.predictiveRisks.diabetes}%`, background: ai.predictiveRisks.diabetes > 50 ? "#f43f5e" : "#fbbf24", borderRadius: 4, transition: "width 1s ease-in-out" }} />
                            </div>
                        </div>

                        {/* Cardiac Risk */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>
                                <span>Cardiac Issues</span>
                                <span style={{ color: ai.predictiveRisks.cardiac > 50 ? "#f43f5e" : "#fbbf24" }}>{ai.predictiveRisks.cardiac}%</span>
                            </div>
                            <div style={{ height: 8, background: "rgba(255,255,255,1)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${ai.predictiveRisks.cardiac}%`, background: ai.predictiveRisks.cardiac > 50 ? "#f43f5e" : "#fbbf24", borderRadius: 4, transition: "width 1s ease-in-out" }} />
                            </div>
                        </div>

                        {/* Kidney Risk */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>
                                <span>Kidney Issues</span>
                                <span style={{ color: ai.predictiveRisks.kidney > 50 ? "#f43f5e" : "#fbbf24" }}>{ai.predictiveRisks.kidney}%</span>
                            </div>
                            <div style={{ height: 8, background: "rgba(255,255,255,1)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${ai.predictiveRisks.kidney}%`, background: ai.predictiveRisks.kidney > 50 ? "#f43f5e" : "#fbbf24", borderRadius: 4, transition: "width 1s ease-in-out" }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chronic Conditions */}
            <div style={cardStyle}>
                <h4 style={headerStyle}>
                    <LuStethoscope size={20} color="#60a5fa" />
                    <span>Chronic Conditions Detected</span>
                </h4>
                {!ai.chronicConditions || ai.chronicConditions.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>No chronic conditions detected in your records.</p>
                ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {ai.chronicConditions.map((c: string) => (
                            <span key={c} style={{ padding: "6px 16px", borderRadius: 6, background: "rgba(234, 179, 8, 1)", border: "1px solid rgba(234, 179, 8, 0.2)", color: "#facc15", fontSize: "0.85rem", fontWeight: 700, textTransform: "capitalize" }}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Medication Patterns */}
            {ai.topMeds && ai.topMeds.length > 0 && (
                <div style={cardStyle}>
                    <h4 style={headerStyle}>
                        <LuPill size={20} color="#60a5fa" />
                        <span>Medication Pattern Analysis</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {ai.topMeds.map(([med, count]: [string, number]) => (
                            <div key={med} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ flex: 1, fontSize: "0.9rem", color: "#e2e8f0", fontWeight: 500, textTransform: "capitalize" }}>{med}</div>
                                <div style={{ width: 140, height: 8, background: "rgba(255,255,255,1)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, count * 33)}%`, background: "#3b82f6", borderRadius: 4 }} />
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", width: 40, textAlign: "right", fontWeight: 600 }}>{count}×</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Health Suggestions */}
            <div style={cardStyle}>
                <h4 style={headerStyle}>
                    <LuLightbulb size={20} color="#60a5fa" />
                    <span>Health Improvement Suggestions</span>
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {ai.suggestions && ai.suggestions.map((s: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
                            <span style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }}>
                                <LuChevronRight size={16} />
                            </span>
                            <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontWeight: 500 }}>{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Essential Findings */}
            {ai.essentialFindings?.length > 0 && (
                <div style={cardStyle}>
                    <h4 style={headerStyle}>
                        <LuCheck size={20} color="#34d399" />
                        <span>Key Health Findings</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {ai.essentialFindings.map((f: string, i: number) => (
                            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <span style={{ color: "#34d399", flexShrink: 0, marginTop: 2 }}>
                                    <LuCheck size={16} />
                                </span>
                                <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontWeight: 500 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Treatment History Timeline */}
            {ai.treatmentHistory?.length > 0 && (
                <div style={cardStyle}>
                    <h4 style={headerStyle}>
                        <LuCalendar size={20} color="#a78bfa" />
                        <span>Treatment & Medication Timeline</span>
                    </h4>
                    <div style={{ position: "relative", paddingLeft: 16 }}>
                        <div style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, background: "rgba(255,255,255,1)" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            {ai.treatmentHistory.map((th: any, i: number) => (
                                <div key={i} style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: -21, top: 2, width: 12, height: 12, borderRadius: "50%", background: "#a78bfa", border: "2px solid #1e1e2d" }} />
                                    <div style={{ fontSize: "0.82rem", color: "#a78bfa", fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{th.date}</div>
                                    <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 600, marginBottom: 8 }}>{th.treatment}</div>
                                    {th.medicines?.length > 0 && (
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {th.medicines.map((m: string, mi: number) => (
                                                <span key={mi} style={{ padding: "4px 10px", borderRadius: 4, background: "rgba(59,130,246,1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: "0.75rem", fontWeight: 600 }}>
                                                    💊 {m}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkup Reminder */}
            <div style={{ background: "rgba(34, 197, 94, 1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ padding: "10px", background: "rgba(34, 197, 94, 0.2)", borderRadius: "50%", color: "#ffffffff" }}>
                    <LuCalendar size={24} />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fcfcfcff", marginBottom: 4 }}>Preventive Checkup Reminder</div>
                    <div style={{ fontSize: "0.85rem", color: "#ffffffff", fontWeight: 500 }}>
                        Schedule a full-body checkup at least once per year. Stay ahead of preventable conditions.
                    </div>
                </div>
            </div>
        </div>
    );
}
