const { d, run, fill, p, unnumbered, bullets } = require('./lib');
const { Paragraph, AlignmentType, TableOfContents } = d;

const center = (children, opts = {}) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: opts.after ?? 80, before: opts.before ?? 0 }, children });

module.exports = () => [
  center([run('TRƯỜNG ĐẠI HỌC VĂN LANG', { bold: true, size: 28 })]),
  center([run('KHOA CÔNG NGHỆ THÔNG TIN', { bold: true, size: 28 })], { after: 1400 }),
  center([run('BÁO CÁO CHUYÊN ĐỀ TỐT NGHIỆP 2', { bold: true, size: 32 })], { after: 400 }),
  center([run('ĐỀ TÀI', { size: 26 })]),
  center([run('HỆ THỐNG THEO DÕI VÀ THÔNG BÁO', { bold: true, size: 36 })]),
  center([run('TÌNH TRẠNG BỆNH NHÂN', { bold: true, size: 36 })], { after: 1200 }),
  center([run('Chuyên ngành: Công nghệ phần mềm', { size: 26 })], { after: 600 }),
  center([run('Giảng viên hướng dẫn: ThS. Nguyễn Văn Trung', { size: 26 })]),
  center([run('Nhóm thực hiện: ', { size: 26 }), fill('[Tên nhóm]')]),
  center([fill('[Họ tên sinh viên 1 – MSSV]')]),
  center([fill('[Họ tên sinh viên 2 – MSSV]')]),
  center([fill('[Họ tên sinh viên 3 – MSSV]')], { after: 1600 }),
  center([run('Thành phố Hồ Chí Minh, tháng 10 năm 2026', { italics: true })]),

  unnumbered('Lời cảm ơn'),
  p('Nhóm xin chân thành cảm ơn ThS. Nguyễn Văn Trung đã hướng dẫn nhóm trong suốt 10 buổi của học phần Chuyên đề tốt nghiệp 2, từ bước chọn đề tài, phân tích yêu cầu đến xây dựng, kiểm thử và triển khai sản phẩm. Những góp ý ở các mốc đánh giá giữa kỳ đã giúp nhóm điều chỉnh phạm vi và nâng cao chất lượng sản phẩm.'),
  p('Nhóm cũng cảm ơn Khoa Công nghệ Thông tin, Trường Đại học Văn Lang đã tạo điều kiện để nhóm thực hiện đề tài. Do thời gian và kinh nghiệm còn hạn chế, báo cáo không tránh khỏi thiếu sót; nhóm rất mong nhận được ý kiến đóng góp của quý thầy cô.'),
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 200 }, children: [run('Nhóm thực hiện', { italics: true })] }),

  unnumbered('Mục lục'),
  new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-3' }),

  unnumbered('Danh mục từ viết tắt'),
  ...bullets([
    '**API** – Application Programming Interface, giao diện lập trình ứng dụng',
    '**BR** – Business Rule, quy tắc nghiệp vụ',
    '**CSDL** – Cơ sở dữ liệu',
    '**FCM** – Firebase Cloud Messaging, dịch vụ gửi thông báo đẩy của Google',
    '**FR / NFR** – Functional / Non-functional Requirement, yêu cầu chức năng / phi chức năng',
    '**JWT** – JSON Web Token, chuỗi xác thực có chữ ký',
    '**MVP** – Minimum Viable Product, phiên bản tối thiểu dùng được',
    '**PWA** – Progressive Web App, ứng dụng web cài được lên màn hình chính điện thoại',
    '**SSE** – Server-Sent Events, kênh máy chủ đẩy dữ liệu tới trình duyệt',
    '**TC** – Test case, kịch bản kiểm thử',
    '**UC** – Use case, ca sử dụng',
  ]),
];
