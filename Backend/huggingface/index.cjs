const { HfInference } = require("@huggingface/inference");

const hf = process.env.HUGGINGFACE_API_KEY 
    ? new HfInference(process.env.HUGGINGFACE_API_KEY)
    : null;

if (!hf) {
    console.warn("HUGGINGFACE_API_KEY não encontrada. HuggingFace não estará disponível.");
}

async function generate(messages = []) {
    if (!hf) {
        throw new Error("HUGGINGFACE_API_KEY não configurada.");
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
        const prompt = messages
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");

        const response = await hf.textGeneration({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            inputs: prompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.4,
            }
        });

        return response.generated_text;
    } catch (error) {
        console.error("Erro no HuggingFace:", error);
        throw new Error(`Falha no HuggingFace: ${error.message}`);
    }
}

module.exports = {
    generate
};
