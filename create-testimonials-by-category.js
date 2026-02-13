#!/usr/bin/env node
/**
 * Create categorized view of all testimonials
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join('C:\\projetos\\quiz-mtc', 'testimonials-complete-with-images.json');
const testimonials = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Group by health conditions
const byCondition = {};
const categories = ['ZUMBIDO', 'LABIRINTITE', 'DOR', 'FIBROMIALGIA', 'ANSIEDADE', 'SONO', 'DEPRESSAO'];

for (const category of categories) {
  byCondition[category] = testimonials.filter(t =>
    t.health_conditions.includes(category)
  );
}

// Create markdown report
let report = '# Testimonials by Category\n\n';
report += `**Total Testimonials:** ${testimonials.length}\n\n`;
report += '---\n\n';

for (const category of categories) {
  const items = byCondition[category];
  if (items.length === 0) continue;

  report += `## ${category} (${items.length} testimonials)\n\n`;

  for (const item of items) {
    report += `### ${item.client_name}\n\n`;

    if (item.age) report += `**Age:** ${item.age}\n\n`;
    if (item.channel) report += `**Channel:** ${item.channel}\n\n`;

    if (item.testimonial_text && item.testimonial_text !== '☑️') {
      report += `**Testimonial:** "${item.testimonial_text}"\n\n`;
    }

    if (item.head) {
      report += `**Headline:** ${item.head}\n\n`;
    }

    if (item.highlight) {
      report += `**Highlight:** "${item.highlight}"\n\n`;
    }

    if (item.objections_broken) {
      report += `**Objections Broken:** ${item.objections_broken}\n\n`;
    }

    if (item.tags && item.tags.length > 0) {
      report += `**Tags:** ${item.tags.join(', ')}\n\n`;
    }

    if (item.images && item.images.length > 0) {
      report += `**Images:** ${item.images.length} file(s)\n\n`;
    }

    if (item.extracted_testimonials) {
      report += `**Extracted from images (${item.extracted_testimonials.length}):**\n\n`;
      for (const extracted of item.extracted_testimonials) {
        report += `- **${extracted.username || extracted.name}**: "${extracted.text}"\n`;
      }
      report += '\n';
    }

    report += '---\n\n';
  }
}

// Save report
const outputPath = path.join('C:\\projetos\\quiz-mtc', 'TESTIMONIALS-BY-CATEGORY.md');
fs.writeFileSync(outputPath, report, 'utf-8');

console.log(`✓ Created categorized report: ${outputPath}`);
console.log(`\nSummary by category:`);
for (const category of categories) {
  const count = byCondition[category].length;
  if (count > 0) {
    console.log(`  ${category}: ${count} testimonials`);
  }
}
