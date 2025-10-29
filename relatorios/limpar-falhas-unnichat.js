// relatorios/limpar-falhas-unnichat.js
// Script para organizar e corrigir dados de falhas para reenvio no Unnichat
// Uso: node relatorios/limpar-falhas-unnichat.js

const fs = require('fs');
const path = require('path');
const csvPath = path.join(__dirname, 'falhas-unnichat.csv');
const outputPath = path.join(__dirname, 'falhas-unnichat-limpo.csv');

function normalizePhone(phone) {
  // Remove tudo que não é número
  let digits = (phone || '').replace(/\D/g, '');
  // Remove repetições excessivas de 5
  digits = digits.replace(/(5{3,})/g, '55');
  // Corrige para DDI 55 + 11 dígitos
  if (digits.length === 13 && digits.startsWith('55')) {
    digits = digits.slice(0, 13);
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    digits = digits.slice(0, 4) + digits.slice(-8); // tenta corrigir fixo
  }
  if (digits.length > 13) {
    digits = digits.slice(0, 13);
  }
  // Aceita apenas 13 dígitos (DDI 55 + DDD + número)
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  // Aceita 11 dígitos (sem DDI)
  if (digits.length === 11) return '55' + digits;
  // Aceita 12 dígitos (fixo com DDI)
  if (digits.length === 12 && digits.startsWith('55')) return digits;
  return '';
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(';');
  return lines.slice(1).map(line => {
    const cols = line.split(';');
    const obj = {};
    header.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
}

function toCSV(rows, header) {
  return [header.join(';'), ...rows.map(r => header.map(h => r[h] || '').join(';'))].join('\n');
}

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error('Arquivo CSV de falhas não encontrado:', csvPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const data = parseCSV(raw);
  const seen = new Set();
  const cleaned = data
    .map(row => {
      row.telefone = normalizePhone(row.telefone);
      return row;
    })
    .filter(row => row.telefone && !seen.has(row.telefone))
    .filter(row => !row.telefone.startsWith('555555') && row.telefone.length >= 12 && row.telefone.length <= 13)
    .map(row => {
      seen.add(row.telefone);
      return {
        nome: row.nome,
        email: row.email,
        telefone: row.telefone,
        diagnostico: row.diagnostico || '',
        referral_link: row.referral_link || ''
      };
    });
  const header = ['nome', 'email', 'telefone', 'diagnostico', 'referral_link'];
  fs.writeFileSync(outputPath, toCSV(cleaned, header), 'utf8');
  console.log(`Arquivo limpo gerado: ${outputPath}`);
  console.log(`Total de registros válidos: ${cleaned.length}`);
}

main();
