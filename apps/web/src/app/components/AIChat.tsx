import { useState } from "react";
import { Card } from "./ui/card";
import { Bot, PanelLeftClose, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { enviarMensagemIA, type AIChatApiMessage, type AIChatRole } from "../data/aiChatApi";

interface AIChatProps {
  setAiChatOpen: (open: boolean) => void;
  isMobile?: boolean;
}

type ChatMessage = {
  sender: "ai" | "user";
  text: string;
  includeInContext?: boolean;
};

const initialMessages: ChatMessage[] = [
  {
    sender: "ai",
    text: "Olá. Sou seu Agente IA. Como posso ajudar hoje?",
    includeInContext: false,
  },
];

export default function AIChat({ setAiChatOpen, isMobile = false }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) {
      return;
    }

    const userMessage: ChatMessage = { sender: "user", text: trimmedInput };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const contextMessages: AIChatApiMessage[] = nextMessages
        .filter((message) => message.includeInContext !== false)
        .map((message) => ({
          role: (message.sender === "ai" ? "assistant" : "user") as AIChatRole,
          content: message.text,
        }));

      const { reply } = await enviarMensagemIA(contextMessages);
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "Nao foi possivel obter resposta da IA no momento.";
      setMessages((prev) => [...prev, { sender: "ai", text: fallbackMessage }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`${isMobile ? 'h-full' : 'h-[80vh]'} flex flex-col p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="font-semibold text-lg text-gray-900">Agente IA</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setAiChatOpen(false)} className="h-8 w-8 text-gray-500 hover:text-gray-800" title="Minimizar painel">
          <PanelLeftClose className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-2 bg-gray-50 rounded-lg">
        {messages.map((message, index) => (
          <div key={`${message.sender}-${index}`} className={`flex ${message.sender === "ai" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${message.sender === "ai" ? "bg-blue-100 text-blue-900" : "bg-white shadow-sm"}`}>
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-xs px-3 py-2 rounded-lg bg-blue-100 text-blue-900">
              <p className="text-sm">Digitando...</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Pergunte algo..."
          disabled={isSending}
        />
        <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700 flex-shrink-0" disabled={isSending}>
          <Send size={20} />
        </Button>
      </div>
    </Card>
  );
}