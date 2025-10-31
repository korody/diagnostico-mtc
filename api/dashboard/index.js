// Página HTML estática para o dashboard
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Gestão de Leads</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="module">
    const { useState, useEffect } = React;
    
    // Ícones SVG inline
    const SearchIcon = () => React.createElement('svg', { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
    );
    
    const FilterIcon = () => React.createElement('svg', { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' })
    );
    
    const DownloadIcon = () => React.createElement('svg', { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' })
    );
    
    const FlameIcon = () => React.createElement('svg', { className: 'w-3 h-3', fill: 'currentColor', viewBox: '0 0 20 20' },
      React.createElement('path', { fillRule: 'evenodd', d: 'M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z', clipRule: 'evenodd' })
    );
    
    function Dashboard() {
      const [leads, setLeads] = useState([]);
      const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [filtroElemento, setFiltroElemento] = useState('TODOS');
      const [filtroPrioridade, setFiltroPrioridade] = useState('TODOS');
      const [filtroQuadrante, setFiltroQuadrante] = useState('TODOS');
      const [mostrarFiltros, setMostrarFiltros] = useState(false);
      
      useEffect(() => {
        fetch('/api/dashboard/leads')
          .then(r => r.json())
          .then(data => {
            setLeads(data);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      }, []);
      
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
      
      const getIconeElemento = (elemento) => {
        const icones = { 'RIM': '💧', 'FÍGADO': '🌳', 'BAÇO': '🌍', 'CORAÇÃO': '🔥', 'PULMÃO': '💨' };
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
      
      const exportarCSV = () => {
        const headers = ['Nome', 'Email', 'Celular', 'Elemento', 'Score', 'Prioridade', 'Quadrante'];
        const rows = leadsFiltrados.map(lead => [
          lead.nome, lead.email, lead.celular, lead.elemento_principal,
          lead.lead_score, lead.prioridade, \`Q\${lead.quadrante}\`
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`leads-\${new Date().toISOString().split('T')[0]}.csv\`;
        a.click();
      };
      
      if (loading) {
        return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center' },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4' }),
            React.createElement('p', { className: 'text-slate-600' }, 'Carregando leads...')
          )
        );
      }
      
      return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8' },
        React.createElement('div', { className: 'max-w-7xl mx-auto' },
          
          // Header
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg p-6 mb-6' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('div', null,
                React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 mb-1' }, 'Gestão de Leads'),
                React.createElement('p', { className: 'text-slate-600' }, \`\${leadsFiltrados.length} de \${leads.length} leads\`)
              ),
              React.createElement('button', { 
                onClick: exportarCSV,
                className: 'flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors'
              },
                React.createElement(DownloadIcon),
                'Exportar CSV'
              )
            ),
            
            // Busca
            React.createElement('div', { className: 'relative mb-4' },
              React.createElement('div', { className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400' },
                React.createElement(SearchIcon)
              ),
              React.createElement('input', {
                type: 'text',
                placeholder: 'Buscar por nome, email ou celular...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: 'w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500'
              })
            ),
            
            // Toggle Filtros
            React.createElement('button', {
              onClick: () => setMostrarFiltros(!mostrarFiltros),
              className: 'flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors'
            },
              React.createElement(FilterIcon),
              'Filtros Avançados',
              React.createElement('span', null, mostrarFiltros ? '▲' : '▼')
            ),
            
            // Filtros
            mostrarFiltros && React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Elemento'),
                React.createElement('select', {
                  value: filtroElemento,
                  onChange: (e) => setFiltroElemento(e.target.value),
                  className: 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500'
                },
                  React.createElement('option', { value: 'TODOS' }, 'Todos'),
                  React.createElement('option', { value: 'RIM' }, '💧 RIM'),
                  React.createElement('option', { value: 'FÍGADO' }, '🌳 FÍGADO'),
                  React.createElement('option', { value: 'BAÇO' }, '🌍 BAÇO'),
                  React.createElement('option', { value: 'CORAÇÃO' }, '🔥 CORAÇÃO'),
                  React.createElement('option', { value: 'PULMÃO' }, '💨 PULMÃO')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Prioridade'),
                React.createElement('select', {
                  value: filtroPrioridade,
                  onChange: (e) => setFiltroPrioridade(e.target.value),
                  className: 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500'
                },
                  React.createElement('option', { value: 'TODOS' }, 'Todos'),
                  React.createElement('option', { value: 'ALTA' }, 'Alta'),
                  React.createElement('option', { value: 'MÉDIA' }, 'Média'),
                  React.createElement('option', { value: 'BAIXA' }, 'Baixa')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Quadrante'),
                React.createElement('select', {
                  value: filtroQuadrante,
                  onChange: (e) => setFiltroQuadrante(e.target.value),
                  className: 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500'
                },
                  React.createElement('option', { value: 'TODOS' }, 'Todos'),
                  React.createElement('option', { value: '1' }, 'Q1 - Hot Lead'),
                  React.createElement('option', { value: '2' }, 'Q2'),
                  React.createElement('option', { value: '3' }, 'Q3'),
                  React.createElement('option', { value: '4' }, 'Q4')
                )
              )
            )
          ),
          
          // Tabela
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg overflow-hidden' },
            React.createElement('div', { className: 'overflow-x-auto' },
              React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-slate-50 border-b border-slate-200' },
                  React.createElement('tr', null,
                    React.createElement('th', { className: 'px-6 py-4 text-left font-semibold text-slate-700' }, 'Lead'),
                    React.createElement('th', { className: 'px-6 py-4 text-left font-semibold text-slate-700' }, 'Contato'),
                    React.createElement('th', { className: 'px-6 py-4 text-left font-semibold text-slate-700' }, 'Elemento'),
                    React.createElement('th', { className: 'px-6 py-4 text-center font-semibold text-slate-700' }, 'Score'),
                    React.createElement('th', { className: 'px-6 py-4 text-center font-semibold text-slate-700' }, 'Prioridade'),
                    React.createElement('th', { className: 'px-6 py-4 text-center font-semibold text-slate-700' }, 'Quadrante')
                  )
                ),
                React.createElement('tbody', { className: 'divide-y divide-slate-200' },
                  leadsFiltrados.map((lead, index) => 
                    React.createElement('tr', { key: lead.id, className: 'hover:bg-slate-50 transition-colors' },
                      React.createElement('td', { className: 'px-6 py-4' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                          React.createElement('div', { className: 'w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl' },
                            getIconeElemento(lead.elemento_principal)
                          ),
                          React.createElement('div', null,
                            React.createElement('div', { className: 'font-medium text-slate-900' }, lead.nome),
                            lead.is_hot_lead_vip && React.createElement('span', { className: 'inline-flex items-center gap-1 text-xs text-orange-600 font-semibold' },
                              React.createElement(FlameIcon),
                              'VIP'
                            )
                          )
                        )
                      ),
                      React.createElement('td', { className: 'px-6 py-4' },
                        React.createElement('div', { className: 'text-sm text-slate-900' }, lead.email),
                        React.createElement('div', { className: 'text-xs text-slate-500' }, lead.celular)
                      ),
                      React.createElement('td', { className: 'px-6 py-4' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                          React.createElement('span', { className: 'text-2xl' }, getIconeElemento(lead.elemento_principal)),
                          React.createElement('span', { className: 'text-sm font-medium text-slate-700' }, lead.elemento_principal)
                        )
                      ),
                      React.createElement('td', { className: 'px-6 py-4 text-center' },
                        React.createElement('span', { className: 'inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 font-bold' },
                          lead.lead_score
                        )
                      ),
                      React.createElement('td', { className: 'px-6 py-4 text-center' },
                        React.createElement('span', { className: \`inline-block px-3 py-1 rounded-full text-xs font-semibold \${getCorPrioridade(lead.prioridade)}\` },
                          lead.prioridade
                        )
                      ),
                      React.createElement('td', { className: 'px-6 py-4 text-center' },
                        React.createElement('span', { className: 'inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium' },
                          \`Q\${lead.quadrante}\`
                        )
                      )
                    )
                  )
                )
              )
            ),
            leadsFiltrados.length === 0 && React.createElement('div', { className: 'text-center py-12' },
              React.createElement('p', { className: 'text-slate-500' }, 'Nenhum lead encontrado com os filtros aplicados.')
            )
          )
        )
      );
    }
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(Dashboard));
  </script>
</body>
</html>
  `);
};
