Ailaai v3 (Tinhte-style, đầy nội dung) — Deploy nhanh

1) Netlify kéo-thả:
- netlify.com → Add new site → Deploy manually
- Kéo thả folder đã giải nén (bên trong có index.html)

2) Trỏ domain:
- Netlify → Domain management → Add custom domain
- Netlify sẽ đưa các bản ghi DNS cần thêm (A/CNAME)
- Vào nơi bạn mua domain → DNS → thêm đúng các bản ghi đó

Sửa bài viết:
- data/posts.json
  + title, excerpt, date, category, tags, contentHtml
  + image: link ảnh (khuyến nghị ngang ~1200px)


Trang Top công cụ AI:
- tools.html đọc dữ liệu từ data/tools.json
- Thêm/sửa tool bằng cách chỉnh tools.json


Bình luận (Facebook Comments) — chạy ngay
- Đã tích hợp sẵn trong article.html.
- Comment sẽ tự nhận đúng URL của từng bài (window.location.href) để phân luồng bình luận.

Lưu ý:
- Facebook Comments ổn nhất khi bạn dùng domain thật (ailaai.vn).
- Test trên Netlify subdomain vẫn hoạt động bình thường.


Share Facebook + đếm bình luận (tự động)
- Trang bài viết có nút "Chia sẻ Facebook" + "Copy link" + hiển thị số bình luận.
- Trang chủ/chuyên mục hiển thị số bình luận từng bài bằng fb-comments-count.


Admin /admin (Decap CMS) — đăng bài như WordPress (có toolbar)
1) Đưa toàn bộ source lên GitHub (repo mới).
2) Netlify: New site from Git → chọn repo → Deploy.
   - Build command: npm run build
   - Publish directory: .
3) Netlify: Site settings → Identity → Enable Identity
4) Identity → Settings → Git Gateway → Enable
5) Identity → Settings → External providers → GitHub → Enable
6) Truy cập: https://ailaai.vn/admin
   → Login bằng GitHub → viết bài → Publish

Bài viết lưu ở: content/posts/*.md
Build tự tạo: data/posts.json + sitemap.xml


OG image + Tag pages
- Build tự tạo ảnh OG 1200x630 cho từng bài: /assets/og/<post-id>.png (sharp)
- Trang tag: /t/<tag-slug>.html (tự generate)
- Trang tổng tag: /tags.html


PRO (Search + Hero/Trending + Author pages)
- Trang tìm kiếm: /search.html?q=...
- Trang tác giả: /authors.html và /a/<author-slug>.html
- Trang chủ có Hero + Trending + Mới nhất
