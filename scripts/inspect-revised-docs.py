from pathlib import Path
from docx import Document

FILES = [
    Path(r"C:\Users\admin\Desktop\实用对话.docx"),
    Path(r"C:\Users\admin\Desktop\老挝语的构词法.docx"),
]

for path in FILES:
    doc = Document(path)
    print(f"=== {path.name} ===")
    print(f"paragraphs={len(doc.paragraphs)} tables={len(doc.tables)}")
    for p in doc.paragraphs:
        red = []
        for run in p.runs:
            color = run.font.color.rgb if run.font.color and run.font.color.rgb else None
            if color:
                red.append(f"{run.text!r}:{color}")
        if red:
            print("RED paragraph:", p.text)
            print("  ", " | ".join(red))
    for ti, table in enumerate(doc.tables):
        for ri, row in enumerate(table.rows):
            for ci, cell in enumerate(row.cells):
                for p in cell.paragraphs:
                    red = []
                    for run in p.runs:
                        color = run.font.color.rgb if run.font.color and run.font.color.rgb else None
                        if color:
                            red.append(f"{run.text!r}:{color}")
                    if red:
                        print(f"RED table={ti} row={ri} col={ci}: {p.text}")
                        print("  ", " | ".join(red))
    print("Paragraph headings:")
    for p in doc.paragraphs:
        text = p.text.strip()
        if text:
            print(text)
