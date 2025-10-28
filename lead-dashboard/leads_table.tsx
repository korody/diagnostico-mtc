import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Eye, Phone, Copy, ChevronDown, ChevronUp } from 'lucide-react';

// ==================== DADOS MOCKADOS ====================

const MOCK_LEADS = [
  {
    id: '1',
    nome: 'Maria Silva',
    email: 'maria.silva@email.com',
    celular: '11987654321',
    elemento_principal: 'RIM',
    emoji: '🌊',
    lead_score: 85,
    prioridade: 'ALTA',
    quadrante: 1,
    whatsapp_status: 'AGUARDANDO_CONTATO',
    created_at: '2025-10-15T10:30:00',
    is_hot_lead_vip: true,
    respostas: { P10: 'C', P11: 'F', P12: 'B' },
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao.santos@email.com',
    celular: '21976543210',
    elemento_principal: 'FIGADO',
    emoji: '🌳',
    lead_score: 72,
    prioridade: 'ALTA',
    quadrante: 2,
    whatsapp_status: 'CONTATADO',
    created_at: '2025-10-14T14:20:00',
    is_hot_lead_vip: false,
    respostas: { P10: 'B', P11: 'D', P12: 'A' },
  },
  {
    id: '3',
    nome: 'Ana Costa',
    email: 'ana.costa@email.com',
    celular: '11965432109',
    elemento_principal: 'BACO',
    emoji: '🌍',
    lead_score: 58,
    prioridade: 'MEDIA',
    quadrante: 3,
    whatsapp_status: 'EM_CONVERSA',
    created_at: '2025-10-13T09:15:00',
    is_hot_lead_vip: false,
    respostas: { P10: 'D', P11: 'C', P12: 'B' },
  },
  {
    id: '4',
    nome: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    celular: '85954321098',
    elemento_principal: 'CORACAO',
    emoji: '🔥',
    lead_score: 91,
    prioridade: 'ALTA',
    quadrante: 1,
    whatsapp_status: 'QUALIFICADO',
    created_at: '2025-10-17T08:45:00',
    is_hot_lead_vip: true,
    respostas: { P10: 'E', P11: 'H', P12: 'A' },
  },
  {
    id: '5',
    nome: 'Lucia Fernandes',
    email: 'lucia.fernandes@email.com',
    celular: '11943210987',
    elemento_principal: 'PULMAO',
    emoji: '💨',
    lead_score: 45,
    prioridade: 'MEDIA',
    quadrante: 4,
    whatsapp_status: 'NAO_RESPONDEU',
    created_at: '2025-10-12T16:30:00',
    is_hot_lead_vip: false,
    respostas: { P10: 'C', P11: 'B', P12: 'B' },
  },
  {
    id: '6',
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    celular: '21932109876',
    elemento_principal: 'RIM',
    emoji: '🌊',
    lead_score: 67,
    prioridade: 'MEDIA',
    quadrante: 2,
    whatsapp_status: 'CONTATADO',
    created_at: '2025-10-16T11:20:00',
    is_hot_lead_vip: false,
    respostas: { P10: 'B', P11: 'E', P12: 'A' },
  },
  {
    id: '7',
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    celular: '11921098765',
    elemento_principal: 'FIGADO',
    emoji: '🌳',
    lead_score: 38,
    prioridade: 'BAIXA',
    quadrante: 4,
    whatsapp_status: 'DESQUALIFICADO',
    created_at: '2025-10-11T13:45:00',
    is_hot_lead_vip: false,
    respostas: { P10: 'A', P11: 'A', P12: 'B' },
  },
];

// ==================== COMPONENTES UI ====================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled }) => {
  const variants = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-gray-300 hover:bg-gray-50 text-gray-700',
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-4 py-2 text-sm',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, className = '' }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${className}`}
  />
);

const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
  >
    <option value="">{placeholder}</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// ==================== FILTROS ====================

