import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  BarChart3, 
  Layers, 
  TrendingUp,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

// ==================== MOCK DATA ====================
const MOCK_USER = {
  nome: 'Mestre Ye',
  email: 'mestre@qigongbrasil.com',
  avatar: 'https://ui-avatars.com/api/?name=Mestre+Ye&background=06b6d4&color=fff',
  role: 'Admin',
};

const MOCK_NOTIFICATIONS = [
  { id: 1, texto: '5 novos hot leads VIP', tempo: '2 min atrás', lido: false },
  { id: 2, texto: '12 leads aguardando contato', tempo: '1 hora atrás', lido: false },
  { id: 3, texto: 'Meta semanal atingida!', tempo: '3 horas atrás', lido: true },
];

// ==================== COMPONENTES UI ====================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    danger: 'bg-red-500 text-white',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// ==================== SIDEBAR ====================

const Sidebar = ({ isOpen, setIsOpen, currentPath, setCurrentPath }) => {
  const menuItems = [
    {
      section: 'Principal',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'Leads', path: '/leads', badge: 342 },
        { icon: Target, label: 'Elementos MTC', path: '/elementos' },
      ],
    },
    {
      section: 'Análise',
      items: [
        { icon: BarChart3, label: 'Respostas', path: '/respostas' },
        { icon: Layers, label: 'Funil de Vendas', path: '/funil' },
        { icon: TrendingUp, label: 'Equipe', path: '/equipe' },
      ],
    },
    {
      section: 'Gestão',
      items: [
        { icon: FileText, label: 'Relatórios', path: '/relatorios' },
        { icon: Settings, label: 'Configurações', path: '/configuracoes' },
      ],
    },
  ];

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              MTC
            </div>
            <span className="font-bold text-gray-900">Dashboard MTC</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  
                  return (
                    <button
                      key={itemIdx}
                      onClick={() => {
                        setCurrentPath(item.path);
                        if (window.innerWidth < 1024) setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                        transition-colors duration-150
                        ${isActive 
                          ? 'bg-cyan-50 text-cyan-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-600' : 'text-gray-500'}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge variant={isActive ? 'default' : 'default'}>
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info no rodapé */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <img
              src={MOCK_USER.avatar}
              alt={MOCK_USER.nome}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {MOCK_USER.nome}
              </p>
              <p className="text-xs text-gray-500">{MOCK_USER.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== HEADER ====================

const Header = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.lido).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Center: Search (placeholder) */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar leads, emails, celulares..."
              className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <Card className="absolute right-0 mt-2 w-80 shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notificações</h3>
                    {unreadCount > 0 && (
                      <Badge variant="danger">{unreadCount} novas</Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notif.lido ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-900 mb-1">{notif.texto}</p>
                      <p className="text-xs text-gray-500">{notif.tempo}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                    Ver todas as notificações
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <img
                src={MOCK_USER.avatar}
                alt={MOCK_USER.nome}
                className="w-8 h-8 rounded-full"
              />
              <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
            </button>

            {showUserMenu && (
              <Card className="absolute right-0 mt-2 w-56 shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-medium text-gray-900">{MOCK_USER.nome}</p>
                  <p className="text-sm text-gray-500">{MOCK_USER.email}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>
                </div>
                <div className="p-2 border-t border-gray-200">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ==================== MAIN LAYOUT ====================

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 lg:px-6 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
              <nav className="flex items-center gap-2 text-sm text-gray-600">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {currentPath === '/' ? 'Home' : currentPath.slice(1)}
                </span>
              </nav>
            </div>

            {/* Page Content Placeholder */}
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 flex items-center justify-center">
                  <LayoutDashboard className="h-8 w-8 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentPath === '/' ? 'Dashboard Home' : currentPath.slice(1).toUpperCase()}
                </h2>
                <p className="text-gray-600 mb-6">
                  Conteúdo da página "{currentPath}" será renderizado aqui
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
                  <Card className="p-6 border-2 border-cyan-200">
                    <Users className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">342</p>
                    <p className="text-sm text-gray-600 mt-1">Total de Leads</p>
                  </Card>
                  <Card className="p-6 border-2 border-blue-200">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">47</p>
                    <p className="text-sm text-gray-600 mt-1">Hot Leads VIP</p>
                  </Card>
                  <Card className="p-6 border-2 border-green-200">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">62</p>
                    <p className="text-sm text-gray-600 mt-1">Score Médio</p>
                  </Card>
                </div>

                <p className="text-sm text-gray-500 mt-8">
                  💡 Este é o layout base. Cada página terá seu conteúdo específico.
                </p>
              </div>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
            <p>© 2025 Quiz MTC - Medicina Tradicional Chinesa</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-cyan-600 transition-colors">Suporte</a>
              <a href="#" className="hover:text-cyan-600 transition-colors">Documentação</a>
              <a href="https://quiz.qigongbrasil.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition-colors">
                Quiz MTC
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}