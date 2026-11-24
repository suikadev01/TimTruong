---
name: viet-bai
description: Viết một bài blog "Cẩm nang" (tiếng Việt, MDX) cho TimTruong từ một dàn ý có sẵn. Dùng khi người dùng muốn viết bài, viết blog, viết cẩm nang, hoặc đưa một file dàn ý trong client/src/content/outlines/.
---

# Viết bài Cẩm nang từ dàn ý

Đầu vào: đường dẫn tới một file dàn ý (thường là `client/src/content/outlines/<chủ-đề>.md`).
Đầu ra: một file `client/src/content/cam-nang/<slug>.mdx` ở trạng thái `draft: true`, build
không lỗi, cộng một bản tóm tắt cho người dùng biết cần kiểm tra gì.

Quy ước kỹ thuật (frontmatter, ảnh, component) nằm trong `docs/Blog.md`, nên **đọc file đó
trước**. Định dạng mẫu có trong `client/src/content/cam-nang/bai-viet-mau.mdx`.

## Quy trình

1. **Đọc dàn ý.** Dàn ý là "hợp đồng": giữ đúng thứ tự và phạm vi các ý. Mỗi ý chính thành
   một `##`. Ghi chú trong ngoặc của dàn ý (ví dụ "ngắn gọn", "dùng bảng") là yêu cầu bắt buộc.
   Nếu dàn ý mơ hồ hoặc mâu thuẫn, hỏi người dùng trước khi viết.
2. **Đọc nguồn.** Đọc mọi link nguồn trong dàn ý. Với mỗi dữ kiện, ghi lại nó đến từ đâu.
   Nếu nguồn có bản mới hơn (ví dụ có trang năm sau), báo người dùng và hỏi nên dùng bản nào.
   Nếu nguồn không phải trang chính thức (của Bộ GD&ĐT, của trường, của đơn vị tổ chức thi),
   nói rõ điều này trong tóm tắt cuối.
3. **Đối chiếu với dữ liệu TimTruong** khi bài nhắc tới trường đại học (xem phần "Liên kết
   tới trang trường" bên dưới).
4. **Viết bài** theo phần "Văn phong" và "Quy tắc dữ kiện".
5. **Kiểm tra**: chạy `cd client && bun run build`. Lỗi frontmatter hoặc MDX phải được sửa
   hết. Nếu có thể, chạy `bun run dev` và mở `/cam-nang/<slug>` để xem thử.
6. **Tóm tắt cho người dùng**: đường dẫn file, các chỗ `TODO`, dữ kiện chưa xác minh, và
   giả định đã đưa ra.

## Văn phong

- Người đọc: học sinh lớp 12 và phụ huynh. Xưng "bạn". Thân thiện nhưng rõ ràng, không
  suồng sã.
- Câu ngắn, mỗi đoạn tối đa 3–4 câu. Đi thẳng vào ý, không mở bài vòng vo.
- Tránh văn "giọng AI" hoặc giọng dịch: "Hãy cùng tìm hiểu", "Trong bối cảnh…", "không chỉ…
  mà còn…" lặp lại, "đóng vai trò quan trọng", "hành trang", "chìa khoá vàng", kết bài kiểu
  "Hy vọng bài viết đã giúp bạn…".
- Dùng thuật ngữ đúng như trong ngành tuyển sinh: điểm chuẩn, tổ hợp môn, phương thức xét
  tuyển, mã phương thức, ngưỡng đảm bảo chất lượng đầu vào.
- Tiếng Việt có dấu đầy đủ, Unicode dựng sẵn (NFC). Viết tên kỳ thi, tên trường đúng như
  nguồn chính thức (ví dụ "V-SAT", không viết "Vsat").

## Quy tắc dữ kiện (quan trọng nhất)

Học sinh dùng bài để chọn trường, nên một con số sai gây hại thật.

- **Không viết dữ kiện nào không có nguồn.** Con số, ngày tháng, danh sách trường, lệ phí,
  thang điểm đều phải lấy từ nguồn trong dàn ý, từ `etl/data/`, hoặc từ trang chính thức.
- Dữ kiện chưa xác minh được nhưng cần cho bài: viết thận trọng và thêm
  `{/* TODO: kiểm tra — <lý do, nguồn> */}` ngay sau nó (cú pháp comment của MDX; **không**
  dùng `<!-- -->` vì MDX báo lỗi).
- Ghi rõ năm áp dụng ("năm 2025", "mùa tuyển sinh 2026"), vì quy chế đổi theo năm.
- Cuối bài có mục `## Nguồn tham khảo` liệt kê các link đã dùng.

## Liên kết tới trang trường

Trang trường trên TimTruong là `/danh-sach-truong/<slug>`. Danh sách trường có trong DB
nằm ở `etl/data/_shared/universities.csv` (chỉ gồm trường ở TP.HCM và lân cận).

- So khớp tên trường trong bài với cột `Name`/`ShortName` của CSV. Cẩn thận với các trường
  tên gần giống nhau (ví dụ "Học viện Ngân hàng" ở Hà Nội **khác** "Trường Đại học Ngân hàng
  TP.HCM").
- Tính slug bằng **chính hàm của ETL**, không tự đoán:
  ```shell
  cd etl && uv run python -c "
  import csv; from slugify import slugify
  for r in csv.DictReader(open('data/_shared/universities.csv')):
      s = r['ShortName'].strip()
      print(s, slugify(r['Name'].strip(), s or None))"
  ```
- Trong văn bản, dùng link Markdown thường: `[Trường Đại học Sài Gòn](/danh-sach-truong/<slug>)`.
- Khi cần một **danh sách trường dạng bảng**, dùng component `SchoolListTable`
  (`client/src/components/blog/SchoolListTable.tsx`). Trường có `slug` sẽ được hiện thành
  link, trường không có slug hiện chữ thường. Ví dụ:
  ```mdx
  import { SchoolListTable } from "@/components/blog/SchoolListTable";

  export const schools = [
    { name: "Trường Đại học Sài Gòn", slug: "truong-dai-hoc-sai-gon-sgu", region: "TP.HCM", note: "Tổ chức thi" },
    { name: "Trường Đại học Cần Thơ", region: "Cần Thơ" },
  ];

  <SchoolListTable schools={schools} />
  ```

## Frontmatter và tên file

- Tên file = slug URL: chữ thường không dấu, số, dấu `-`, chứa từ khoá chính
  (ví dụ `ky-thi-v-sat-la-gi.mdx`). Không đổi tên sau khi bài đã đăng.
- `title` khoảng 50–60 ký tự, chứa từ khoá chính. `description` khoảng 150–160 ký tự.
- `date` là ngày hôm nay. Luôn đặt `draft: true`: chỉ người dùng mới quyết định đăng bài.
- Trong bài chỉ dùng từ `##` trở xuống (`<h1>` lấy từ `title`).
- Nên có ít nhất 1–2 link nội bộ phù hợp (`/danh-sach-truong`, `/to-hop-mon`, `/tim-kiem`).
