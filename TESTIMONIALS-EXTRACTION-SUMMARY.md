# Testimonials Extraction Summary

## Overview
Comprehensive extraction of ALL testimonials from Mestre Ye's Notion export with images and text.

**Extraction Date:** 2026-01-14
**Total Files Processed:** 110 markdown files
**Output File:** `testimonials-complete-with-images.json` (207KB)

---

## Statistics

### Total Testimonials: **110**

### By Health Condition:
- **DOR (Pain):** 23 testimonials
- **ANSIEDADE (Anxiety):** 11 testimonials
- **SONO (Sleep/Insomnia):** 10 testimonials
- **LABIRINTITE (Labyrinthitis):** 2 testimonials
- **FIBROMIALGIA (Fibromyalgia):** 2 testimonials
- **ZUMBIDO (Tinnitus):** 1 testimonial
- **DEPRESSÃO (Depression):** 1 testimonial

### Media:
- **Testimonials with images:** 106 out of 110 (96%)
- **Total images:** 200+ image files (PNG/JPG/JPEG)
- **Manually extracted image text:** 3 compilations with multiple testimonials

---

## Key Findings

### 🔥 PRIORITY TESTIMONIALS

#### 1. ZUMBIDO E LABIRINTITE Collection
**Category:** ZUMBIDO + LABIRINTITE
**Images:** 33 testimonial screenshots
**Format:** YouTube comments
**Key Results:**
- Multiple people reporting reduction in tinnitus volume
- Some report near-complete disappearance of symptoms
- Quick results - improvements in days/weeks

**Sample Testimonials Extracted:**
1. **@oniviapantoja**: "Gente do céu, zumbido que alto, quase sumiu, meu Deus, obrigada."
2. **@mteresaguedes**: "Muito obrigada, mestre. Essa massagem funcionou comigo. Diminuiu o volume do zumbido, que estava insuportável. Vou continuar fazendo."
3. **@silvinhapereirafl**: "Faço já dois exercícios que ensinasse este terceiro bom também. Tenho melhorado muito. Gratidão. Os zumbidos começaram a pouco tempo mas incomodam. Os exercícios são ótimos."
4. **Delvina Maia**: "Mestre, boa noite. Fiz os exercícios de ontem hoje cedo tbm e senti um pouco o joelho e ombro direito livre. Mas quero falar algo INCRÍVEL que aconteceu: SUMIU A LABIRINTITE !!"

#### 2. Print labirintite
**Category:** LABIRINTITE
**Images:** 1 video screenshot
**Result:** Complete disappearance of labyrinthitis symptoms

#### 3. Compilado de DORES (Pain Compilation)
**Category:** DOR
**Images:** 12 testimonial screenshots
**Focus Areas:** Lower back pain, knee pain, foot pain

**Sample Testimonials Extracted:**
1. **Mariza Belmonte**: "A minha dor praticamente sumiu!! Obrigada"
2. **Sueli Torres Rodrigues**: "Estava com muita dor na lombar, melhorou bastante"
3. **Rose Dias**: "estou muito bem a dor dos pés melhorou"
4. **Rozany Castro**: "hj comecei com dor lombar, passou a dor...amei"

---

## Notable Individual Testimonials

### Strong Results with Percentages

**Norci Araujo** (Age 70)
- **Condition:** Fibromialgia
- **Result:** "Minha Fibromialgia melhorou 80%. Só não 100% porque não faço todos os dias"
- **Improvement:** 80%

### Pain Relief

**Ana Barguil**
- **Condition:** Chronic hip pain (years)
- **Result:** "Eu tenho ou tinha há muitos anos uma dor no quadril […] já faz alguns dias que estou zerada. O Qi Gong é fantástico"
- **Improvement:** 100% pain-free

**Marcia Miura**
- **Condition:** Lower back pain
- **Result:** "Tive dores na lombar e com práticas de Qi Gong todos os dias sumiram minhas dores"
- **Improvement:** Complete disappearance

**Rosalvo Filho**
- **Condition:** Chronic lower back pain
- **Result:** Long detailed testimonial about gradual improvement with daily practice

