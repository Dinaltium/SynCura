"""Generate PDF from LITERATURE_REVIEW.md (generic Markdown renderer).

Run: python generate_pdf.py
Output: SynCura_Literature_Review.pdf (same directory)
"""
import os
import re
from fpdf import FPDF


def sanitize(text):
    return (text
            .replace('\u2014', '--').replace('\u2013', '-').replace('\u2010', '-')
            .replace('\u2018', "'").replace('\u2019', "'")
            .replace('\u201c', '"').replace('\u201d', '"')
            .replace('\u2026', '...').replace('\u2022', '-')
            .replace('\u2212', '-').replace('\u00d7', 'x')
            .replace('\u2265', '>=').replace('\u2264', '<=')
            .replace('\u2192', '->'))


def strip_md(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    return text.strip()


class ReportPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 8, 'SynCura - Literature Review', align='C')
            self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(25, 60, 120)
        self.cell(0, 10, sanitize(title), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(25, 60, 120)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, sanitize(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def sub_section(self, title):
        self.set_font('Helvetica', 'BI', 10)
        self.set_text_color(80, 80, 80)
        self.cell(0, 7, sanitize(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, sanitize(strip_md(text)))
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.cell(5, 5.5, '-')
        self.multi_cell(0, 5.5, sanitize(strip_md(text)))
        self.ln(1)

    def table_row(self, cols, header=False):
        self.set_font('Helvetica', 'B' if header else '', 8)
        self.set_text_color(30, 30, 30)
        line = ' | '.join(sanitize(strip_md(c)) for c in cols)
        self.multi_cell(0, 5, line)
        if header:
            self.set_draw_color(25, 60, 120)
            self.line(10, self.get_y(), 200, self.get_y())
        self.ln(1)


def parse_table_row(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


def is_table_divider(line):
    cells = parse_table_row(line)
    return len(cells) > 0 and all(len(c) > 0 and set(c) <= set('-: ') for c in cells)


def build_pdf():
    base = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base, 'LITERATURE_REVIEW.md')
    with open(md_path, encoding='utf-8') as f:
        lines = f.read().splitlines()

    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Title page
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(25, 60, 120)
    pdf.cell(0, 15, 'SynCura', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 16)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, 'Predictive ICU Monitoring System', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(25, 60, 120)
    pdf.cell(0, 12, 'Literature Review', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(20)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, 'Mini-Project Report', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, 'College Course Project', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(30)
    pdf.set_draw_color(25, 60, 120)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())

    pdf.add_page()
    i = 0
    para = []
    in_table = False
    table_header_done = False

    def flush_para():
        if para:
            pdf.body_text(' '.join(para))
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()

        if s.startswith('|') and s.endswith('|'):
            flush_para()
            if is_table_divider(s):
                table_header_done = True
            else:
                cols = parse_table_row(s)
                pdf.table_row(cols, header=(not table_header_done and not in_table))
                in_table = True
            i += 1
            continue
        else:
            in_table = False
            table_header_done = False

        if not s:
            flush_para()
        elif s == '---':
            flush_para()
            pdf.ln(2)
        elif s.startswith('# '):
            flush_para()
            pdf.chapter_title(strip_md(s[2:]))
        elif s.startswith('## '):
            flush_para()
            pdf.section_title(strip_md(s[3:]))
        elif s.startswith('### '):
            flush_para()
            pdf.sub_section(strip_md(s[4:]))
        elif s.startswith(('- ', '* ')):
            flush_para()
            pdf.bullet(s[2:])
        else:
            para.append(s)
        i += 1
    flush_para()

    out_path = os.path.join(base, 'SynCura_Literature_Review.pdf')
    pdf.output(out_path)
    print(f'PDF saved to: {out_path}')


if __name__ == '__main__':
    build_pdf()
