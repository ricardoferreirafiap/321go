const OpenAI = require("openai");

// Cloudflare Workers AI suporta formato compatível com OpenAI
// É necessário configurar CLOUDFLARE_ACCOUNT_ID no .env
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CLOUDFLARE_BASE_URL = process.env.CLOUDFLARE_BASE_URL || 
    (CLOUDFLARE_ACCOUNT_ID ? `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1` : null);

const cloudflare = CLOUDFLARE_BASE_URL ? new OpenAI({
    apiKey: process.env.CLOUDFLARE_API_KEY,
    baseURL: CLOUDFLARE_BASE_URL,
}) : null;

async function generate(messages = []) {
    if (!cloudflare) {
        throw new Error("CLOUDFLARE_ACCOUNT_ID não configurado. Defina CLOUDFLARE_ACCOUNT_ID no .env para usar Cloudflare AI.");
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
        const response = await cloudflare.chat.completions.create({
            model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            messages: [
                systemMessage,
                ...messages
            ],
            temperature: 0.4,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Erro no Cloudflare:", error);
        throw new Error(`Falha no Cloudflare: ${error.message}`);
    }
}

module.exports = {
    generate
};