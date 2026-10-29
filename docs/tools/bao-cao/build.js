const fs = require('fs');
const { d, run, FONT, SIZE } = require('./lib');
const { Document, Packer, Paragraph, Footer, AlignmentType, PageNumber, LevelFormat, TextRun } = d;

const CM = 567;
const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 2.5 * CM, bottom: 2.5 * CM, left: 3 * CM, right: 2 * CM },
};
const footer = new Footer({
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })] })],
});

const cover = require('./c0')();
const body = [
  ...require('./c1')(),
  ...require('./c2')(),
  ...require('./c3')(),
  ...require('./c4a')(),
  ...require('./c4b')(),
  ...require('./c5')(),
  ...require('./c6a')(),
  ...require('./c6b')(),
  ...require('./c6c')(),
  ...require('./c7')(),
  ...require('./c8')(),
];

const doc = new Document({
  creator: 'Nhóm CDTN2',
  title: 'Báo cáo Chuyên đề tốt nghiệp 2 – Hệ thống Theo dõi và Thông báo tình trạng bệnh nhân',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: SIZE } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true }, paragraph: { outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: SIZE, bold: true, italics: true }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
  },
  sections: [
    { properties: { page }, children: cover.slice(0, 13) },
    { properties: { page }, footers: { default: footer }, children: [...cover.slice(13), ...body] },
  ],
});

const out = process.argv[2] || require('path').join(__dirname, '..', '..', 'bao-cao', 'Bao-cao-CDTN2.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('saved', out, Math.round(buf.length / 1024), 'KB');
});
