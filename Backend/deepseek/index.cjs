const { OpenAI } = require("openai");

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com"
});

async function generate(messages = []) {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error("DEEPSEEK_API_KEY não configurada.");
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
        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                systemMessage,
                ...messages
            ],
            temperature: 0.4,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Erro no DeepSeek:", error);
        throw new Error(`Falha no DeepSeek: ${error.message}`);
    }
}

module.exports = {
    generate
};
