const fs = require('fs');
const path = require('path');
const d = require('docx');
const { Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ImageRun } = d;

const ROOT = path.join(__dirname, '..', '..');
const FONT = 'Times New Roman';
const SIZE = 26; // 13pt
const CONTENT_WIDTH = 9071; // A4 21cm - lề 3cm - lề 2cm (twip)
let chapter = 0;
let figure = 0;
let table = 0;

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: SIZE, ...opts });

// Đoạn văn; hỗ trợ **in đậm** đơn giản trong chuỗi
function p(text, opts = {}) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  const children = parts.map((s) => (s.startsWith('**') ? run(s.slice(2, -2), { bold: true }) : run(s)));
  return new Paragraph({
    children,
    alignment: opts.align === 'left' ? AlignmentType.LEFT : (opts.align ?? AlignmentType.JUSTIFIED),
    spacing: { before: 60, after: 100, line: 340 },
    indent: opts.noIndent ? undefined : { firstLine: 567 },
  });
}

// Ô cần nhóm tự điền: tô vàng để dễ thấy
const fill = (text) => run(text, { highlight: 'yellow' });

function chapterTitle(text) {
  chapter += 1;
  figure = 0;
  table = 0;
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run(`CHƯƠNG ${chapter}. ${text.toUpperCase()}`, { bold: true, size: 30 })],
  });
}

function unnumbered(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run(text.toUpperCase(), { bold: true, size: 30 })],
  });
}

const h2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120 }, children: [run(text, { bold: true, size: 28 })] });
const h3 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { before: 180, after: 80 }, children: [run(text, { bold: true, italics: true })] });

function bullets(items) {
  return items.map((t) => {
    const parts = String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
    return new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60, line: 320 },
      children: parts.map((s) => (s.startsWith('**') ? run(s.slice(2, -2), { bold: true }) : run(s))),
    });
  });
}

function caption(prefix, n, text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [run(`${prefix} ${chapter}.${n}. `, { bold: true, italics: true, size: 24 }), run(text, { italics: true, size: 24 })],
  });
}

// Bảng: tiêu đề có nền, độ rộng cột theo tỉ lệ
function tbl(title, headers, rows, ratios) {
  table += 1;
  const total = ratios.reduce((a, b) => a + b, 0);
  const widths = ratios.map((r) => Math.floor((r / total) * CONTENT_WIDTH));
  widths[widths.length - 1] += CONTENT_WIDTH - widths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: '8A94A6' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = (text, i, isHead) =>
    new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders,
      shading: isHead ? { type: ShadingType.CLEAR, fill: 'DCE6F2', color: 'auto' } : undefined,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ spacing: { line: 276 }, children: [run(String(text), { size: 22, bold: isHead })] })],
    });
  const t = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
  const cap = new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: 160, after: 80 },
    children: [run(`Bảng ${chapter}.${table}. `, { bold: true, italics: true, size: 24 }), run(title, { italics: true, size: 24 })],
  });
  return [cap, t, new Paragraph({ spacing: { after: 120 }, children: [] })];
}

// Ảnh: tự co theo bề rộng tối đa (cm), giữ tỉ lệ
function img(file, text, maxCm = 15.5) {
  figure += 1;
  const full = path.join(ROOT, file);
  const buf = fs.readFileSync(full);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const maxPx = maxCm * 37.8;
  const scale = Math.min(1, maxPx / w, (22 * 37.8) / h);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 120 },
      children: [new ImageRun({ type: 'png', data: buf, transformation: { width: Math.round(w * scale), height: Math.round(h * scale) } })],
    }),
    caption('Hình', figure, text),
  ];
}

module.exports = { d, run, p, fill, chapterTitle, unnumbered, h2, h3, bullets, tbl, img, FONT, SIZE };
