# Little Together – 3D Cozy World (playable prototype)

Game thử nghiệm 3D isometric dùng **Three.js** (tải qua CDN), HTML/CSS/JS và **Firebase Realtime Database** (tùy chọn để 2 người chơi online). Không cần Node.js, npm hoặc build tool. Tối ưu mobile với joystick, hỗ trợ WASD trên desktop.

## Game có gì?
- Bản đồ thị trấn 3D, hồ nước, nhà cửa, cây cối, camera bám nhân vật, va chạm.
- Nhân vật chibi 3D procedural, di chuyển bằng joystick hoặc WASD.
- Chơi thử 1 người không cần Firebase.
- Tạo phòng 6 ký tự / vào phòng bằng mã hoặc link mời / tối đa 2 người.
- Đồng bộ vị trí, hướng quay, màu trang phục, số cá bắt được qua Firebase.
- Minigame câu cá bằng canh thanh tiến trình; thay 4 màu áo; emote vẫy tay đơn giản.

**Giới hạn prototype**: Chưa có mô hình quần áo phức tạp, balo, NPC, nhạc, cửa hàng, hệ thống lưu dài hạn hay chống gian lận mạnh. Cá và màu áo lưu trong phiên chơi, chưa lưu khi đóng game. Kết quả câu cá tính từ client nên không phù hợp làm bảng xếp hạng cạnh tranh. Emote hiện có thông báo bên phía người thực hiện, chưa hiển thị bên kia. Tên người chơi là nhãn hiển thị trong thế giới 3D. Quy tắc bảo mật mẫu giúp giới hạn 2 người/phòng nhưng chưa giới hạn tốc độ di chuyển, và người dùng ẩn danh đã xác thực và biết mã phòng có thể đọc dữ liệu phòng (kể cả khi chưa tham gia).

## 1. Chạy local một người

Do module JavaScript cần chạy qua HTTP (không mở bằng `file://`), tại thư mục này chạy:

```bash
python -m http.server 8000
```

Vào `http://localhost:8000/`, nhấn **Chơi thử một mình**. Máy cần có internet để tải Three.js và Firebase SDK nếu chơi online.

## 2. Tạo backend miễn phí Firebase

1. Mở https://console.firebase.google.com → **Create a project** → đặt tên, có thể tắt Analytics, chọn gói Spark.
2. **Build → Realtime Database → Create Database** → chọn khu vực gần bạn → chọn **Locked mode**.
3. Trong **Realtime Database → Rules**, thay nội dung bằng toàn bộ file `database.rules.json` → **Publish**.
4. **Build → Authentication → Sign-in method → Anonymous → Enable**.
5. **Project settings (bánh răng) → Your apps → Web (</>) → Register app** → sao chép thông tin `firebaseConfig`.
6. Trong `firebase-config.js`, thay toàn bộ chuỗi trống bằng các giá trị được Firebase cung cấp. **Nhớ điền `databaseURL`** (lấy từ màn hình Realtime Database).
7. Tải lại trang game. Khi hiện **Đã cấu hình Firebase**, bạn có thể tạo phòng. Cả hai điện thoại phải cùng mở phiên bản game dùng cùng Firebase project.

**Không** đưa Firebase Admin SDK private key, service-account JSON hoặc mật khẩu vào repo GitHub. `firebaseConfig` web là public identifier; bảo mật nhờ Authentication và Rules.

## 3. Publish qua GitHub Pages

1. Đăng nhập https://github.com/new → tạo repo `little-together` (**Public** để dùng Pages thuận tiện).
2. Upload các file cùng cấp: `index.html`, `style.css`, `game.js`, `firebase-config.js`, `database.rules.json`, `README.md`.
3. Mở repo → **Settings → Pages → Build and deployment → Deploy from a branch**.
4. Chọn `main` + `/ (root)` → Save.
5. Mở URL GitHub Pages hiển thị trên màn hình, thường dạng `https://TEN_GITHUB.github.io/little-together/`.
6. Mở trên cả 2 điện thoại, A nhấn **Tạo phòng chơi online**, B nhấn **Vào phòng** theo mã hoặc link được chia sẻ.
7. Khi đủ hai người, người tạo phòng nhấn **Bắt đầu cùng nhau**.

### Nếu gặp lỗi
- **Permission denied**: Kiểm tra đã Publish đúng Rules trong `database.rules.json`, đã bật Anonymous Auth, dùng đúng `databaseURL`.
- **Failed to fetch / auth/network-request-failed**: Kiểm tra internet, cấu hình và nhà mạng; không mở file trực tiếp.
- **Không thấy nhân vật thứ hai**: Cả hai dùng cùng Firebase project và cùng mã phòng; phòng đã đầy thì tạo phòng mới.
- **GitHub Pages trả 404**: Kiểm tra Settings → Pages và đường dẫn repo.
- **Màn hình trắng**: Xem Console trình duyệt, kiểm tra CDN có bị chặn không.

## File dự án

- `index.html`: giao diện.
- `style.css`: thiết kế mobile.
- `game.js`: render 3D, di chuyển, câu cá, online.
- `firebase-config.js`: nơi điền cấu hình Firebase Web App.
- `database.rules.json`: quy tắc Firebase Realtime Database cần tự dán vào Console.

**Lưu ý**: Đây là bản prototype nhỏ để thử nghiệm 2 người; để phát hành công khai cần bổ sung server-authoritative chống hack, tối ưu asset, lưu phiên và xác thực người dùng mạnh hơn.


## Lưu ý về bản thử nghiệm
Rules đã bỏ `numChildren()` (không hỗ trợ trong Firebase Realtime Database Rules). Với cấu trúc `players/{uid}` hiện tại, Rules này **chưa đảm bảo giới hạn tối đa 2 người trong điều kiện nhiều người gia nhập đồng thời**. Không triển khai như giải pháp multiplayer bảo mật hoàn chỉnh. Phiên bản sau nên dùng hai slot cố định `host` và `guest` hoặc backend authoritative.
