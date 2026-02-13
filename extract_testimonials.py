#!/usr/bin/env python3
"""
Extract all testimonials from Notion export with images and text
"""

import os
import json
import re
from pathlib import Path

BASE_PATH = r"C:\Users\marko yoga\Downloads\5fcd8bb5-1475-4692-a271-322995cb6cee_ExportBlock-00831fa7-3bc9-456e-8176-d071f91d1668\Private & Shared\Biblioteca de Depoimentos Mestre Ye"

def extract_metadata_from_md(md_content):
    """Extract metadata from markdown front matter"""
    metadata = {}
    lines = md_content.split('\n')

    for line in lines:
        # Extract title (first # heading)
        if line.startswith('# '):
            metadata['name'] = line.replace('# ', '').strip()

        # Extract key-value pairs
        if ':' in line and not line.startswith('#') and not line.startswith('!'):
            parts = line.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()

                # Map Portuguese metadata keys
                key_mapping = {
                    'Formato': 'format',
                    'Tema Principal': 'main_theme',
                    'Canal': 'channel',
                    'Objeções Quebradas': 'objections_broken',
                    'Frase Principial': 'main_phrase',
                    'Idade': 'age'
                }

                mapped_key = key_mapping.get(key, key.lower().replace(' ', '_'))
                metadata[mapped_key] = value

    # Extract HEAD and DESTAQUE from markdown
    head_match = re.search(r'\*\*HEAD:?\*\*\s*(.+?)(?:\n|$)', md_content, re.IGNORECASE)
    if head_match:
        metadata['head'] = head_match.group(1).strip()

    destaque_match = re.search(r'\*\*DESTAQUE:?\*\*\s*["\']?(.+?)["\']?(?:\n|$)', md_content, re.IGNORECASE)
    if destaque_match:
        metadata['highlight'] = destaque_match.group(1).strip()

    return metadata

def find_images_for_folder(folder_path):
    """Find all images in a testimonial folder"""
    images = []
    folder = Path(folder_path)

    if folder.exists() and folder.is_dir():
        for ext in ['*.png', '*.jpg', '*.jpeg']:
            images.extend([str(img) for img in folder.glob(ext)])

    return images

def categorize_testimonial(metadata, content):
    """Categorize testimonial based on content"""
    categories = []
    tags = []

    # Combine all text for analysis
    full_text = ' '.join([
        metadata.get('name', ''),
        metadata.get('main_phrase', ''),
        metadata.get('head', ''),
        metadata.get('highlight', ''),
        metadata.get('objections_broken', ''),
        content
    ]).lower()

    # Health conditions
    if 'zumbido' in full_text:
        categories.append('ZUMBIDO')
        tags.append('zumbido')

    if 'labirintite' in full_text:
        categories.append('LABIRINTITE')
        tags.append('labirintite')

    if 'dor' in full_text or 'dores' in full_text:
        categories.append('DOR')
        if 'lombar' in full_text:
            tags.append('dor_lombar')
        if 'joelho' in full_text:
            tags.append('dor_joelho')
        if 'quadril' in full_text:
            tags.append('dor_quadril')
        if 'coluna' in full_text:
            tags.append('dor_coluna')
        if 'ombro' in full_text:
            tags.append('dor_ombro')

    if 'fibromialgia' in full_text:
        categories.append('FIBROMIALGIA')
        tags.append('fibromialgia')

    if 'ansiedade' in full_text:
        categories.append('ANSIEDADE')
        tags.append('ansiedade')

    if 'insônia' in full_text or 'insonia' in full_text or 'dormir' in full_text:
        categories.append('SONO')
        tags.append('insonia')

    if 'depressão' in full_text or 'depressao' in full_text:
        categories.append('DEPRESSAO')
        tags.append('depressao')

    if 'energia' in full_text or 'disposição' in full_text or 'disposicao' in full_text:
        tags.append('energia')
        tags.append('disposicao')

    # Extract percentages/numbers
    percentage_matches = re.findall(r'(\d+)%', full_text)
    if percentage_matches:
        tags.append(f"resultado_{max([int(p) for p in percentage_matches])}%")

    return list(set(categories)), list(set(tags))

