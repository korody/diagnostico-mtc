// ========================================
// 📄 src/services/exportService.ts
// ========================================

import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { QuizLead } from '@/types/database.types'
import { ELEMENTOS, FAIXAS_ETARIAS, FAIXAS_RENDA } from '@/lib/constants'

class ExportService {
  /**
   * Exporta leads para CSV
   */
  exportToCSV(leads: QuizLead[], filename = 'leads-mtc.csv') {
    const data = leads.map(lead => ({
      'ID': lead.id,
      'Nome': lead.nome,
      'Email': lead.email,
      'Celular': lead.celular,
      'Elemento Principal': lead.elemento_principal || 'N/A',
      'Lead Score': lead.lead_score || 0,
      'Prioridade': lead.prioridade || 'N/A',
      'Quadrante': lead.quadrante || 'N/A',
      'Hot Lead VIP': lead.is_hot_lead_vip ? 'Sim' : 'Não',
      'Status WhatsApp': this.formatWhatsAppStatus(lead.whatsapp_status),
      'Faixa Etária': FAIXAS_ETARIAS[lead.respostas.P10 as keyof typeof FAIXAS_ETARIAS] || 'N/A',
      'Renda Mensal': FAIXAS_RENDA[lead.respostas.P11 as keyof typeof FAIXAS_RENDA] || 'N/A',
      'Já é Aluno': lead.respostas.P12 === 'A' ? 'Sim' : 'Não',
      'Data de Cadastro': new Date(lead.created_at).toLocaleString('pt-BR'),
      'Última Atualização': new Date(lead.updated_at).toLocaleString('pt-BR'),
    }))

    const csv = Papa.unparse(data, {
      delimiter: ',',
      header: true,
      quotes: true,
    })

    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  /**
   * Exporta lead individual para PDF
   */
  exportLeadToPDF(lead: QuizLead, filename?: string) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Cabeçalho
    doc.setFontSize(20)
    doc.setTextColor(6, 182, 212) // Cyan
    doc.text('Quiz MTC - Detalhes do Lead', 14, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)
    
    // Linha separadora
    doc.setDrawColor(6, 182, 212)
    doc.line(14, 32, pageWidth - 14, 32)
    
    let y = 42
    
    // Seção: Dados Pessoais
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Dados Pessoais', 14, y)
    y += 8
    
    const personalData = [
      ['Nome', lead.nome],
      ['Email', lead.email],
      ['Celular', this.formatPhone(lead.celular)],
      ['Faixa Etária', FAIXAS_ETARIAS[lead.respostas.P10 as keyof typeof FAIXAS_ETARIAS] || 'N/A'],
      ['Renda Mensal', FAIXAS_RENDA[lead.respostas.P11 as keyof typeof FAIXAS_RENDA] || 'N/A'],
      ['Já é Aluno', lead.respostas.P12 === 'A' ? 'Sim' : 'Não'],
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: personalData,
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
      margin: { left: 14, right: 14 },
    })
    
    y = (doc as any).lastAutoTable.finalY + 10
    
    // Seção: Diagnóstico MTC
    doc.setFontSize(14)
    doc.text('Diagnóstico MTC', 14, y)
    y += 8
    
    const elementoInfo = ELEMENTOS[lead.elemento_principal as keyof typeof ELEMENTOS]
    
