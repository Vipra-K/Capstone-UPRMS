import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { records } = body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "AI API KEY is not defined in environment" }, { status: 500 });
        }

        if (!records || !Array.isArray(records)) {
            return NextResponse.json({ error: "Invalid records provided" }, { status: 400 });
        }

        if (records.length === 0) {
            return NextResponse.json({
                clinicalBrief: "No medical records available.",
                healthScore: 100,
                riskLevel: "low",
                chronicConditions: [],
                surgeries: [],
                importantTreatments: [],
                rankedRecords: [],
                topMeds: [],
                suggestions: ["Upload records to analyze."],
                treatmentHistory: [],
                essentialFindings: [],
                predictiveRisks: { diabetes: 0, cardiac: 0, kidney: 0, riskContext: "No data." }
            });
        }

        const prompt = `
You are a senior clinical AI assistant. Analyze these medical records, focusing on BOTH "diagnosis" and "prescription" fields. 
Return a RAW VALID JSON summary. 
NO markdown, NO backticks.

Schema:
{
  "clinicalBrief": string,
  "healthScore": number,
  "riskLevel": "high" | "medium" | "low",
  "chronicConditions": string[],
  "surgeries": [{ "name": string, "date": string, "hospital": string, "notes": string }],
  "importantTreatments": [{ "rank": number, "treatment": string, "date": string, "reason": string, "severity": string }],
  "rankedRecords": [{ "recordId": number, "visitDate": string, "diagnosis": string, "hospital": string, "importanceScore": number, "importanceReason": string, "severityTag": string, "prescription": string }],
  "topMeds": [[string, number]],
  "prescriptionInsights": [{ "medication": string, "dosage": string, "frequency": string, "purpose": string, "possibleSideEffects": string }],
  "essentialFindings": string[],
  "suggestions": string[],
  "treatmentHistory": [{ "date": string, "treatment": string, "medicines": string[], "isSurgery": boolean }],
  "predictiveRisks": { "diabetes": number, "cardiac": number, "kidney": number, "riskContext": string }
}

Records:
${JSON.stringify(records, null, 2)}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error("AI API Error:", result);
            throw new Error(result.error?.message || "AI API failure");
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        let data;
        try {
            data = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI JSON:", cleanedText);
            throw new Error("Invalid AI response format");
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Direct API Error:", error);
        return NextResponse.json({ 
            error: "Clinical analysis failed", 
            message: error.message 
        }, { status: 500 });
    }
}
