#!/usr/bin/env node
/**
 * Enrich testimonials JSON with manually extracted image text
 */

const fs = require('fs');
const path = require('path');

// Manual extractions from images I read
const manualExtractions = {
  "ZUMBIDO E LABIRINTITE 28510a87bb6b80009352e86e177f0e1b": {
    extracted_testimonials: [
      {
        username: "oniviapantoja",
        text: "Gente do céu, zumbido que alto, quase sumiu, meu Deus, obrigada.",
        image: "IMG_0136.jpeg"
      },
      {
        username: "mteresaguedes",
        text: "Muito obrigada, mestre. Essa massagem funcionou comigo. Diminuiu o volume do zumbido, que estava insuportável. Vou continuar fazendo. Obrigada",
        image: "IMG_0084.jpeg and IMG_0109.jpeg"
      },
      {
        username: "silvinhapereirafl oripa",
        text: "Faço já dois exercícios que ensinasse este terceiro bom também. Tenho melhorado muito. Gratidão. Os zumbidos começaram a pouco tempo mas incomodam. Os exercícios são ótimos. Agradeço.",
        image: "IMG_0110.jpeg"
      },
      {
        username: "Delvina Maia",
        text: "Mestre, boa noite. Fiz os exercícios de ontem hoje cedo tbm e senti um pouco o joelho e ombro direito livre. Mas quero falar algo INCRÍVEL que aconteceu: SUMIU A LABIRINTITE !!",
        image: "IMG_0138.jpeg (from Print labirintite context)"
      },
      {
        username: "nega_cida",
        text: "Estou gostando muito de fazer, me sentindo bem melhor, obrigada",
        image: "IMG_0140.jpeg"
      },
      {
        username: "sandraveneroso",
        text: "Gente, eu fiz só um pouquinho e, já diminuiu bastante, obrigada mestre",
        image: "IMG_0139.jpeg"
      },
      {
        username: "padovanigarcia",
        text: "Estou fazendo esse exercício ótimo obrigada mestre",
        image: "IMG_0138.jpeg"
      },
      {
        username: "marciagirello",
        text: "Senti diferença! Obrigada!",
        image: "IMG_0137.jpeg"
      }
    ]
  },
  "Compilado de DORES 1ee10a87bb6b8020988cdef487ad6b09": {
    extracted_testimonials: [
      {
        username: "Mariza Belmonte",
        text: "A minha dor praticamente sumiu!! Obrigada",
        image: "image.png"
      },
      {
        username: "Sueli Torres Rodrigues",
        text: "Estava com muita dor na lombar, melhorou bastante",
        image: "image 1.png"
      },
      {
        username: "Rose Dias",
        text: "estou muito bem a dor dos pés melhorou",
        image: "image 2.png"
      },
      {
        username: "Sueli Torres Rodrigues",
        text: "estava com dor o dia todo, melhorei muito",
        image: "image 2.png"
      },
      {
        username: "Rozany Castro",
        text: "hj comecei com dor lombar, passou a dor...amei",
        image: "image 3.png"
      }
    ]
  },
  "Rosalvo Filho - Dor Lombar 14910a87bb6b8198b5eac7f82bb612db": {
    extracted_testimonials: [
      {
        name: "Rosalvo Filho",
        text: "Caro Mestre Ye, Creio que não fui abusado, ou cacho ranera. Respondendo a e-mail) [...] participei das primeiras, elas agora foram ministradas aulas sua segunda. Assim, assisto e não deixo de também assistir. Como mencionei no questionário, a primeira motivação para fazer o Qi Gong foi a necessidade de resolver o problema de dor na lombar que me incomoda. As lições de segunda, as 20h, participei das primeiras, elas agora foram ministradas aulas sua segunda. [...] Mas, como mencionei no vídeo 'o importante é disciplina e conhecer o motivo de cada exercício.' Confesso que não falta muita disciplina, mas estou tentando melhor isso também. Enfim, fico grato pelo seu empenho em nos orientar e proporcionar a e experiência do Qi Gong.",
        details: "Long testimonial about reducing back pain through consistent practice"
      }
    ]
  },
  "Marcia Miura 1a210a87bb6b80bb871ad47767ea2c61": {
    testimonial_text: "Tive dores na lombar e com práticas de Qi Gong todos os dias sumiram minhas dores",
    head: "DORES NA LOMBAR SUMIRAM COM QI GONG DIÁRIO"
  },
  "Lourdes Brum 1a210a87bb6b804d8783d9761b67ef00": {
    testimonial_text: "Me senti renovada e minha filha autista teve um sono profundo.",
    head: "SE SENTIU RENOVADA E FILHA AUTISTA DORMIU PROFUNDAMENTE",
    age: "72"
  },
  "Norci Araujo - Aluna Mestre Ye 1ee10a87bb6b802c8fb9ce3806fb64ec": {
    testimonial_text: "Tenho 70 anos e minha Fibromialgia melhorou 80%. Só não 100% porque não faço todos os dias",
    head: "FIBROMIALGIA MELHOROU 80% AOS 70 ANOS",
    age: "70",
    result_percentage: 80
  },
  "Paula Cristiane 14910a87bb6b81dcbd80d880a6c02de7": {
    head: "QI GONG AJUDANDO EM CRISES DE ANSIEDADE",
    highlight: "O Qi Gong ajudou muito na minha crise de ansiedade. Hoje sou outra pessoa"
  },
  "Solange Bento 14910a87bb6b8156901be69c7b27d58b": {
    head: "Mesmo com fibromialgia sentiu o corpo se soltando com ajuda do Qi Gong",
    highlight: "Sinto meu corpo se soltando aos poucos"
  },
  "Elaine Alves Teixeira 14910a87bb6b8136ac6aeccbc6b2bae2": {
    testimonial_text: "Voltei a sentir algo que há muito tempo não sentia…disposição e alegria!"
  },
  "Ana Barguil 14910a87bb6b81b9b11ff6b0229cf9a5": {
    head: "ZEROU DORES NO QUADRIL DEPOIS DE ANOS",
    highlight: "Eu tenho ou tinha há muitos anos uma dor no quadril […] já faz alguns dias que estou zerada. O Qi Gong é fantástico"
  },
  "Elza de Souza Borges katt Brito 14910a87bb6b8143a029cddeff031057": {
    head: "DISSE QUE O CURSO DE QI GONG FOI UM DOS MELHORES INVESTIMENTOS QUE JÁ FEZ",
    highlight: "Me passa uma tranquilidade, pareço flutuar"
  },
  "Alexandre - Curso Depoimento Hotmart 14910a87bb6b81faa757d6a18cdcf7ce": {
    head: "COMEÇOU A PRATICAR QI GONG MESMO ESTANDO 'DE CAMA', E JÁ COMEÇOU A COLHER OS BENEFÍCIOS",
    highlight: "Quando iniciei o curso estava de cama, então praticava deitado. […] Grato por restabelecer minha ligação mais profunda com essa arte, Mestre Ye"
  },
  "Izilda da Silva - ins+¦nia 14910a87bb6b812b9136eca18ce19f2f": {
    head: "Melhorou a insônia com Qi Gong!",
    highlight: "Antes ficava 2 a 3 dias sem dormir e quando dormia, não passava de 3 horas"
  },
  "Marta Dias - Aluna Mestre Ye #14 1ee10a87bb6b808a822bc681460c84c3": {
    testimonial_text: "Praticando desde março 2025, já sinto muitos resultados em dores e flexibilidade"
  },
  "Conchita Miranda - Aluna Mestre Ye 1ee10a87bb6b80559eb7dfb44753a825": {
    testimonial_text: "Tenho 82 anos e ainda dou aulas de Dança Circular",
    age: "82"
  },
  "@cosarcadandu 1e310a87bb6b80398015e87359ef544c": {
    testimonial_text: "O meu corpo está se modelando como há 20 anos. A vitalidade, alegria, sem dores. Façam os exercícios.",
    head: "CORPO SE REMODELANDO COMO HÁ 20 ANOS - SEM DORES",
    age: "49"
  },
  "Valda Maria dos Santos 1a210a87bb6b80fb87efebcd9204e23a": {
    testimonial_text: "Hoje eu estava muito ansiosa. Fiz movimentos que você postou aqui e me senti bem melhor."
  }
};

function enrichTestimonials() {
  // Read original JSON
  const jsonPath = path.join('C:\\projetos\\quiz-mtc', 'testimonials-complete-with-images.json');
  const testimonials = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Enrich with manual extractions
  for (const testimonial of testimonials) {
    const enrichment = manualExtractions[testimonial.id];
    if (enrichment) {
      // Merge enrichment data
      Object.assign(testimonial, enrichment);

      // If there are extracted testimonials from images, highlight it
      if (enrichment.extracted_testimonials) {
        testimonial.has_extracted_image_text = true;
        testimonial.extracted_count = enrichment.extracted_testimonials.length;
      }
    }
  }

  // Save enriched version
  const outputPath = path.join('C:\\projetos\\quiz-mtc', 'testimonials-complete-with-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(testimonials, null, 2), 'utf-8');

  console.log('✓ Enriched testimonials saved!');
  console.log(`Total testimonials: ${testimonials.length}`);
  console.log(`Manually enriched: ${Object.keys(manualExtractions).length}`);

  // Count testimonials with extracted text
  const withExtracted = testimonials.filter(t => t.extracted_testimonials).length;
  console.log(`Testimonials with extracted image text: ${withExtracted}`);
}

enrichTestimonials();
