"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface LogEntry {
    id: number;
    doctorId: number;
    patientId: number;
    action: string;
    detail: string | null;
    createdAt: string;
    isOutsideWorkHours: boolean;
    patient?: { fullName: string };
}

const ACTION_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
    VIEW_RECORDS: { icon: "👁", color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
    DOWNLOAD_REPORT: { icon: "⬇", color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
    VIEW_AI_SUMMARY: { icon: "🤖", color: "#a78bfa", bg: "rgba(139,92,246,0.1)" },
};

export default function DoctorActivityLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/doctors/activity-log")
            .then(r => setLogs(r.data))
            .catch(() => setErr("Failed to load activity log."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 20, color: "var(--text-secondary)" }}>Loading activity log…</div>;
    if (err) return <div style={{ padding: 20, color: "#fca5a5" }}>⚠ {err}</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Your Activity Log</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{logs.length} actions recorded</div>
            </div>

            {logs.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>📋</div>
                    No activity recorded yet. Your record views will appear here.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 180px", gap: 12, padding: "10px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>
                        <div>Timestamp</div>
                        <div>Patient</div>
                        <div>Action</div>
                        <div>Detail</div>
                    </div>
                    {logs.map(log => {
                        const style = ACTION_STYLE[log.action] || { icon: "📌", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
                        const rowBg = log.isOutsideWorkHours ? "rgba(245,158,11,0.07)" : "transparent";
                        const rowBorder = log.isOutsideWorkHours ? "1px solid rgba(245,158,11,0.2)" : "none";
                        return (
                            <div key={log.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 180px", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: rowBorder, alignItems: "center", background: rowBg, transition: "background 0.15s" }}
                                onMouseOver={e => !log.isOutsideWorkHours && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                onMouseOut={e => (e.currentTarget.style.background = rowBg)}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                                    {log.isOutsideWorkHours && <span title="Access outside working hours" style={{ fontSize: "0.85rem" }}>⚠️</span>}
                                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div style={{ fontSize: "0.88rem", color: "#e2e8f0", fontWeight: 500 }}>
                                    {log.patient?.fullName || `Patient #${log.patientId}`}
                                </div>
                                <div>
                                    <span style={{ padding: "3px 12px", borderRadius: 20, background: style.bg, color: style.color, fontSize: "0.78rem", fontWeight: 700 }}>
                                        {style.icon} {log.action.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {log.detail || "—"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ padding: "12px 16px", background: "rgba(59,130,246,0.05)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.1)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                🔐 This audit trail is maintained for compliance and security purposes. All record views are automatically logged.
            </div>
        </div>
    );
}
