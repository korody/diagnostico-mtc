#!/usr/bin/env node
/**
 * Extract all testimonials from Notion export with images and text
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = String.raw`C:\Users\marko yoga\Downloads\5fcd8bb5-1475-4692-a271-322995cb6cee_ExportBlock-00831fa7-3bc9-456e-8176-d071f91d1668\Private & Shared\Biblioteca de Depoimentos Mestre Ye`;

function extractMetadataFromMd(mdContent) {
  const metadata = {};
  const lines = mdContent.split('\n');

  for (const line of lines) {
    // Extract title (first # heading)
    if (line.startsWith('# ')) {
      metadata.name = line.replace('# ', '').trim();
    }

    // Extract key-value pairs
    if (line.includes(':') && !line.startsWith('#') && !line.startsWith('!')) {
      const parts = line.split(':', 2);
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();

        // Map Portuguese metadata keys
        const keyMapping = {
          'Formato': 'format',
          'Tema Principal': 'main_theme',
          'Canal': 'channel',
          'Objeções Quebradas': 'objections_broken',
          'Frase Principial': 'main_phrase',
          'Idade': 'age'
        };

        const mappedKey = keyMapping[key] || key.toLowerCase().replace(/\s+/g, '_');
        metadata[mappedKey] = value;
      }
    }
  }

  // Extract HEAD and DESTAQUE from markdown
  const headMatch = mdContent.match(/\*\*HEAD:?\*\*\s*(.+?)(?:\n|$)/i);
  if (headMatch) {
    metadata.head = headMatch[1].trim();
  }

  const destaqueMatch = mdContent.match(/\*\*DESTAQUE:?\*\*\s*["\']?(.+?)["\']?(?:\n|$)/i);
  if (destaqueMatch) {
    metadata.highlight = destaqueMatch[1].trim();
  }

  return metadata;
}

function findImagesForFolder(folderPath) {
  const images = [];

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return images;
  }

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      images.push(path.join(folderPath, file));
    }
  }

  return images;
}

function categorizeTestimonial(metadata, content) {
  const categories = [];
  const tags = [];

  // Combine all text for analysis
  const fullText = [
    metadata.name || '',
    metadata.main_phrase || '',
    metadata.head || '',
    metadata.highlight || '',
    metadata.objections_broken || '',
    content
  ].join(' ').toLowerCase();

  // Health conditions
  if (fullText.includes('zumbido')) {
    categories.push('ZUMBIDO');
    tags.push('zumbido');
  }

  if (fullText.includes('labirintite')) {
    categories.push('LABIRINTITE');
    tags.push('labirintite');
  }

  if (fullText.includes('dor') || fullText.includes('dores')) {
    categories.push('DOR');
    if (fullText.includes('lombar')) tags.push('dor_lombar');
    if (fullText.includes('joelho')) tags.push('dor_joelho');
    if (fullText.includes('quadril')) tags.push('dor_quadril');
    if (fullText.includes('coluna')) tags.push('dor_coluna');
    if (fullText.includes('ombro')) tags.push('dor_ombro');
  }

  if (fullText.includes('fibromialgia')) {
    categories.push('FIBROMIALGIA');
    tags.push('fibromialgia');
  }

  if (fullText.includes('ansiedade')) {
    categories.push('ANSIEDADE');
    tags.push('ansiedade');
  }

  if (fullText.includes('insônia') || fullText.includes('insonia') || fullText.includes('dormir')) {
    categories.push('SONO');
    tags.push('insonia');
  }

  if (fullText.includes('depressão') || fullText.includes('depressao')) {
    categories.push('DEPRESSAO');
    tags.push('depressao');
  }

  if (fullText.includes('energia') || fullText.includes('disposição') || fullText.includes('disposicao')) {
    tags.push('energia');
    tags.push('disposicao');
  }

  // Extract percentages/numbers
  const percentageMatches = fullText.match(/(\d+)%/g);
  if (percentageMatches) {
    const percentages = percentageMatches.map(p => parseInt(p));
    const maxPercent = Math.max(...percentages);
    tags.push(`resultado_${maxPercent}%`);
  }

  return [Array.from(new Set(categories)), Array.from(new Set(tags))];
}

function processAllTestimonials() {
  const testimonials = [];

  // Find all .md files
  const files = fs.readdirSync(BASE_PATH);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} markdown files to process...`);

  for (const mdFile of mdFiles) {
    try {
      const mdPath = path.join(BASE_PATH, mdFile);

      // Read markdown content
      const content = fs.readFileSync(mdPath, 'utf-8');

      // Extract metadata
      const metadata = extractMetadataFromMd(content);

      // Get folder name (remove hash suffix from filename)
      const folderName = path.parse(mdFile).name.replace(/\s+[a-f0-9]{32}$/, '');

      // Find corresponding folder and images
      const folderPath = path.join(BASE_PATH, folderName);
      const images = findImagesForFolder(folderPath);

      // Categorize
      const [categories, tags] = categorizeTestimonial(metadata, content);

      // Build testimonial object
      const testimonial = {
        id: path.parse(mdFile).name,
        client_name: metadata.name || folderName,
        testimonial_text: metadata.main_phrase || '',
        head: metadata.head || '',
        highlight: metadata.highlight || '',
        health_conditions: categories,
        tags: tags,
        age: metadata.age || '',
        channel: metadata.channel || '',
        format: metadata.format || '',
        main_theme: metadata.main_theme || '',
        objections_broken: metadata.objections_broken || '',
        images: images.map(img => path.basename(img)),
        image_paths: images,
        folder_path: fs.existsSync(folderPath) ? folderPath : '',
        md_file: mdPath
      };

      testimonials.push(testimonial);

      // Print progress for important ones
      if (categories.some(cat => ['ZUMBIDO', 'LABIRINTITE', 'DOR'].includes(cat))) {
        console.log(`✓ ${testimonial.client_name}: ${categories.join(', ')}`);
      }
    } catch (e) {
      console.error(`Error processing ${mdFile}: ${e.message}`);
    }
  }

  return testimonials;
}

function main() {
  console.log('='.repeat(80));
  console.log('EXTRACTING ALL TESTIMONIALS FROM NOTION EXPORT');
  console.log('='.repeat(80));
  console.log('');

  // Process all testimonials
  const testimonials = processAllTestimonials();

  // Sort by categories (prioritize ZUMBIDO, LABIRINTITE, DOR)
  const priorityCategories = ['ZUMBIDO', 'LABIRINTITE', 'DOR', 'FIBROMIALGIA'];
  testimonials.sort((a, b) => {
    const getPriority = (t) => {
      for (let i = 0; i < priorityCategories.length; i++) {
        if (t.health_conditions.includes(priorityCategories[i])) {
          return i;
        }
      }
      return 999;
    };
    return getPriority(a) - getPriority(b);
  });

  // Statistics
  console.log('');
  console.log('='.repeat(80));
  console.log('STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total testimonials: ${testimonials.length}`);

  // Count by category
  const categoryCounts = {};
  for (const t of testimonials) {
    for (const cat of t.health_conditions) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  console.log('\nBy health condition:');
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    console.log(`  ${cat}: ${count}`);
  }

  // Count with images
  const withImages = testimonials.filter(t => t.images.length > 0).length;
  console.log(`\nTestimonials with images: ${withImages}`);

  // Save to JSON
  const outputPath = path.join('C:\\projetos\\quiz-mtc', 'testimonials-complete-with-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(testimonials, null, 2), 'utf-8');

  console.log(`\n✓ Saved to: ${outputPath}`);
  console.log('');

  // Show sample of top testimonials
  console.log('='.repeat(80));
  console.log('TOP TESTIMONIALS (ZUMBIDO/LABIRINTITE/DOR)');
  console.log('='.repeat(80));

  const top = testimonials
    .filter(t => t.health_conditions.some(cat => ['ZUMBIDO', 'LABIRINTITE', 'DOR'].includes(cat)))
    .slice(0, 10);

  for (let i = 0; i < top.length; i++) {
    const t = top[i];
    console.log(`\n${i + 1}. ${t.client_name}`);
    console.log(`   Categories: ${t.health_conditions.join(', ')}`);
    if (t.testimonial_text) {
      console.log(`   Text: ${t.testimonial_text.substring(0, 100)}...`);
    }
    if (t.images.length > 0) {
      console.log(`   Images: ${t.images.length} files`);
    }
  }
}

main();
