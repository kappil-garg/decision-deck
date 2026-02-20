import { GoogleGenAI, Type } from "@google/genai";

const footer = document.getElementById('app-footer');
const footerLink = document.getElementById('footer-link');
if (footer && footerLink) {
  const url = import.meta.env.FOOTER_URL?.trim() || '';
  if (url) {
    footerLink.href = url;
    footerLink.textContent = import.meta.env.FOOTER_LABEL?.trim() || 'Kapil Garg';
  } else {
    footer.remove();
  }
}

const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('results');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMsg = document.getElementById('errorMsg');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

async function callGeminiAPI(decision, options, constraints) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Add GEMINI_API_KEY to your environment.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
        Analyze the following decision:
        Decision: ${decision}
        Options: ${options || 'Not specified'}
        Constraints: ${constraints || 'None'}

        Provide a structured analysis in JSON format.
        Include:
        1. prosCons: { pros: string[], cons: string[] }
        2. comparisonTable: { headers: string[], rows: string[][] } (only if multiple options are provided)
        3. swot: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }
        4. recommendation: string (5-8 balanced sentences)
        5. confidence: "Low" | "Medium" | "High"

        Be objective, realistic, and acknowledge uncertainty.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prosCons: {
                            type: Type.OBJECT,
                            properties: {
                                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                                cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["pros", "cons"]
                        },
                        comparisonTable: {
                            type: Type.OBJECT,
                            properties: {
                                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
                            }
                        },
                        swot: {
                            type: Type.OBJECT,
                            properties: {
                                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["strengths", "weaknesses", "opportunities", "threats"]
                        },
                        recommendation: { type: Type.STRING },
                        confidence: { type: Type.STRING }
                    },
                    required: ["prosCons", "swot", "recommendation", "confidence"]
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateUI(data) {
    const prosList = document.getElementById('prosList');
    const consList = document.getElementById('consList');
    prosList.innerHTML = data.prosCons.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('');
    consList.innerHTML = data.prosCons.cons.map(c => `<li>${escapeHtml(c)}</li>`).join('');
    const tableContainer = document.getElementById('tableContainer');
    if (data.comparisonTable && data.comparisonTable.headers) {
        let tableHtml = '<table><thead><tr>';
        data.comparisonTable.headers.forEach(h => tableHtml += `<th>${escapeHtml(h)}</th>`);
        tableHtml += '</tr></thead><tbody>';
        data.comparisonTable.rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => tableHtml += `<td>${escapeHtml(cell)}</td>`);
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        tableContainer.innerHTML = tableHtml;
    } else {
        tableContainer.innerHTML = '<p class="text-muted">No comparison table available for this analysis.</p>';
    }
    document.getElementById('strengthsList').innerHTML = data.swot.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    document.getElementById('weaknessesList').innerHTML = data.swot.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('');
    document.getElementById('opportunitiesList').innerHTML = data.swot.opportunities.map(o => `<li>${escapeHtml(o)}</li>`).join('');
    document.getElementById('threatsList').innerHTML = data.swot.threats.map(t => `<li>${escapeHtml(t)}</li>`).join('');
    document.getElementById('recText').textContent = data.recommendation;
    const confBadge = document.getElementById('confidenceBadge');
    confBadge.textContent = `Confidence: ${data.confidence}`;
    confBadge.className = `confidence-badge conf-${String(data.confidence).toLowerCase()}`;
    resultsSection.style.display = 'block';
}

analyzeBtn.addEventListener('click', async () => {
    const decision = document.getElementById('decisionInput').value;
    const options = document.getElementById('optionsInput').value;
    const constraints = document.getElementById('constraintsInput').value;
    if (!decision) {
        alert("Please enter a decision to analyze.");
        return;
    }
    resultsSection.style.display = 'none';
    errorMsg.style.display = 'none';
    loadingSpinner.style.display = 'block';
    analyzeBtn.disabled = true;
    try {
        const data = await callGeminiAPI(decision, options, constraints);
        updateUI(data);
    } catch (error) {
        console.error("Analysis Error:", error);
        
        let friendlyMsg = "Failed to analyze decision.";
        if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
            friendlyMsg = "Invalid or missing API key. Add GEMINI_API_KEY to your environment or repository Secrets.";
        } else if (error.message?.includes("429")) {
            friendlyMsg = "Rate limit exceeded (Free Tier). Please wait a minute before trying again.";
        } else {
            friendlyMsg = `Error: ${error.message || "An unexpected error occurred."}`;
        }
        errorMsg.innerText = friendlyMsg;
        errorMsg.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});
