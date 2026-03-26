"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import { LuUserPlus, LuFileUp, LuCheck, LuX } from "react-icons/lu";

type ApprovedPatient = {
    id: number;
    fullName: string;
    phone: string;
    gender: string;
    grantedAt: string;
};

export default function UploadRecordForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [loading, setLoading] = useState(true);

    const [patientId, setPatientId] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [prescription, setPrescription] = useState("");
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error" | "">("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadPatients() {
            try {
                const res = await api.get("/hospitals/patients");
                setPatients(res.data);
            } catch (err) {
                console.error("Failed to load authorized patients", err);
            } finally {
                setLoading(false);
            }
        }
        loadPatients();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!patientId || !diagnosis || !visitDate) {
            setMsg("Please fill all required fields.");
            setMsgType("error");
            return;
        }

        setSubmitting(true);
        setMsg("");

        const formData = new FormData();
        formData.append("patientId", patientId);
        formData.append("diagnosis", diagnosis);
        formData.append("prescription", prescription);
        formData.append("visitDate", visitDate);
        if (file) formData.append("report", file);

        try {
            await api.post("/medical-records/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsg("Record uploaded successfully! Updating history...");
            setMsgType("success");
            setTimeout(onUploadSuccess, 1500);
        } catch (err: any) {
            setMsg(err.response?.data?.message || "Failed to upload record. Please ensure patient access is still valid.");
            setMsgType("error");
        } finally {
            setSubmitting(false);
        }
    }

    const resetFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (loading) return (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p>Gathering your patient directory...</p>
        </div>
    );

    return (
        <div className="animate-fade-up" style={{
            maxWidth: 1000, margin: "0 auto", padding: "40px",
            background: "rgba(15, 23, 42, 0.4)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(12px)"
        }}>
            {patients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ width: 80, height: 80, background: "rgba(59,130,246,0.1)", color: "#3b82f6", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <LuUserPlus size={40} />
                    </div>
                    <h3 style={{ fontSize: "1.25rem", color: "#f1f5f9", fontWeight: 700, marginBottom: 12 }}>No Authorized Patients Found</h3>
                    <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
                        You cannot upload records yet. Please search for a patient and request access from their portal first.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>

                        {/* LEFT COLUMN: Patient & Visit */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Select Patient *</label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={patientId}
                                        onChange={e => setPatientId(e.target.value)}
                                        style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: "0.95rem", pointerEvents: submitting ? "none" : "auto", outline: "none", appearance: "none" }}
                                        required
                                    >
                                        <option value="" disabled style={{ background: "#1e293b" }}>-- Select authorized patient --</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id} style={{ background: "#1e293b" }}>
                                                {p.fullName} ({p.phone})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#475569" }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Visit Date *</label>
                                <input
                                    type="date"
                                    value={visitDate}
                                    onChange={e => setVisitDate(e.target.value)}
                                    style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: "0.95rem", colorScheme: "dark", outline: "none" }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Primary Diagnosis *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acute Respiratory Infection"
                                    value={diagnosis}
                                    onChange={e => setDiagnosis(e.target.value)}
                                    style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: "0.95rem", outline: "none" }}
                                    required
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Prescription & File */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Prescription & Treatment</label>
                                <textarea
                                    placeholder="Medications, dosage, and next steps..."
                                    value={prescription}
                                    onChange={e => setPrescription(e.target.value)}
                                    style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: "0.95rem", minHeight: 126, resize: "none", outline: "none" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Report Attachment</label>
                                <div
                                    onClick={() => !file && fileInputRef.current?.click()}
                                    style={{
                                        position: "relative",
                                        border: `2px dashed ${file ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: 16,
                                        padding: "24px 20px",
                                        textAlign: "center",
                                        background: file ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.01)",
                                        cursor: file ? "default" : "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf,.png,.jpeg,.jpg"
                                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                        style={{ display: "none" }}
                                    />

                                    {!file ? (
                                        <>
                                            <div style={{ color: "#3b82f6", marginBottom: 12 }}>
                                                <LuFileUp size={32} />
                                            </div>
                                            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.95rem" }}>Click to select a file</div>
                                            <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 4 }}>PDF, PNG or JPG (Max 5MB)</div>
                                        </>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <LuFileUp size={20} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={resetFile}
                                                style={{ padding: 8, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", borderRadius: 8, cursor: "pointer" }}
                                            >
                                                <LuX size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {msg && (
                        <div style={{
                            marginTop: 32, padding: "14px 18px", borderRadius: 12, fontSize: "0.95rem", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 12,
                            background: msgType === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            color: msgType === "error" ? "#f87171" : "#34d399",
                            border: `1px solid ${msgType === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`
                        }}>
                            {msgType === "error" ? <LuX size={20} /> : <LuCheck size={20} />}
                            {msg}
                        </div>
                    )}

                    <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={submitting} className="btn-primary" style={{
                            padding: "16px 48px", fontSize: "1rem", fontWeight: 700,
                            minWidth: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                            borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)",
                            border: "none", cursor: "pointer", transition: "all 0.2s ease"
                        }}>
                            {submitting ? (
                                <>
                                    <div className="spinner-small" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <LuFileUp size={20} />
                                    <span>Submit Document</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
