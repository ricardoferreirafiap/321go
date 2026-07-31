import { useState } from "react";
import {
  Calendar,
  Bot,
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface QuickAccessPanelProps {
  onOpenAgenda: () => void;
  onOpenAiChat: () => void;
  onOpenFavoritos: () => void;
  onOpenWhatsApp: () => void;
  agendaOpen: boolean;
  aiChatOpen: boolean;
  favoritosOpen: boolean;
  chatOpen: boolean;
}

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active: boolean;
  colorBase: string;
  colorActive: string;
}

export default function QuickAccessPanel({
  onOpenAgenda,
  onOpenAiChat,
  onOpenFavoritos,
  onOpenWhatsApp,
  agendaOpen,
  aiChatOpen,
  favoritosOpen,
  chatOpen,
}: QuickAccessPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const buttons: ActionButton[] = [
    {
      label: "Abrir Agenda",
      icon: <Calendar size={28} />,
      onClick: onOpenAgenda,
      active: agendaOpen,
      colorBase: "bg-indigo-500 hover:bg-indigo-600",
      colorActive: "bg-indigo-700 hover:bg-indigo-800",
    },
    {
      label: "Agente IA",
      icon: <Bot size={28} />,
      onClick: onOpenAiChat,
      active: aiChatOpen,
      colorBase: "bg-blue-500 hover:bg-blue-600",
      colorActive: "bg-blue-700 hover:bg-blue-800",
    },
    {
      label: "Orçamentos Favoritos",
      icon: <Star size={28} className={favoritosOpen ? "fill-white" : ""} />,
      onClick: onOpenFavoritos,
      active: favoritosOpen,
      colorBase: "bg-yellow-400 hover:bg-yellow-500",
      colorActive: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      label: "Abrir WhatsApp",
      icon: <MessageSquare size={28} />,
      onClick: onOpenWhatsApp,
      active: chatOpen,
      colorBase: "bg-green-500 hover:bg-green-600",
      colorActive: "bg-green-700 hover:bg-green-800",
    },
  ];

  return (
    <div className="fixed left-0 bottom-1/3 z-50 flex items-center select-none">
      {/* Painel expandido — somente ícones */}
      <div
        className={`
          flex flex-col gap-2 bg-white border border-gray-200 shadow-xl rounded-r-2xl
          overflow-hidden transition-all duration-300 ease-in-out
          ${expanded ? "w-16 py-3 px-2 opacity-100" : "w-0 py-0 px-0 opacity-0 pointer-events-none"}
        `}
        aria-hidden={!expanded}
      >
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => {
              btn.onClick();
              setExpanded(false);
            }}
            title={btn.label}
            className={`
              flex items-center justify-center w-12 h-12 rounded-xl text-white
              transition-all duration-150 shadow-sm
              ${btn.active ? btn.colorActive : btn.colorBase}
            `}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Aba de toggle (sempre visível) */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? "Minimizar painel" : "Expandir painel de acesso rápido"}
        className="flex items-center justify-center w-6 h-14 rounded-r-xl shadow-md border border-l-0 border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all duration-200"
      >
        {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </div>
  );
}
