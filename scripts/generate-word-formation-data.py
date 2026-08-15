from pathlib import Path
from docx import Document

source = Path(r"C:\Users\admin\Desktop\老挝语的构词法.docx")
target = Path("src/data/wordFormation.ts")
doc = Document(source)

def quote(value):
    return "'" + value.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"

paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
table = doc.tables[0]
rows = [[c.text.strip().replace('\n', ' ') for c in row.cells] for row in table.rows[1:]]

with target.open('w', encoding='utf-8', newline='\n') as f:
    f.write('export interface WordFormationPrefix { prefix: string; pinyin: string; meaning: string; pattern: string; example: string; }\n')
    f.write('export const wordFormationPrefixes: WordFormationPrefix[] = [\n')
    for row in rows:
        if len(row) >= 5:
            f.write('  { prefix: %s, pinyin: %s, meaning: %s, pattern: %s, example: %s },\n' % tuple(map(quote, row[:5])))
    f.write('];\n\nexport const wordFormationDocument: string[] = [\n')
    for line in paragraphs:
        f.write(f'  {quote(line)},\n')
    f.write('];\n')
print(f'generated {len(rows)} prefixes and {len(paragraphs)} paragraphs')