### Anti-Aging & Vitality

**@cosarcadandu** (Age 49)
- **Result:** "O meu corpo está se modelando como há 20 anos. A vitalidade, alegria, sem dores. Façam os exercícios."
- **Tags:** Body remodeling, increased vitality, pain-free

**Conchita Miranda** (Age 82)
- **Result:** "Tenho 82 anos e ainda dou aulas de Dança Circular"
- **Tags:** Active at 82, teaching dance classes

### Mental Health

**Paula Cristiane**
- **Condition:** Anxiety crisis
- **Result:** "O Qi Gong ajudou muito na minha crise de ansiedade. Hoje sou outra pessoa"

**Valda Maria dos Santos**
- **Condition:** Acute anxiety
- **Result:** "Hoje eu estava muito ansiosa. Fiz movimentos que você postou aqui e me senti bem melhor."

### Sleep

**Izilda da Silva**
- **Condition:** Severe insomnia
- **Before:** "Antes ficava 2 a 3 dias sem dormir e quando dormia, não passava de 3 horas"
- **Result:** Significant improvement in sleep quality

**Lourdes Brum** (Age 72)
- **Result:** "Me senti renovada e minha filha autista teve um sono profundo."
- **Special:** Helped autistic daughter sleep deeply

### Fibromyalgia

**Solange Bento**
- **Condition:** Fibromialgia
- **Result:** "Sinto meu corpo se soltando aos poucos"

### Energy & Disposition

**Elaine Alves Teixeira**
- **Condition:** Depression, low energy
- **Result:** "Voltei a sentir algo que há muito tempo não sentia…disposição e alegria!"

### Practicing While Bedridden

**Alexandre**
- **Condition:** Bedridden
- **Result:** "Quando iniciei o curso estava de cama, então praticava deitado. […] Grato por restabelecer minha ligação mais profunda com essa arte, Mestre Ye"
- **Note:** Started seeing benefits even practicing lying down

### Tranquility

**Elza de Souza Borges**
- **Result:** "DISSE QUE O CURSO DE QI GONG FOI UM DOS MELHORES INVESTIMENTOS QUE JÁ FEZ"
- **Quote:** "Me passa uma tranquilidade, pareço flutuar"

---

## Data Structure

Each testimonial in the JSON contains:

```json
{
  "id": "unique_id",
  "client_name": "Name or username",
  "testimonial_text": "Main testimonial quote",
  "head": "Headline/summary",
  "highlight": "Key highlight quote",
  "health_conditions": ["ZUMBIDO", "DOR", "ANSIEDADE", etc.],
  "tags": ["specific_tags", "dor_lombar", "fibromialgia", etc.],
  "age": "age if provided",
  "channel": "Instagram/Youtube/Whatsapp/etc",
  "format": "Print/Video/Audio",
  "main_theme": "Qi Gong/Curso/Método",
  "objections_broken": "List of objections addressed",
  "images": ["filename1.jpg", "filename2.png"],
  "image_paths": ["full/path/to/image"],
  "folder_path": "folder containing images",
  "md_file": "path to markdown source",
  "extracted_testimonials": [
    {
      "username": "user",
      "text": "testimonial text from image",
      "image": "source_image.jpg"
    }
  ]
}
```

---

## Categories & Tags

### Main Health Conditions:
- ZUMBIDO (tinnitus)
- LABIRINTITE (labyrinthitis)
- DOR (pain)
- FIBROMIALGIA (fibromyalgia)
- ANSIEDADE (anxiety)
- SONO (sleep issues)
- DEPRESSAO (depression)

### Specific Tags:
- dor_lombar (lower back pain)
- dor_joelho (knee pain)
- dor_quadril (hip pain)
- dor_coluna (spine pain)
- dor_ombro (shoulder pain)
- insonia (insomnia)
- ansiedade (anxiety)
- fibromialgia (fibromyalgia)
- energia (energy)
- disposicao (disposition)
- resultado_X% (percentage results)

---

## Channel Distribution

