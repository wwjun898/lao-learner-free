from pathlib import Path
from docx import Document

SOURCE = Path(r"C:\Users\admin\Desktop\实用对话.docx")
TARGET = Path("src/data/documentDialogues.ts")
ICONS = ['🔢','📅','📏','📍','🎨','🙂','🏥','💡','🍜','🚗','✈️','🏠','👕','👪','💼','🛒','🏢','🏦','🗓️','🌦️','🎵']

doc = Document(SOURCE)
headings = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
tables = doc.tables

def cell_text(cell):
    return ' '.join(p.text.strip() for p in cell.paragraphs if p.text.strip()).strip()

def q(value):
    return "'" + value.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"

items = []
for category_index, category in enumerate(headings):
    if category_index * 2 + 1 >= len(tables):
        break
    lines = []
    for table in tables[category_index * 2:category_index * 2 + 2]:
        for row in table.rows[1:]:
            cells = [cell_text(c) for c in row.cells]
            if len(cells) < 5 or not cells[2]:
                continue
            speaker = 'A' if cells[1] in ('你', '我', '顾客', '客户') else 'B'
            lines.append((cells[2], cells[3], cells[4], speaker))
    if lines:
        items.append((category, lines))

with TARGET.open('w', encoding='utf-8', newline='\n') as f:
    f.write("export interface DocumentDialogueLine { lao: string; chinese: string; pinyin: string; speaker: 'A' | 'B'; }\n")
    f.write("export interface DocumentDialogue { category: string; icon: string; title: string; scenario: string; level: 1 | 2 | 3; lines: DocumentDialogueLine[]; }\n\n")
    f.write("export const documentDialogues: DocumentDialogue[] = [\n")
    for index, (category, lines) in enumerate(items):
        icon = ICONS[index % len(ICONS)]
        f.write(f"  {{ category: {q(category)}, icon: {q(icon)}, title: {q(category)}, scenario: {q('围绕' + category + '进行日常交流')}, level: 1, lines: [\n")
        for lao, chinese, pinyin, speaker in lines:
            f.write(f"    {{ lao: {q(lao)}, chinese: {q(chinese)}, pinyin: {q(pinyin)}, speaker: '{speaker}' }},\n")
        f.write("  ]},\n")
    f.write("];\n")
print(f"generated {len(items)} categories, {sum(len(lines) for _, lines in items)} lines")
