// 📄 src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ========================================
// 📄 src/types/database.types.ts
// ========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quiz_leads: {
        Row: QuizLead
        Insert: Omit<QuizLead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<QuizLead, 'id' | 'created_at'>>
      }
    }
  }
}

export interface QuizLead {
  // Identificação
  id: string
  nome: string
  email: string
  celular: string
  
  // Dados do Quiz
  respostas: QuizRespostas
  elemento_principal: Elemento | null
  codigo_perfil: string | null
  nome_perfil: string | null
  arquetipo: string | null
  emoji: string | null
  
  // Diagnóstico MTC
  quadrante: number | null
  diagnostico_resumo: string | null
  diagnostico_completo: string | null
  script_abertura: string | null
  
  // Lead Scoring
  lead_score: number | null
  prioridade: Prioridade | null
  is_hot_lead_vip: boolean | null
  
  // Status de Follow-up
  whatsapp_status: WhatsAppStatus
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface QuizRespostas {
  P1?: string  // Intensidade das dores
  P2?: string[] // Localização (múltipla)
  P3?: string  // Tempo de sintomas
  P4?: string[] // Sintomas físicos (múltipla)
  P5?: string  // Estado emocional
  P6?: string  // Tratamentos anteriores
  P7?: string  // Maior preocupação
  P8?: string  // Urgência
  P9?: string  // Intenção de participar
  P10?: string // Faixa etária
  P11?: string // Renda mensal
  P12?: string // Já é aluno
  P13?: string // Tempo que conhece
}

export type Elemento = 'RIM' | 'FIGADO' | 'BACO' | 'CORACAO' | 'PULMAO'
export type Prioridade = 'ALTA' | 'MEDIA' | 'BAIXA'
export type WhatsAppStatus = 
  | 'AGUARDANDO_CONTATO'
  | 'CONTATADO'
  | 'EM_CONVERSA'
  | 'QUALIFICADO'
  | 'INSCRITO'
  | 'CONVERTIDO'
  | 'NAO_RESPONDEU'
  | 'DESQUALIFICADO'

// ========================================
// 📄 src/lib/constants.ts
// ========================================

export const ELEMENTOS = {
  RIM: {
    nome: 'RIM',
    emoji: '🌊',
    cor: '#06b6d4',
    descricao: 'Água - Medo, ansiedade, dores lombares',
  },
  FIGADO: {
    nome: 'FÍGADO',
    emoji: '🌳',
    cor: '#10b981',
    descricao: 'Madeira - Raiva, frustração, tensão muscular',
  },
  BACO: {
    nome: 'BAÇO',
    emoji: '🌍',
    cor: '#f59e0b',
    descricao: 'Terra - Preocupação, digestão, cansaço',
  },
  CORACAO: {
    nome: 'CORAÇÃO',
    emoji: '🔥',
    cor: '#ef4444',
    descricao: 'Fogo - Ansiedade, insônia, agitação',
  },
  PULMAO: {
    nome: 'PULMÃO',
    emoji: '💨',
    cor: '#94a3b8',
    descricao: 'Metal - Tristeza, problemas respiratórios',
  },
} as const

export const PRIORIDADES = {
  ALTA: { label: 'Alta', cor: 'bg-red-500', textColor: 'text-red-600' },
  MEDIA: { label: 'Média', cor: 'bg-yellow-500', textColor: 'text-yellow-600' },
  BAIXA: { label: 'Baixa', cor: 'bg-green-500', textColor: 'text-green-600' },
} as const

export const WHATSAPP_STATUS_LABELS = {
  AGUARDANDO_CONTATO: 'Aguardando Contato',
  CONTATADO: 'Contatado',
  EM_CONVERSA: 'Em Conversa',
  QUALIFICADO: 'Qualificado',
  INSCRITO: 'Inscrito no Evento',
  CONVERTIDO: 'Convertido (Pagou)',
  NAO_RESPONDEU: 'Não Respondeu',
  DESQUALIFICADO: 'Desqualificado',
} as const

export const FAIXAS_ETARIAS = {
  A: '18-25 anos',
  B: '26-35 anos',
  C: '36-45 anos',
  D: '46-55 anos',
  E: '56-65 anos',
  F: '65+ anos',
} as const

export const FAIXAS_RENDA = {
  A: 'Até R$ 2.000',
  B: 'R$ 2.000 - R$ 4.000',
  C: 'R$ 4.000 - R$ 6.000',
  D: 'R$ 6.000 - R$ 8.000',
  E: 'R$ 8.000 - R$ 10.000',
  F: 'R$ 10.000 - R$ 15.000',
  G: 'R$ 15.000 - R$ 20.000',
  H: 'R$ 20.000 - R$ 30.000',
  I: 'R$ 30.000 - R$ 50.000',
  J: 'R$ 50.000+',
} as const

// ========================================
// 📄 src/lib/utils.ts
// ========================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/55${cleaned}${text}`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500'
  if (score >= 70) return 'bg-orange-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function getPrioridadeColor(prioridade: string): string {
  switch (prioridade) {
    case 'ALTA':
      return 'bg-red-500 text-white'
    case 'MEDIA':
      return 'bg-yellow-500 text-white'
    case 'BAIXA':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export function calculateDaysAgo(date: string | Date): number {
  const now = new Date()
  const past = new Date(date)
  const diffTime = Math.abs(now.getTime() - past.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}