# Cẩm nang (blog) — cách viết bài

Cẩm nang là phần blog của TimTruong, nằm ngay trong client (TanStack Start), URL `/cam-nang`.
Mỗi bài là **một file MDX** (Markdown + có thể chèn component React) trong git.

## Viết một bài mới

1. Copy `client/src/content/cam-nang/bai-viet-mau.mdx` thành file mới. **Tên file = URL**:
   `diem-chuan-la-gi.mdx` → `https://timtruong.app/cam-nang/diem-chuan-la-gi`.
   Tên file chỉ dùng chữ thường không dấu, số và dấu `-`. **Đừng đổi tên file sau khi đã đăng**
   (Google đã index URL cũ).
2. Sửa phần frontmatter ở đầu file:

   ```yaml
   ---
   title: Điểm chuẩn là gì? Hiểu đúng để chọn ngành   # tiêu đề + <h1>, ~50–60 ký tự, có từ khoá
   description: Điểm chuẩn là ...                        # mô tả trên Google, ~150–160 ký tự
   date: 2026-11-24                                      # ngày đăng, YYYY-MM-DD
   updated: 2026-12-01                                   # (tuỳ chọn) ngày cập nhật lớn gần nhất
   image: /cam-nang/diem-chuan-la-gi/cover.png           # (tuỳ chọn) ảnh share 1200×630; bỏ trống dùng og-image.png
   draft: true                                           # (tuỳ chọn) nháp: chỉ hiện khi chạy dev
   ---
   ```

3. Viết nội dung bằng Markdown. Trong bài **chỉ dùng từ `##` trở xuống** (`<h1>` đã lấy từ
   `title`). Xem `bai-viet-mau.mdx` để biết mọi định dạng: đậm/nghiêng, danh sách, bảng, trích
   dẫn, link, ảnh, chèn component.
4. Xem thử: `cd client && bun run dev` → mở `http://localhost:5173/cam-nang`. Bài nháp có nhãn
   **Nháp** và chỉ hiện ở đây.
5. Đăng: xoá dòng `draft: true` (hoặc đặt `false`), commit, rồi build + deploy client.

## Ảnh

Đặt ảnh trong `client/public/cam-nang/<tên-bài>/` và chèn bằng đường dẫn tuyệt đối:
`![Mô tả ảnh](/cam-nang/<tên-bài>/anh.png)`. Luôn viết mô tả ảnh (alt text) — tốt cho SEO và
người dùng trình đọc màn hình. Ảnh share (`image`) nên là PNG/JPEG 1200×630.

## Chèn component của app

```mdx
import { Badge } from "@/components/ui/badge";

Trường này là <Badge>Trường công lập</Badge>.
```

## Tự động có sẵn (không cần làm gì)

- Title, description, Open Graph/Twitter (ảnh share), canonical, JSON-LD `Article` — render sẵn
  trong HTML từ server, nên Google và Facebook/Zalo đều đọc được.
- Sitemap (`public/sitemap.xml`) và RSS (`/cam-nang/rss.xml`), không gồm bài nháp.
- **Frontmatter sai/thiếu → `bun run build` báo lỗi** chỉ rõ file và trường bị sai.

## Lưu ý

- Bài nháp không hiện trên production, nhưng file JS của bài vẫn nằm trong bản build (không có
  link tới). Đừng viết thông tin nhạy cảm trong bài nháp.
- Chi tiết kỹ thuật: `client/src/lib/blog.ts`, `client/src/lib/blog-schema.ts`, plugin MDX trong
  `client/vite.config.ts`.
