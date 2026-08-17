const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

async function generate(messages = []) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não configurada.");
    }

    const systemMessage = {
        role: "system",
        content: `
Você é o Agente IA do PortalWeb.

Regras:
- Responda sempre em português do Brasil.
- Nunca responda em inglês.
- Seja objetivo, profissional e amigável.
- Ajude com produtividade, atendimento comercial, vendas e suporte.
`
    };

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                systemMessage,
                ...messages
            ],
            temperature: 0.4,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Erro no OpenAI:", error);
        throw new Error(`Falha no OpenAI: ${error.message}`);
    }
}

module.exports = {
    generate
};