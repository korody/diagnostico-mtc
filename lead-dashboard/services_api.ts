// ========================================
// 📄 src/services/leadService.ts
// ========================================

import { supabase } from '@/lib/supabase'
import { QuizLead, Elemento, Prioridade, WhatsAppStatus } from '@/types/database.types'

export interface LeadFilters {
  search?: string
  elemento?: Elemento
  prioridade?: Prioridade
  quadrante?: number
  whatsapp_status?: WhatsAppStatus
  is_hot_lead_vip?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface LeadStats {
  totalLeads: number
  hotLeadsVip: number
  leadScoreMedio: number
  leadsHoje: number
  leadsSemana: number
  leadsMes: number
}

class LeadService {
  /**
   * Busca leads com filtros
   */
  async getLeads(filters?: LeadFilters, page = 1, limit = 50) {
    let query = supabase
      .from('quiz_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(
        `nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,celular.ilike.%${filters.search}%`
      )
    }

    if (filters?.elemento) {
      query = query.eq('elemento_principal', filters.elemento)
    }

    if (filters?.prioridade) {
      query = query.eq('prioridade', filters.prioridade)
    }

    if (filters?.quadrante) {
      query = query.eq('quadrante', filters.quadrante)
    }

    if (filters?.whatsapp_status) {
      query = query.eq('whatsapp_status', filters.whatsapp_status)
    }

    if (filters?.is_hot_lead_vip !== undefined) {
      query = query.eq('is_hot_lead_vip', filters.is_hot_lead_vip)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar leads: ${error.message}`)
    }

    return {
      leads: data as QuizLead[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  }

  /**
   * Busca lead por ID
   */
  async getLeadById(id: string) {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar lead: ${error.message}`)
    }

    return data as QuizLead
  }

  /**
   * Atualiza lead
   */
  async updateLead(id: string, updates: Partial<QuizLead>) {
    const { data, error } = await supabase
      .from('quiz_leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar lead: ${error.message}`)
    }

    return data as QuizLead
  }

  /**
   * Busca estatísticas gerais
   */
  async getStats(): Promise<LeadStats> {
    // Total de leads
    const { count: totalLeads } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })

    // Hot leads VIP
    const { count: hotLeadsVip } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_hot_lead_vip', true)

    // Lead score médio
    const { data: scoreData } = await supabase
      .from('quiz_leads')
      .select('lead_score')

    const leadScoreMedio = scoreData && scoreData.length > 0
      ? Math.round(
          scoreData.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / scoreData.length
        )
      : 0

    // Leads hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: leadsHoje } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Leads esta semana
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: leadsSemana } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Leads este mês
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const { count: leadsMes } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    return {
      totalLeads: totalLeads || 0,
      hotLeadsVip: hotLeadsVip || 0,
      leadScoreMedio,
      leadsHoje: leadsHoje || 0,
      leadsSemana: leadsSemana || 0,
      leadsMes: leadsMes || 0,
    }
  }

  /**
   * Busca distribuição por elemento
   */
  async getElementoDistribution() {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('elemento_principal, lead_score, is_hot_lead_vip')

    if (error) {
      throw new Error(`Erro ao buscar distribuição: ${error.message}`)
    }

    const distribution = data.reduce((acc: any, lead) => {
      const elemento = lead.elemento_principal || 'INDEFINIDO'
      
      if (!acc[elemento]) {
        acc[elemento] = {
          elemento,
          total: 0,
          scoreTotal: 0,
          hotLeads: 0,
        }
      }

      acc[elemento].total++
      acc[elemento].scoreTotal += lead.lead_score || 0
      if (lead.is_hot_lead_vip) acc[elemento].hotLeads++

      return acc
    }, {})

    return Object.values(distribution).map((item: any) => ({
      elemento: item.elemento,
      total: item.total,
      scoreMedia: Math.round(item.scoreTotal / item.total),
      hotLeads: item.hotLeads,
    }))
  }

  /**
   * Busca distribuição por prioridade
   */
  async getPrioridadeDistribution() {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('prioridade')

    if (error) {
      throw new Error(`Erro ao buscar distribuição: ${error.message}`)
    }

    const total = data.length
    const distribution = data.reduce((acc: any, lead) => {
      const prioridade = lead.prioridade || 'INDEFINIDA'
      acc[prioridade] = (acc[prioridade] || 0) + 1
      return acc
    }, {})

    return Object.entries(distribution).map(([prioridade, count]) => ({
      prioridade,
      count,
      percentage: Math.round(((count as number) / total) * 100),
    }))
  }

  /**
   * Busca distribuição por quadrante
   */
  async getQuadranteDistribution() {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('quadrante')

    if (error) {
      throw new Error(`Erro ao buscar distribuição: ${error.message}`)
    }

    const distribution = data.reduce((acc: any, lead) => {
      const quadrante = lead.quadrante || 0
      acc[quadrante] = (acc[quadrante] || 0) + 1
      return acc
    }, {})

    return Object.entries(distribution)
      .map(([quadrante, count]) => ({
        quadrante: parseInt(quadrante),
        count,
      }))
      .sort((a, b) => a.quadrante - b.quadrante)
  }

  /**
   * Busca leads por dia (últimos 7 dias)
   */
  async getLeadsByDay(days = 7) {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      throw new Error(`Erro ao buscar leads por dia: ${error.message}`)
    }

    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const distribution: any = {}

    data.forEach(lead => {
      const date = new Date(lead.created_at)
      const dayLabel = dayLabels[date.getDay()]
      distribution[dayLabel] = (distribution[dayLabel] || 0) + 1
    })

    return dayLabels.map(label => ({
      label,
      value: distribution[label] || 0,
    }))
  }
}

