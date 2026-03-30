import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
    try {
        const prompt = `
You are a healthcare insurance expert specializing in Indian health insurance and government health schemes.

List all major Indian health insurance schemes — both government-sponsored and popular private health insurance plans — that are currently available to patients and citizens.

For each scheme, provide detailed and accurate information.

Return ONLY valid JSON matching this schema exactly. NO markdown, NO backticks, NO explanation outside JSON.

{
  "schemes": [
    {
      "name": string,             // Full official name of the scheme
      "shortName": string,        // Short/popular name or abbreviation (e.g., "PMJAY", "CGHS")
      "type": "government" | "private",
      "category": "central" | "state" | "private",
      "description": string,      // 2-3 sentence summary of what the scheme covers
      "coverage": string,         // Coverage amount e.g., "₹5 Lakh per family per year"
      "eligibility": string,      // Who is eligible in 1-2 sentences
      "keyBenefits": string[],    // 3-5 key benefits as bullet points
      "officialWebsite": string,  // Official website URL (must be real and valid)
      "enrollmentUrl": string,    // Direct enrollment or info page URL
      "tags": string[]            // Tags like ["cashless", "family", "senior citizen", "surgery", "maternity"]
    }
  ]
}

Include at minimum these schemes:
1. Ayushman Bharat (PMJAY)
2. Central Government Health Scheme (CGHS)
3. Employees' State Insurance (ESI)
4. Pradhan Mantri Suraksha Bima Yojana (PMSBY)
5. Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)
6. Aam Aadmi Bima Yojana (AABY)
7. Rashtriya Swasthya Bima Yojana (RSBY)
8. Star Health Insurance
9. HDFC Ergo Health Insurance
10. ICICI Lombard Health Insurance
11. Bajaj Allianz Health Insurance
12. New India Assurance Health
13. Max Bupa Health Insurance
14. Niva Bupa (formerly Max Bupa)
15. Care Health Insurance (formerly Religare)
16. Tata AIG Health Insurance
17. SBI Health Insurance
18. ManipalCigna Health Insurance
19. Aditya Birla Health Insurance
20. United India Insurance

Include any other major schemes you know about. Aim for 20-30 total entries.
Ensure all URLs are real, working government or official company websites.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text || "{}";
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedText);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("AI Insurance API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch insurance schemes: " + error.message },
            { status: 500 }
        );
    }
}
