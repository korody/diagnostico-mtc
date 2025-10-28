import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Target, Award, Calendar, MessageCircle, Activity } from 'lucide-react';

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
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ==================== METRIC CARD ====================

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, loading }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${trend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
        <Icon className={`h-6 w-6 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="flex items-center text-sm">
        <span className={`font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-500 ml-2">vs. semana anterior</span>
      </div>
    )}
  </Card>
);

// ==================== MINI BAR CHART ====================

const MiniBarChart = ({ data, color = '#06b6d4' }) => {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative">
            <div 
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{ 
                backgroundColor: color,
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? '4px' : '0'
              }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ==================== ELEMENTO CARD ====================

const ElementoCard = ({ elemento, total, scoreMedia, hotLeads }) => {
  const elementos = {
    RIM: { emoji: '🌊', nome: 'Rim (Água)', cor: '#06b6d4' },
    FIGADO: { emoji: '🌳', nome: 'Fígado (Madeira)', cor: '#10b981' },
    BACO: { emoji: '🌍', nome: 'Baço (Terra)', cor: '#f59e0b' },
    CORACAO: { emoji: '🔥', nome: 'Coração (Fogo)', cor: '#ef4444' },
    PULMAO: { emoji: '💨', nome: 'Pulmão (Metal)', cor: '#94a3b8' },
  };
  
  const info = elementos[elemento] || {};
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="text-3xl w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${info.cor}20` }}
          >
            {info.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{info.nome}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            <p className="text-xs text-gray-500 mt-0.5">leads</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Score Médio</p>
          <p className="text-lg font-bold" style={{ color: info.cor }}>
            {scoreMedia}
          </p>
          {hotLeads > 0 && (
            <Badge variant="danger" className="mt-2">
              {hotLeads} VIP
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==================== QUADRANTE MATRIX ====================

const QuadranteMatrix = ({ data }) => {
  const total = data.reduce((sum, q) => sum + q.count, 0);
  
  return (
    <div className="grid grid-cols-2 gap-4 h-64">
      {[1, 2, 3, 4].map(q => {
        const quadrante = data.find(d => d.quadrante === q) || { count: 0 };
        const percentage = total > 0 ? ((quadrante.count / total) * 100).toFixed(1) : 0;
        
        const labels = {
          1: { title: 'Q1: Crítico', desc: 'Alta Urgência + Alta Intensidade', color: 'bg-red-500' },
          2: { title: 'Q2: Urgente', desc: 'Alta Urgência + Baixa Intensidade', color: 'bg-orange-500' },
          3: { title: 'Q3: Importante', desc: 'Baixa Urgência + Alta Intensidade', color: 'bg-yellow-500' },
          4: { title: 'Q4: Normal', desc: 'Baixa Urgência + Baixa Intensidade', color: 'bg-green-500' },
        };
        
        const info = labels[q];
        
        return (
          <Card key={q} className={`p-4 ${info.color} bg-opacity-10 border-2`} style={{ borderColor: info.color.replace('bg-', '') }}>
            <h4 className="font-bold text-gray-900 mb-1">{info.title}</h4>
            <p className="text-xs text-gray-600 mb-3">{info.desc}</p>
            <p className="text-3xl font-bold text-gray-900">{quadrante.count}</p>
            <p className="text-sm text-gray-600 mt-1">{percentage}% do total</p>
          </Card>
        );
      })}
    </div>
  );
};

// ==================== MAIN DASHBOARD ====================

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular dados (substituir por chamada API real)
    setTimeout(() => {
      setStats({
        totalLeads: 342,
        hotLeadsVip: 47,
        hotLeadsPercentage: 13.7,
        leadScoreMedio: 62,
        leadsHoje: 12,
        leadsSemana: 87,
        leadsMes: 342,
        taxaConversao: 24.5,
        taxaRespostaWhatsapp: 68.3,
        
        elementosDistribuicao: [
          { elemento: 'RIM', total: 98, scoreMedia: 67, hotLeads: 15 },
          { elemento: 'FIGADO', total: 76, scoreMedia: 59, hotLeads: 8 },
          { elemento: 'BACO', total: 68, scoreMedia: 55, hotLeads: 7 },
          { elemento: 'CORACAO', total: 54, scoreMedia: 71, hotLeads: 12 },
          { elemento: 'PULMAO', total: 46, scoreMedia: 48, hotLeads: 5 },
        ],
        
        prioridadeDistribuicao: [
          { prioridade: 'ALTA', count: 89, percentage: 26 },
          { prioridade: 'MEDIA', count: 167, percentage: 49 },
          { prioridade: 'BAIXA', count: 86, percentage: 25 },
        ],
        
        quadrantesDistribuicao: [
          { quadrante: 1, count: 47 },
          { quadrante: 2, count: 89 },
          { quadrante: 3, count: 112 },
          { quadrante: 4, count: 94 },
        ],
        
        leadsPorDia: [
          { label: 'Seg', value: 12 },
          { label: 'Ter', value: 18 },
          { label: 'Qua', value: 15 },
          { label: 'Qui', value: 22 },
          { label: 'Sex', value: 14 },
          { label: 'Sáb', value: 4 },
          { label: 'Dom', value: 2 },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-4"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard MTC</h1>
          <p className="text-gray-600 mt-1">Visão geral dos leads do Quiz de Medicina Tradicional Chinesa</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Leads"
            value={stats.totalLeads}
            subtitle={`${stats.leadsHoje} hoje • ${stats.leadsSemana} esta semana`}
            icon={Users}
            trend={12.5}
          />
          
          <MetricCard
            title="Hot Leads VIP"
            value={`${stats.hotLeadsVip} (${stats.hotLeadsPercentage}%)`}
            subtitle="Score ≥ 80 ou Quadrante 1"
            icon={Award}
            trend={8.3}
          />
          
          <MetricCard
            title="Lead Score Médio"
            value={stats.leadScoreMedio}
            subtitle="De 0 a 100 pontos"
            icon={Activity}
            trend={3.2}
          />
          
          <MetricCard
            title="Taxa de Resposta WhatsApp"
            value={`${stats.taxaRespostaWhatsapp}%`}
            subtitle="Leads que responderam"
            icon={MessageCircle}
            trend={-2.1}
          />
        </div>

        {/* Leads por Dia */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Leads Últimos 7 Dias</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <MiniBarChart data={stats.leadsPorDia} color="#06b6d4" />
        </Card>

        {/* Distribuição por Prioridade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {stats.prioridadeDistribuicao.map(p => (
            <Card key={p.prioridade} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Prioridade {p.prioridade}</h3>
                <Badge variant={p.prioridade === 'ALTA' ? 'danger' : p.prioridade === 'MEDIA' ? 'warning' : 'success'}>
                  {p.percentage}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{p.count}</p>
              <p className="text-sm text-gray-500 mt-1">leads nesta categoria</p>
            </Card>
          ))}
        </div>

        {/* Distribuição por Elemento MTC */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Distribuição por Elemento MTC</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.elementosDistribuicao.map(e => (
              <ElementoCard 
                key={e.elemento}
                elemento={e.elemento}
                total={e.total}
                scoreMedia={e.scoreMedia}
                hotLeads={e.hotLeads}
              />
            ))}
          </div>
        </div>

        {/* Matriz de Quadrantes */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Matriz de Urgência × Intensidade</h2>
          <QuadranteMatrix data={stats.quadrantesDistribuicao} />
        </div>

        {/* Ações Rápidas */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-cyan-500 rounded-lg hover:bg-cyan-50 transition-colors text-left">
              <Target className="h-6 w-6 text-cyan-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Ver Hot Leads VIP</h3>
              <p className="text-sm text-gray-600 mt-1">{stats.hotLeadsVip} leads aguardando contato</p>
            </button>
            
            <button className="p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-left">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Exportar Relatório</h3>
              <p className="text-sm text-gray-600 mt-1">Baixar dados em CSV ou PDF</p>
            </button>
            
            <button className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors text-left">
              <MessageCircle className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Leads Não Contatados</h3>
              <p className="text-sm text-gray-600 mt-1">{stats.totalLeads - Math.floor(stats.totalLeads * stats.taxaRespostaWhatsapp / 100)} leads pendentes</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}