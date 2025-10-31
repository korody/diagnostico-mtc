import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Flame, ChevronDown, ChevronUp } from 'lucide-react';

// Configuração do Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://kfkhdfnkwhljhhjcvbqp.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroElemento, setFiltroElemento] = useState('TODOS');
  const [filtroPrioridade, setFiltroPrioridade] = useState('TODOS');
  const [filtroQuadrante, setFiltroQuadrante] = useState('TODOS');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenacao, setOrdenacao] = useState({ campo: 'lead_score', direcao: 'desc' });

  useEffect(() => {
    carregarLeads();
  }, []);

  const carregarLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_leads?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar leads');
      
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const leadsFiltrados = leads.filter(lead => {
    const matchSearch = searchTerm === '' || 
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.celular?.includes(searchTerm);
    
    const matchElemento = filtroElemento === 'TODOS' || lead.elemento_principal === filtroElemento;
    const matchPrioridade = filtroPrioridade === 'TODOS' || lead.prioridade === filtroPrioridade;
    const matchQuadrante = filtroQuadrante === 'TODOS' || lead.quadrante === parseInt(filtroQuadrante);
    
    return matchSearch && matchElemento && matchPrioridade && matchQuadrante;
  });

  const leadsOrdenados = [...leadsFiltrados].sort((a, b) => {
    const mult = ordenacao.direcao === 'asc' ? 1 : -1;
    if (a[ordenacao.campo] < b[ordenacao.campo]) return -1 * mult;
    if (a[ordenacao.campo] > b[ordenacao.campo]) return 1 * mult;
    return 0;
  });

  const alternarOrdenacao = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'desc' ? 'asc' : 'desc'
    }));
  };

  const exportarCSV = () => {
    const headers = ['Nome', 'Email', 'Celular', 'Elemento', 'Score', 'Prioridade', 'Quadrante'];
    const rows = leadsOrdenados.map(lead => [
      lead.nome,
      lead.email,
      lead.celular,
      lead.elemento_principal,
      lead.lead_score,
      lead.prioridade,
      `Q${lead.quadrante}`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getIconeElemento = (elemento) => {
    const icones = {
      'RIM': '💧',
      'FÍGADO': '🌳',
      'BAÇO': '🌍',
      'CORAÇÃO': '🔥',
      'PULMÃO': '💨'
    };
    return icones[elemento] || '⚪';
  };

  const getCorPrioridade = (prioridade) => {
    const cores = {
      'ALTA': 'bg-red-100 text-red-700',
      'MÉDIA': 'bg-yellow-100 text-yellow-700',
      'BAIXA': 'bg-green-100 text-green-700'
    };
    return cores[prioridade] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Gestão de Leads</h1>
              <p className="text-slate-600">{leadsFiltrados.length} de {leads.length} leads</p>
            </div>
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          </div>

          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Toggle Filtros */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtros Avançados
            {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Filtros Avançados */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Elemento</label>
                <select
                  value={filtroElemento}
                  onChange={(e) => setFiltroElemento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="TODOS">Todos</option>
                  <option value="RIM">💧 RIM (Água)</option>
                  <option value="FÍGADO">🌳 FÍGADO (Madeira)</option>
                  <option value="BAÇO">🌍 BAÇO (Terra)</option>
                  <option value="CORAÇÃO">🔥 CORAÇÃO (Fogo)</option>
                  <option value="PULMÃO">💨 PULMÃO (Metal)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prioridade</label>
                <select
                  value={filtroPrioridade}
                  onChange={(e) => setFiltroPrioridade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ALTA">Alta</option>
                  <option value="MÉDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quadrante</label>
                <select
                  value={filtroQuadrante}
                  onChange={(e) => setFiltroQuadrante(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="TODOS">Todos</option>
                  <option value="1">Q1 - Hot Lead</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Leads */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => alternarOrdenacao('nome')} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
                      Lead
                      {ordenacao.campo === 'nome' && (ordenacao.direcao === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="font-semibold text-slate-700">Contato</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => alternarOrdenacao('elemento_principal')} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
                      Elemento
                      {ordenacao.campo === 'elemento_principal' && (ordenacao.direcao === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button onClick={() => alternarOrdenacao('lead_score')} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
                      Score
                      {ordenacao.campo === 'lead_score' && (ordenacao.direcao === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button onClick={() => alternarOrdenacao('prioridade')} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
                      Prioridade
                      {ordenacao.campo === 'prioridade' && (ordenacao.direcao === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button onClick={() => alternarOrdenacao('quadrante')} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
                      Quadrante
                      {ordenacao.campo === 'quadrante' && (ordenacao.direcao === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leadsOrdenados.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {getIconeElemento(lead.elemento_principal)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{lead.nome}</div>
                          {lead.is_hot_lead_vip && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold">
                              <Flame className="w-3 h-3" />
                              VIP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{lead.email}</div>
                      <div className="text-xs text-slate-500">{lead.celular}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getIconeElemento(lead.elemento_principal)}</span>
                        <span className="text-sm font-medium text-slate-700">{lead.elemento_principal}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 font-bold">
                        {lead.lead_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCorPrioridade(lead.prioridade)}`}>
                        {lead.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                        Q{lead.quadrante}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leadsOrdenados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhum lead encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