    const diagnosticData = [
      ['Elemento Principal', `${elementoInfo?.emoji || ''} ${lead.elemento_principal || 'N/A'}`],
      ['Descrição', elementoInfo?.descricao || 'N/A'],
      ['Lead Score', `${lead.lead_score || 0} pontos`],
      ['Prioridade', lead.prioridade || 'N/A'],
      ['Quadrante', `Q${lead.quadrante || 'N/A'}`],
      ['Hot Lead VIP', lead.is_hot_lead_vip ? 'SIM ⭐' : 'Não'],
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: diagnosticData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    })
    
    y = (doc as any).lastAutoTable.finalY + 10
    
    // Seção: Status e Acompanhamento
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.text('Status e Acompanhamento', 14, y)
    y += 8
    
    const statusData = [
      ['Status WhatsApp', this.formatWhatsAppStatus(lead.whatsapp_status)],
      ['Data de Cadastro', new Date(lead.created_at).toLocaleString('pt-BR')],
      ['Última Atualização', new Date(lead.updated_at).toLocaleString('pt-BR')],
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: statusData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    })
    
    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${i} de ${pageCount} | Dashboard MTC - quiz.qigongbrasil.com`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
    
    // Download
    const pdfFilename = filename || `lead-${lead.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`
    doc.save(pdfFilename)
  }

  /**
   * Exporta relatório executivo em PDF
   */
  exportExecutiveReport(stats: any, filename = 'relatorio-executivo-mtc.pdf') {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Capa
    doc.setFillColor(6, 182, 212)
    doc.rect(0, 0, pageWidth, 60, 'F')
    
    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.text('Relatório Executivo', pageWidth / 2, 30, { align: 'center' })
    
    doc.setFontSize(16)
    doc.text('Quiz MTC - Medicina Tradicional Chinesa', pageWidth / 2, 45, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 52, { align: 'center' })
    
    let y = 80
    
    // Resumo Executivo
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    doc.text('Resumo Executivo', 14, y)
    y += 10
    
    const summaryData = [
      ['Total de Leads', stats.totalLeads?.toString() || '0'],
      ['Hot Leads VIP', `${stats.hotLeadsVip || 0} (${((stats.hotLeadsVip / stats.totalLeads) * 100).toFixed(1)}%)`],
      ['Lead Score Médio', `${stats.leadScoreMedio || 0} pontos`],
      ['Leads Hoje', stats.leadsHoje?.toString() || '0'],
      ['Leads Esta Semana', stats.leadsSemana?.toString() || '0'],
      ['Leads Este Mês', stats.leadsMes?.toString() || '0'],
    ]
    
    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212], fontSize: 12 },
      bodyStyles: { fontSize: 11 },
      margin: { left: 14, right: 14 },
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
    
    // Nova página para distribuições
    doc.addPage()
    y = 20
    
    // Distribuição por Elemento
    doc.setFontSize(18)
    doc.text('Distribuição por Elemento MTC', 14, y)
    y += 10
    
    const elementoData = (stats.elementosDistribuicao || []).map((e: any) => [
      `${ELEMENTOS[e.elemento as keyof typeof ELEMENTOS]?.emoji || ''} ${e.elemento}`,
      e.total.toString(),
      `${e.scoreMedia} pontos`,
      `${e.hotLeads} VIP`,
    ])
    
    autoTable(doc, {
      startY: y,
      head: [['Elemento', 'Total Leads', 'Score Médio', 'Hot Leads']],
      body: elementoData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
    
    // Distribuição por Prioridade
    doc.setFontSize(18)
    doc.text('Distribuição por Prioridade', 14, y)
    y += 10
    
    const prioridadeData = (stats.prioridadeDistribuicao || []).map((p: any) => [
      p.prioridade,
      p.count.toString(),
      `${p.percentage}%`,
    ])
    
    autoTable(doc, {
      startY: y,
      head: [['Prioridade', 'Quantidade', 'Percentual']],
      body: prioridadeData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    })
    
    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${i} de ${pageCount} | Dashboard MTC - quiz.qigongbrasil.com`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
    
    doc.save(filename)
  }

  /**
   * Helpers
   */
  private formatWhatsAppStatus(status: string): string {
    const labels: Record<string, string> = {
      AGUARDANDO_CONTATO: 'Aguardando Contato',
      CONTATADO: 'Contatado',
      EM_CONVERSA: 'Em Conversa',
      QUALIFICADO: 'Qualificado',
      INSCRITO: 'Inscrito no Evento',
      CONVERTIDO: 'Convertido (Pagou)',
      NAO_RESPONDEU: 'Não Respondeu',
      DESQUALIFICADO: 'Desqualificado',
    }
    return labels[status] || status
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()

// ========================================
// 📄 src/app/api/export/csv/route.ts
// ========================================

import { NextResponse } from 'next/server'
import { leadService } from '@/services/leadService'
import Papa from 'papaparse'
import { FAIXAS_ETARIAS, FAIXAS_RENDA } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const { filters } = await request.json()
    
    // Buscar todos os leads com filtros (sem paginação)
    const { leads } = await leadService.getLeads(filters, 1, 10000)
    
    // Formatar dados para CSV
    const data = leads.map(lead => ({
      'ID': lead.id,
      'Nome': lead.nome,
      'Email': lead.email,
      'Celular': lead.celular,
      'Elemento Principal': lead.elemento_principal || 'N/A',
      'Lead Score': lead.lead_score || 0,
      'Prioridade': lead.prioridade || 'N/A',
      'Quadrante': lead.quadrante || 'N/A',
      'Hot Lead VIP': lead.is_hot_lead_vip ? 'Sim' : 'Não',
      'Status WhatsApp': formatWhatsAppStatus(lead.whatsapp_status),
      'Faixa Etária': FAIXAS_ETARIAS[lead.respostas.P10 as keyof typeof FAIXAS_ETARIAS] || 'N/A',
      'Renda Mensal': FAIXAS_RENDA[lead.respostas.P11 as keyof typeof FAIXAS_RENDA] || 'N/A',
      'Já é Aluno': lead.respostas.P12 === 'A' ? 'Sim' : 'Não',
      'Data de Cadastro': new Date(lead.created_at).toLocaleString('pt-BR'),
      'Última Atualização': new Date(lead.updated_at).toLocaleString('pt-BR'),
    }))

    const csv = Papa.unparse(data, {
      delimiter: ',',
      header: true,
      quotes: true,
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="leads-mtc-${Date.now()}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function formatWhatsAppStatus(status: string): string {
  const labels: Record<string, string> = {
    AGUARDANDO_CONTATO: 'Aguardando Contato',
    CONTATADO: 'Contatado',
    EM_CONVERSA: 'Em Conversa',
    QUALIFICADO: 'Qualificado',
    INSCRITO: 'Inscrito no Evento',
    CONVERTIDO: 'Convertido (Pagou)',
    NAO_RESPONDEU: 'Não Respondeu',
    DESQUALIFICADO: 'Desqualificado',
  }
  return labels[status] || status
}

// ========================================
// 📄 src/hooks/useExport.ts
// ========================================

import { useState } from 'react'
import { exportService } from '@/services/exportService'
import { QuizLead } from '@/types/database.types'

export function useExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Exporta leads para CSV (lado do cliente)
   */
  const exportCSV = (leads: QuizLead[], filename?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      exportService.exportToCSV(leads, filename)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exporta lead individual para PDF
   */
  const exportLeadPDF = (lead: QuizLead, filename?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      exportService.exportLeadToPDF(lead, filename)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exporta relatório executivo
   */
  const exportExecutiveReport = (stats: any, filename?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      exportService.exportExecutiveReport(stats, filename)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exporta CSV via API (com filtros)
   */
  const exportCSVFromAPI = async (filters: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar CSV')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `leads-mtc-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    exportCSV,
    exportLeadPDF,
    exportExecutiveReport,
    exportCSVFromAPI,
  }
}

// ========================================
// 📄 Exemplo de uso no componente
// ========================================

/*
import { useExport } from '@/hooks/useExport'

function LeadsPage() {
  const { exportCSV, exportCSVFromAPI, loading } = useExport()
  const { leads } = useLeads()

  const handleExportLocal = () => {
    // Exporta leads atuais (do estado)
    exportCSV(leads, 'meus-leads.csv')
  }

  const handleExportFiltered = () => {
    // Exporta com filtros aplicados via API
    exportCSVFromAPI({ prioridade: 'ALTA' })
  }

  return (
    <div>
      <button onClick={handleExportLocal} disabled={loading}>
        {loading ? 'Exportando...' : 'Exportar CSV (Local)'}
      </button>
      
      <button onClick={handleExportFiltered} disabled={loading}>
        {loading ? 'Exportando...' : 'Exportar CSV (Filtrado)'}
      </button>
    </div>
  )
}
*/