def process_all_testimonials():
    """Process all testimonial markdown files"""
    testimonials = []
    base = Path(BASE_PATH)

    # Find all .md files
    md_files = list(base.glob('*.md'))

    print(f"Found {len(md_files)} markdown files to process...")

    for md_file in md_files:
        try:
            # Read markdown content
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract metadata
            metadata = extract_metadata_from_md(content)

            # Get folder name (remove hash suffix from filename)
            folder_name = md_file.stem
            # Remove hash suffix like "14910a87bb6b81d7bd44fb5e3aecff7d"
            folder_name = re.sub(r'\s+[a-f0-9]{32}$', '', folder_name)

            # Find corresponding folder and images
            folder_path = base / folder_name
            images = find_images_for_folder(folder_path)

            # Categorize
            categories, tags = categorize_testimonial(metadata, content)

            # Build testimonial object
            testimonial = {
                'id': md_file.stem,
                'client_name': metadata.get('name', folder_name),
                'testimonial_text': metadata.get('main_phrase', ''),
                'head': metadata.get('head', ''),
                'highlight': metadata.get('highlight', ''),
                'health_conditions': categories,
                'tags': tags,
                'age': metadata.get('age', ''),
                'channel': metadata.get('channel', ''),
                'format': metadata.get('format', ''),
                'main_theme': metadata.get('main_theme', ''),
                'objections_broken': metadata.get('objections_broken', ''),
                'images': [str(Path(img).name) for img in images],
                'image_paths': images,
                'folder_path': str(folder_path) if folder_path.exists() else '',
                'md_file': str(md_file)
            }

            testimonials.append(testimonial)

            # Print progress for important ones
            if any(cat in ['ZUMBIDO', 'LABIRINTITE', 'DOR'] for cat in categories):
                print(f"✓ {testimonial['client_name']}: {', '.join(categories)}")

        except Exception as e:
            print(f"Error processing {md_file.name}: {e}")

    return testimonials

def main():
    print("=" * 80)
    print("EXTRACTING ALL TESTIMONIALS FROM NOTION EXPORT")
    print("=" * 80)
    print()

    # Process all testimonials
    testimonials = process_all_testimonials()

    # Sort by categories (prioritize ZUMBIDO, LABIRINTITE, DOR)
    def sort_key(t):
        priority_categories = ['ZUMBIDO', 'LABIRINTITE', 'DOR', 'FIBROMIALGIA']
        for i, cat in enumerate(priority_categories):
            if cat in t['health_conditions']:
                return i
        return 999

    testimonials.sort(key=sort_key)

    # Statistics
    print()
    print("=" * 80)
    print("STATISTICS")
    print("=" * 80)
    print(f"Total testimonials: {len(testimonials)}")

    # Count by category
    category_counts = {}
    for t in testimonials:
        for cat in t['health_conditions']:
            category_counts[cat] = category_counts.get(cat, 0) + 1

    print("\nBy health condition:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    # Count with images
    with_images = sum(1 for t in testimonials if t['images'])
    print(f"\nTestimonials with images: {with_images}")

    # Save to JSON
    output_path = r"C:\projetos\quiz-mtc\testimonials-complete-with-images.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(testimonials, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Saved to: {output_path}")
    print()

    # Show sample of top testimonials
    print("=" * 80)
    print("TOP TESTIMONIALS (ZUMBIDO/LABIRINTITE/DOR)")
    print("=" * 80)

    top = [t for t in testimonials if any(cat in ['ZUMBIDO', 'LABIRINTITE', 'DOR']
                                          for cat in t['health_conditions'])][:10]

    for i, t in enumerate(top, 1):
        print(f"\n{i}. {t['client_name']}")
        print(f"   Categories: {', '.join(t['health_conditions'])}")
        if t['testimonial_text']:
            print(f"   Text: {t['testimonial_text'][:100]}...")
        if t['images']:
            print(f"   Images: {len(t['images'])} files")

if __name__ == '__main__':
    main()