export const leadService = new LeadService()

// ========================================
// 📄 src/app/api/leads/route.ts
// ========================================

import { NextResponse } from 'next/server'
import { leadService } from '@/services/leadService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      search: searchParams.get('search') || undefined,
      elemento: searchParams.get('elemento') || undefined,
      prioridade: searchParams.get('prioridade') || undefined,
      quadrante: searchParams.get('quadrante') 
        ? parseInt(searchParams.get('quadrante')!) 
        : undefined,
      whatsapp_status: searchParams.get('status') || undefined,
      is_hot_lead_vip: searchParams.get('hotLead') === 'true' ? true : undefined,
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await leadService.getLeads(filters, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ========================================
// 📄 src/app/api/leads/[id]/route.ts
// ========================================

import { NextResponse } from 'next/server'
import { leadService } from '@/services/leadService'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await leadService.getLeadById(params.id)
    return NextResponse.json(lead)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const lead = await leadService.updateLead(params.id, updates)
    return NextResponse.json(lead)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ========================================
// 📄 src/app/api/stats/route.ts
// ========================================

import { NextResponse } from 'next/server'
import { leadService } from '@/services/leadService'

export async function GET() {
  try {
    const [
      stats,
      elementosDistribuicao,
      prioridadeDistribuicao,
      quadrantesDistribuicao,
      leadsPorDia,
    ] = await Promise.all([
      leadService.getStats(),
      leadService.getElementoDistribution(),
      leadService.getPrioridadeDistribution(),
      leadService.getQuadranteDistribution(),
      leadService.getLeadsByDay(7),
    ])

    return NextResponse.json({
      ...stats,
      elementosDistribuicao,
      prioridadeDistribuicao,
      quadrantesDistribuicao,
      leadsPorDia,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// ========================================
// 📄 src/hooks/useLeads.ts
// ========================================

import { useState, useEffect } from 'react'
import { QuizLead } from '@/types/database.types'

interface UseLeadsOptions {
  filters?: any
  page?: number
  limit?: number
  autoFetch?: boolean
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { filters, page = 1, limit = 50, autoFetch = true } = options
  
  const [leads, setLeads] = useState<QuizLead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchLeads = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      })

      const response = await fetch(`/api/leads?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar leads')
      }

      const data = await response.json()
      
      setLeads(data.leads)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchLeads()
    }
  }, [JSON.stringify(filters), page, limit, autoFetch])

  return {
    leads,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchLeads,
  }
}

// ========================================
// 📄 src/hooks/useStats.ts
// ========================================

import { useState, useEffect } from 'react'

export function useStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stats')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}