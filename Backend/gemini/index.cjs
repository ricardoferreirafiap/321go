const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY não encontrada. Gemini não estará disponível.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function generate(messages = []) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY não configurada.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = messages
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
}

module.exports = {
    generate
};