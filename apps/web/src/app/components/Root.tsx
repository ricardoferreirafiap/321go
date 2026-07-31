import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoImg from "@/imports/logo.png";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import WhatsAppChat from "./WhatsAppChat";
import AIChat from "./AIChat";
import Agenda from "./Agenda";
import FavoritosOrcamentos from "./FavoritosOrcamentos";
import QuickAccessPanel from "./QuickAccessPanel";

const menuItems = [
  { name: "DASHBOARD", path: "/" },
  { name: "LEADS", path: "/leads/list" },
  { name: "CRM", path: "/crm" },
  { name: "ORÇAMENTOS", path: "/financeiro/orcamentos" },
  { name: "CADASTROS", path: "/cadastros" },
  { name: "FINANCEIRO", path: "/financeiro" },
  { name: "RELATÓRIOS", path: "/relatorios" },
  { name: "MARKETING", path: "/marketing" },
];

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [favoritosOpen, setFavoritosOpen] = useState(false);

  useEffect(() => {
    setAgendaOpen(false);
  }, [location.pathname]);

  const handleToggleAgenda = () => {
    if (agendaOpen) {
      setAgendaOpen(false);
      return;
    }
    setAgendaOpen(true);
    setAiChatOpen(false);
    setChatOpen(false);
  };

  const handleToggleAiChat = () => {
    setAiChatOpen((prev) => !prev);
    setAgendaOpen(false);
    setChatOpen(false);
    setFavoritosOpen(false);
  };

  const handleToggleWhatsApp = () => {
    setChatOpen((prev) => !prev);
    setAgendaOpen(false);
    setFavoritosOpen(false);
    setAiChatOpen(false);
  };

  const handleToggleFavoritos = () => {
    setFavoritosOpen((prev) => !prev);
    setChatOpen(false);
    setAiChatOpen(false);
    setAgendaOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAuthenticated");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header/Menu Superior */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <ImageWithFallback src={logoImg} alt="Logo" className="w-8 sm:w-10 h-8 sm:h-10 object-contain" />
              <span className="font-semibold text-lg sm:text-xl text-gray-900"></span>
            </Link>

            {/* Menu de Navegação - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-red-600 hover:text-red-900 hover:bg-red-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </nav>

            {/* Menu Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-colors text-red-600 hover:text-red-900 hover:bg-red-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </nav>
          )}
       </div>
      </header>

      {/* Conteúdo com Chat */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 relative">
          {/* Painel do Agente IA */}
          {!agendaOpen && (
            <aside className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${aiChatOpen ? 'w-[400px]' : 'w-0'}`} style={{ overflow: 'hidden' }}>
              <AIChat setAiChatOpen={setAiChatOpen} />
            </aside>
          )}
          {/* Painel do Agente IA - Mobile (Overlay) */}
          {!agendaOpen && aiChatOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setAiChatOpen(false)} aria-hidden="true">
              <div className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
                <AIChat setAiChatOpen={setAiChatOpen} isMobile={true} />
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0 transition-all duration-300 w-full">
            {agendaOpen ? <Agenda /> : <Outlet />}
          </main>

          {/* Painel dos Favoritos */}
          {!agendaOpen && (
            <aside className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${favoritosOpen ? 'w-[380px]' : 'w-0'}`} style={{ overflow: 'hidden' }}>
              <FavoritosOrcamentos setFavoritosOpen={setFavoritosOpen} />
            </aside>
          )}
          {/* Painel dos Favoritos - Mobile (Overlay) */}
          {!agendaOpen && favoritosOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setFavoritosOpen(false)} aria-hidden="true">
              <div className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
                <FavoritosOrcamentos setFavoritosOpen={setFavoritosOpen} isMobile={true} />
              </div>
            </div>
          )}

          {/* Painel do WhatsApp */}
          {!agendaOpen && (
            <aside className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${chatOpen ? 'w-[550px]' : 'w-0'}`} style={{ overflow: 'hidden' }}>
              <WhatsAppChat setChatOpen={setChatOpen} isVisible={chatOpen} />
            </aside>
          )}
          {/* Painel do WhatsApp - Mobile (Overlay) */}
          {!agendaOpen && chatOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setChatOpen(false)} aria-hidden="true">
              <div className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
                <WhatsAppChat setChatOpen={setChatOpen} isVisible={chatOpen} isMobile={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel lateral flutuante de acesso rápido */}
      <QuickAccessPanel
        onOpenAgenda={handleToggleAgenda}
        onOpenAiChat={handleToggleAiChat}
        onOpenFavoritos={handleToggleFavoritos}
        onOpenWhatsApp={handleToggleWhatsApp}
        agendaOpen={agendaOpen}
        aiChatOpen={aiChatOpen}
        favoritosOpen={favoritosOpen}
        chatOpen={chatOpen}
      />

    </div>
  );
}
