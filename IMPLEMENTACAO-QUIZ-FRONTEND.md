# 🎯 Implementação Frontend - Quiz com Arquétipos

## ✅ Backend Concluído
- ✅ `lib/calcularArquetipo.js` criado
- ✅ `lib/calculos.js` atualizado para incluir arquétipos
- ✅ Commit: a4c17107

---

## 📋 TASK 1: Adicionar 5 Novas Perguntas (P14-P20)

### Localização:
Arquivo: `src/quiz.js`  
Posição: Dentro do array `const perguntas`, **APÓS a P13**

### Código para adicionar:

```javascript
    // Após P13, antes do ]; que fecha o array perguntas
    
    {
      id: 'P14',
      texto: 'Quando você sente dor ou um problema de saúde, qual dessas situações mais acontece com você?',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Eu aguento sozinha o máximo que consigo, não gosto de incomodar ninguém'
        },
        { 
          valor: 'B', 
          texto: 'Primeiro pesquiso muito, leio tudo que posso, preciso entender antes de agir'
        },
        { 
          valor: 'C', 
          texto: 'Resolvo o problema dos outros primeiro, só cuido de mim quando sobra tempo'
        },
        { 
          valor: 'D', 
          texto: 'Vejo como um sinal de que preciso mudar algo maior na minha vida'
        }
      ]
    },

    {
      id: 'P15',
      texto: 'Qual dessas frases você mais já disse (ou pensou) sobre sua saúde?',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: '"Não quero dar trabalho para meus filhos, preciso me virar sozinha"'
        },
        { 
          valor: 'B', 
          texto: '"Já tentei TANTA coisa que não funcionou... será que ISSO vai funcionar?"'
        },
        { 
          valor: 'C', 
          texto: '"Todo mundo precisa de mim, como vou arrumar tempo para cuidar de MIM?"'
        },
        { 
          valor: 'D', 
          texto: '"Sinto que essa dor está me chamando para uma transformação maior"'
        }
      ]
    },

    {
      id: 'P16',
      texto: 'Se você encontrasse uma solução PERFEITA para sua saúde hoje, o que te faria DUVIDAR e não começar?',
      subtexto: 'Seja completamente sincera, queremos entender sua maior preocupação',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Medo de falhar mais uma vez, de gastar e não funcionar como as outras coisas'
        },
        { 
          valor: 'B', 
          texto: 'Não ter tempo/disciplina porque preciso cuidar da casa, família, trabalho...'
        },
        { 
          valor: 'C', 
          texto: 'Preocupação de depender de alguém ou precisar de ajuda para seguir'
        },
        { 
          valor: 'D', 
          texto: 'Medo de que seja "mais do mesmo" e não uma transformação de verdade'
        },
        { 
          valor: 'E', 
          texto: 'Não tenho grandes dúvidas, estou pronta para começar'
        }
      ]
    },

    {
      id: 'P19',
      texto: 'Quando você decide investir em algo importante (como sua saúde), você:',
      tipo: 'single',
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Decido sozinha, não preciso consultar ninguém'
        },
        { 
          valor: 'B', 
          texto: 'Gosto de ouvir opinião do marido/filhos mas a decisão final é minha'
        },
        { 
          valor: 'C', 
          texto: 'Preciso conversar com a família antes de decidir'
        },
        { 
          valor: 'D', 
          texto: 'Depende da aprovação/ajuda financeira da família'
        }
      ]
    },

    {
      id: 'P20',
      texto: 'Atualmente, você já investe em cuidados com sua saúde além do plano de saúde?',
      subtexto: 'Ex: academia, terapias, suplementos, consultas particulares',
      tipo: 'multiple',
      max: 3,
      opcoes: [
        { 
          valor: 'A', 
          texto: 'Fisioterapia ou quiropraxia'
        },
        { 
          valor: 'B', 
          texto: 'Academia, pilates ou personal'
        },
        { 
          valor: 'C', 
          texto: 'Terapias alternativas (acupuntura, massagem)'
        },
        { 
          valor: 'D', 
          texto: 'Suplementos, vitaminas'
        },
        { 
          valor: 'E', 
          texto: 'Consultas médicas/exames particulares'
        },
        { 
          valor: 'F', 
          texto: 'Não invisto em nada além do plano de saúde'
        }
      ]
    }
```