- **YouTube:** Largest source (comments on videos)
- **Instagram:** Social media testimonials
- **WhatsApp:** Direct messages
- **Hotmart:** Course platform reviews
- **Memberkit:** Course member comments

---

## Format Distribution

- **Print:** Screenshots of text testimonials (majority)
- **Video:** Video testimonials
- **Audio:** Audio testimonials

---

## Image Files

### Total Images: 200+ files across all testimonials

### Largest Collections:
1. **ZUMBIDO E LABIRINTITE:** 33 images
2. **CPL 3 - QIG16:** 22 images
3. **QIG12 Comentários CPL2:** 20 images
4. **Compilado de DORES:** 12 images
5. **QIG12 Comentários CPL1:** 14 images
6. **Depoimentos Escritos sobre CPL 1:** 8 images

---

## Key Insights for Marketing

### Best Use Cases for Quiz Results:

1. **ZUMBIDO (Tinnitus)**
   - Multiple testimonials showing volume reduction
   - Quick results possible
   - Non-invasive alternative

2. **LABIRINTITE (Labyrinthitis)**
   - Complete symptom disappearance reported
   - Strong emotional impact ("INCRÍVEL")

3. **DOR (Pain) - especially:**
   - Lower back pain (dor lombar)
   - Hip pain (dor quadril)
   - Chronic pain (years of suffering)
   - 100% pain-free results in some cases

4. **FIBROMIALGIA**
   - 80% improvement reported
   - Body "loosening up" sensation

5. **ANSIEDADE (Anxiety)**
   - Life-changing results ("outra pessoa")
   - Quick relief possible

6. **Anti-Aging/Vitality**
   - Body remodeling like 20 years ago
   - Active at 82 years old
   - Teaching dance at 82

7. **Sleep Issues**
   - Severe insomnia improvement
   - Deep sleep for autistic children

---

## Recommendations

### For Quiz Integration:

1. **Match quiz results to testimonials**
   - ZUMBIDO quiz result → Show ZUMBIDO testimonials
   - DOR LOMBAR result → Show lower back pain testimonials
   - ANSIEDADE result → Show anxiety relief testimonials

2. **Use strong quotes in product recommendations:**
   - "Zumbido que alto, quase sumiu"
   - "Já faz alguns dias que estou zerada"
   - "SUMIU A LABIRINTITE !!"
   - "Fibromialgia melhorou 80%"
   - "Corpo está se modelando como há 20 anos"

3. **Highlight age diversity:**
   - 82 years old still teaching dance
   - 70 years old with 80% improvement
   - 49 feeling like 20 years ago

4. **Show quick results:**
   - Some improvements in days
   - "Praticamente sumiu"
   - "Passou a dor"

5. **Address objections:**
   - Can practice even while bedridden
   - Works for chronic conditions
   - Natural, non-invasive

---

## File Locations

- **Main JSON:** `C:\projetos\quiz-mtc\testimonials-complete-with-images.json`
- **Images Base Path:** `C:\Users\marko yoga\Downloads\5fcd8bb5-1475-4692-a271-322995cb6cee_ExportBlock-00831fa7-3bc9-456e-8176-d071f91d1668\Private & Shared\Biblioteca de Depoimentos Mestre Ye\`

---

## Next Steps

1. **Copy images to project:** Consider copying key images to project folder for easy access
2. **Create thumbnail versions:** For faster loading in quiz results
3. **Translate key quotes:** If needed for different language versions
4. **Categorize by product:** Map testimonials to specific courses/products
5. **A/B test:** Test different testimonial presentations in quiz results

---

## Technical Details

**Extraction Tools:**
- Node.js script for bulk processing
- Markdown parsing for metadata
- Image cataloging by folder
- Manual extraction for key images

**Data Quality:**
- 96% of testimonials have images
- Metadata extracted from 100% of files
- Manual enrichment for top 17 testimonials
- Categorization by health condition and tags

---

**Generated:** 2026-01-14
**Total Processing Time:** ~30 minutes
**Files Processed:** 110 MD + 200+ images
**Data Completeness:** High (96% with images)
