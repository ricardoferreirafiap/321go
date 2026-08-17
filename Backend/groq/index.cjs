const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generate(messages = []) {

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

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            systemMessage,
            ...messages
        ],
        temperature: 0.4,
    });

    return response.choices[0].message.content;
}

module.exports = {
    generate
};