---

## 📋 TASK 2: Adicionar State para Diagnóstico

### Localização:
Arquivo: `src/quiz.js`  
Posição: No início do componente `QuizMTC`, junto com os outros `useState`

### Código para adicionar:

```javascript
  const [resultadoDiagnostico, setResultadoDiagnostico] = useState(null);
```

---

## 📋 TASK 3: Atualizar finalizarQuiz()

### Localização:
Arquivo: `src/quiz.js`  
Posição: Dentro da função `finalizarQuiz`, no bloco `if (result.success)`

### Encontre:
```javascript
      if (result.success) {
        console.log('✅ QUIZ SALVO COM SUCESSO!');
        console.log('  User ID:', result.user_id);
        console.log('  Novo usuário?', result.is_new_user);
        console.log('  Diagnóstico:', result.diagnostico);
        console.log('  Redirect URL:', result.redirect_url);
        
        setStep('resultado');
        
        // Aguardar 2 segundos e redirecionar (já autenticado via endpoint integrado)
        setTimeout(() => {
          console.log('🔄 Redirecionando para:', result.redirect_url);
          window.location.href = result.redirect_url || 'https://black.qigongbrasil.com/diagnostico';
        }, 2000);
      }
```

### Substitua por:
```javascript
      if (result.success) {
        console.log('✅ QUIZ SALVO COM SUCESSO!');
        console.log('  Diagnóstico:', result.diagnostico);
        
        // Salvar diagnóstico completo no state
        setResultadoDiagnostico(result.diagnostico);
        
        setStep('resultado');
        
        // REMOVER redirect automático - deixar usuário ver resultado
        // setTimeout(() => {
        //   window.location.href = result.redirect_url;
        // }, 2000);
      }
```

---

## 📋 TASK 4: Instalar Recharts para Gráficos

### No terminal:
```bash
npm install recharts
```

---

## 📋 TASK 5: Criar Página de Resultado Visual

### Localização:
Arquivo: `src/quiz.js`  
Posição: Substituir completamente o bloco `if (step === 'resultado')`

Devido ao tamanho, vou criar um arquivo separado com o componente completo.
Veja: `src/components/PaginaResultado.jsx`

---

## ⚠️ IMPORTANTE - Ordem de Execução:

1. ✅ TASK 1: Adicionar perguntas P14-P20
2. ✅ TASK 2: Adicionar state `resultadoDiagnostico`
3. ✅ TASK 3: Atualizar `finalizarQuiz()`
4. ✅ TASK 4: Instalar `recharts`
5. ✅ TASK 5: Ver arquivo `PaginaResultado.jsx` para componente completo

---

## 🎯 Resultado Final:

- Quiz com 18 perguntas (de 13 → 18)
- Tempo estimado: 6-7 minutos
- Página de resultado visual com:
  - Score de prontidão (0-100)
  - Card de dor física + emocional + elemento MTC
  - Card do arquétipo comportamental
  - Gráfico radar dos 5 elementos
  - Gráfico de barras (intensidade/urgência/prontidão)
  - Sistema de recomendação condicional (produtos)
  - CTAs duplos (Especialista / Mestre Ye Digital)

---

## 🚀 Após implementar:

```bash
git add src/quiz.js src/components/PaginaResultado.jsx
git commit -m "feat: add 5 behavioral questions + visual result page

- Add P14-P20 questions (archetypes, objections, autonomy, investment)
- Create visual result page with charts (Recharts)
- Conditional product recommendation system
- Score-based offers (80+: Preventiva only, 50-79: Tabs, <50: Secondary products)
- Remove auto-redirect to let user see results"
git push origin main
```