const LeadFilters = ({ filters, setFilters, onClear }) => {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou celular..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
        <Button variant="primary">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elemento</label>
              <Select
                value={filters.elemento}
                onChange={(e) => setFilters({ ...filters, elemento: e.target.value })}
                placeholder="Todos"
                options={[
                  { value: 'RIM', label: '🌊 Rim (Água)' },
                  { value: 'FIGADO', label: '🌳 Fígado (Madeira)' },
                  { value: 'BACO', label: '🌍 Baço (Terra)' },
                  { value: 'CORACAO', label: '🔥 Coração (Fogo)' },
                  { value: 'PULMAO', label: '💨 Pulmão (Metal)' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <Select
                value={filters.prioridade}
                onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                placeholder="Todas"
                options={[
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'MEDIA', label: 'Média' },
                  { value: 'BAIXA', label: 'Baixa' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quadrante</label>
              <Select
                value={filters.quadrante}
                onChange={(e) => setFilters({ ...filters, quadrante: e.target.value })}
                placeholder="Todos"
                options={[
                  { value: '1', label: 'Q1 - Crítico' },
                  { value: '2', label: 'Q2 - Urgente' },
                  { value: '3', label: 'Q3 - Importante' },
                  { value: '4', label: 'Q4 - Normal' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status WhatsApp</label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                placeholder="Todos"
                options={[
                  { value: 'AGUARDANDO_CONTATO', label: 'Aguardando Contato' },
                  { value: 'CONTATADO', label: 'Contatado' },
                  { value: 'EM_CONVERSA', label: 'Em Conversa' },
                  { value: 'QUALIFICADO', label: 'Qualificado' },
                  { value: 'NAO_RESPONDEU', label: 'Não Respondeu' },
                  { value: 'DESQUALIFICADO', label: 'Desqualificado' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hot Lead VIP</label>
              <Select
                value={filters.hotLead}
                onChange={(e) => setFilters({ ...filters, hotLead: e.target.value })}
                placeholder="Todos"
                options={[
                  { value: 'true', label: 'Apenas VIP' },
                  { value: 'false', label: 'Não VIP' },
                ]}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar Filtros
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== TABELA ====================

const LeadsTable = ({ leads, onViewDetails }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'lead_score', direction: 'desc' });
  
  const sortedLeads = useMemo(() => {
    const sorted = [...leads].sort((a, b) => {
      if (sortConfig.key === 'nome') {
        return sortConfig.direction === 'asc' 
          ? a.nome.localeCompare(b.nome)
          : b.nome.localeCompare(a.nome);
      }
      if (sortConfig.key === 'lead_score' || sortConfig.key === 'quadrante') {
        return sortConfig.direction === 'asc'
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });
    return sorted;
  }, [leads, sortConfig]);
  
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
    });
  };
  
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };
  
  const formatPhone = (phone) => {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  };
  
  const getScoreBadge = (score) => {
    if (score >= 80) return 'danger';
    if (score >= 70) return 'warning';
    if (score >= 40) return 'info';
    return 'success';
  };
  
  const getPrioridadeBadge = (prioridade) => {
    if (prioridade === 'ALTA') return 'danger';
    if (prioridade === 'MEDIA') return 'warning';
    return 'success';
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      AGUARDANDO_CONTATO: 'Aguardando',
      CONTATADO: 'Contatado',
      EM_CONVERSA: 'Em Conversa',
      QUALIFICADO: 'Qualificado',
      NAO_RESPONDEU: 'Não Respondeu',
      DESQUALIFICADO: 'Desqualificado',
    };
    return labels[status] || status;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <button onClick={() => handleSort('nome')} className="flex items-center gap-1 font-semibold text-sm text-gray-700 hover:text-gray-900">
                Lead
                {sortConfig.key === 'nome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="font-semibold text-sm text-gray-700">Contato</span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="font-semibold text-sm text-gray-700">Elemento</span>
            </th>
            <th className="px-4 py-3 text-left">
              <button onClick={() => handleSort('lead_score')} className="flex items-center gap-1 font-semibold text-sm text-gray-700 hover:text-gray-900">
                Score
                {sortConfig.key === 'lead_score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="font-semibold text-sm text-gray-700">Prioridade</span>
            </th>
            <th className="px-4 py-3 text-left">
              <button onClick={() => handleSort('quadrante')} className="flex items-center gap-1 font-semibold text-sm text-gray-700 hover:text-gray-900">
                Quadrante
                {sortConfig.key === 'quadrante' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="font-semibold text-sm text-gray-700">Status</span>
            </th>
            <th className="px-4 py-3 text-left">
              <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 font-semibold text-sm text-gray-700 hover:text-gray-900">
                Data
                {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            </th>
            <th className="px-4 py-3 text-right">
              <span className="font-semibold text-sm text-gray-700">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedLeads.map(lead => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${getElementoColor(lead.elemento_principal)}20` }}>
                    {lead.emoji}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{lead.nome}</p>
                    {lead.is_hot_lead_vip && (
                      <Badge variant="purple" className="mt-0.5">VIP</Badge>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-gray-900">{lead.email}</p>
                <p className="text-sm text-gray-500">{formatPhone(lead.celular)}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{lead.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{lead.elemento_principal}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={getScoreBadge(lead.lead_score)}>
                  {lead.lead_score}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={getPrioridadeBadge(lead.prioridade)}>
                  {lead.prioridade}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-gray-900">Q{lead.quadrante}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">{getStatusLabel(lead.whatsapp_status)}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">{formatDate(lead.created_at)}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(lead)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="success" size="sm" onClick={() => window.open(`https://wa.me/55${lead.celular}`, '_blank')}>
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getElementoColor = (elemento) => {
  const colors = {
    RIM: '#06b6d4',
    FIGADO: '#10b981',
    BACO: '#f59e0b',
    CORACAO: '#ef4444',
    PULMAO: '#94a3b8',
  };
  return colors[elemento] || '#6b7280';
};

// ==================== MODAL DE DETALHES ====================

const LeadDetailsModal = ({ lead, onClose }) => {
  if (!lead) return null;
  
  const faixasEtarias = {
    A: '18-25 anos', B: '26-35 anos', C: '36-45 anos',
    D: '46-55 anos', E: '56-65 anos', F: '65+ anos',
  };
  
  const faixasRenda = {
    A: 'Até R$ 2.000', B: 'R$ 2.000 - R$ 4.000', C: 'R$ 4.000 - R$ 6.000',
    D: 'R$ 6.000 - R$ 8.000', E: 'R$ 8.000 - R$ 10.000', F: 'R$ 10.000 - R$ 15.000',
    G: 'R$ 15.000 - R$ 20.000', H: 'R$ 20.000 - R$ 30.000', I: 'R$ 30.000 - R$ 50.000',
    J: 'R$ 50.000+',
  };
  
  const jaAluno = { A: 'Sim', B: 'Não' };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Detalhes do Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Informações Pessoais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium text-gray-900">{lead.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{lead.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Celular</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{lead.celular}</p>
                  <button className="text-cyan-600 hover:text-cyan-700">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Faixa Etária</p>
                <p className="font-medium text-gray-900">{faixasEtarias[lead.respostas.P10] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Renda Mensal</p>
                <p className="font-medium text-gray-900">{faixasRenda[lead.respostas.P11] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Já é aluno</p>
                <p className="font-medium text-gray-900">{jaAluno[lead.respostas.P12] || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Diagnóstico MTC */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Diagnóstico MTC</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${getElementoColor(lead.elemento_principal)}20` }}>
                  {lead.emoji}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{lead.elemento_principal}</p>
                  <p className="text-sm text-gray-600">Elemento Principal</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Lead Score</p>
                  <Badge variant={getScoreBadge(lead.lead_score)} className="mt-1">
                    {lead.lead_score} pontos
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prioridade</p>
                  <Badge variant={getPrioridadeBadge(lead.prioridade)} className="mt-1">
                    {lead.prioridade}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quadrante</p>
                  <Badge variant="info" className="mt-1">
                    Q{lead.quadrante}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ações */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" className="w-full justify-center">
                <Phone className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </Button>
              <Button variant="outline" className="w-full justify-center">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getScoreBadge = (score) => {
  if (score >= 80) return 'danger';
  if (score >= 70) return 'warning';
  if (score >= 40) return 'info';
  return 'success';
};

const getPrioridadeBadge = (prioridade) => {
  if (prioridade === 'ALTA') return 'danger';
  if (prioridade === 'MEDIA') return 'warning';
  return 'success';
};

// ==================== MAIN COMPONENT ====================

export default function LeadsPage() {
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [filters, setFilters] = useState({
    search: '',
    elemento: '',
    prioridade: '',
    quadrante: '',
    status: '',
    hotLead: '',
  });
  const [selectedLead, setSelectedLead] = useState(null);
  
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!lead.nome.toLowerCase().includes(search) &&
            !lead.email.toLowerCase().includes(search) &&
            !lead.celular.includes(search)) {
          return false;
        }
      }
      if (filters.elemento && lead.elemento_principal !== filters.elemento) return false;
      if (filters.prioridade && lead.prioridade !== filters.prioridade) return false;
      if (filters.quadrante && lead.quadrante !== parseInt(filters.quadrante)) return false;
      if (filters.status && lead.whatsapp_status !== filters.status) return false;
      if (filters.hotLead && lead.is_hot_lead_vip !== (filters.hotLead === 'true')) return false;
      return true;
    });
  }, [leads, filters]);
  
  const handleClearFilters = () => {
    setFilters({
      search: '',
      elemento: '',
      prioridade: '',
      quadrante: '',
      status: '',
      hotLead: '',
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-600 mt-1">{filteredLeads.length} de {leads.length} leads</p>
        </div>
        
        <div className="mb-6">
          <LeadFilters filters={filters} setFilters={setFilters} onClear={handleClearFilters} />
        </div>
        
        <Card>
          <LeadsTable leads={filteredLeads} onViewDetails={setSelectedLead} />
        </Card>
        
        {selectedLead && (
          <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        )}
      </div>
    </div>
  );
}