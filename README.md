# Little Together — Cozy City (v2)

Prototype game **3D isometric 2 người** chạy trên GitHub Pages + Firebase Realtime Database miễn phí trong giới hạn gói Spark.

## Đã có trong bản v2

- **Chọn 1 trong 5 nhân vật** trước khi vào game (Bông / Mây / Miu / Nhím / Pudding). Chúng được dựng bằng **mesh 3D procedural** dựa trên tinh thần hình tham khảo bạn cung cấp, **không phải mô hình 3D chuyên nghiệp được rig** và không copy file ảnh vào nhân vật.
- **Thế giới mới 94×80 đơn vị** với đường, đèn, cây, vườn hoa, hồ, các ngôi nhà, hiệu ứng nước nhẹ, camera theo người chơi.
- **9 địa điểm**: quảng trường, hồ câu cá, tiệm phụ kiện, café, tiệm bánh, vườn, arcade thử phản xạ, công viên, nhà nhỏ.
- Joystick cảm ứng, WASD/mũi tên, nhảy, cử chỉ **vẫy tay / nhảy múa / ngồi / ăn / câu cá**, cầm đạo cụ mô phỏng.
- Tương tác tại địa điểm: câu cá canh thanh, mua đồ uống/đồ ăn, ăn từ balo, mua đội nơ/mũ/hoa/mầm cây, trồng/tưới/thu hoạch, thử phản xạ, chụp ảnh PNG, bản đồ đi nhanh.
- Tiền xu và kho đồ lưu **localStorage trên thiết bị**. Phụ kiện đang đội và cử chỉ được đồng bộ khi online.
- Tạo phòng 6 ký tự, đúng **2 vị trí A/B** trong Firebase, host bắt đầu khi có đủ hai người. Tọa độ, nhân vật, phụ kiện, cử chỉ đồng bộ qua Firebase. Có lựa chọn chơi một mình.

## Những điểm chưa hoàn thiện

- Chưa có model nhân vật GLB rigged/bone chuyên nghiệp, mocap, mesh quần áo thay từng bộ, hệ thống đổi outfit nhiều lớp.
- Không có **nội thất nhà 3D có thể đi vào**, hệ thống nhiệm vụ phức tạp, NPC hội thoại, chat, ảnh hai người đồng bộ hoặc nghề nghiệp.
- Tiền, cá, thức ăn, phụ kiện sở hữu và vườn **chỉ lưu ở localStorage**; không bảo mật chống gian lận, không đồng bộ kho đồ giữa thiết bị.
- Firebase Realtime Database đủ cho bản prototype bạn bè 2 người; hiện chưa có server-authoritative, kiểm tra vận tốc và chống sửa tọa độ, chế độ bảo mật riêng tư mạnh, hệ thống khôi phục phòng khi host mất mạng.
- Không có nhạc bản quyền; có hiệu ứng beep nhẹ tạo bằng Web Audio API.
- Chưa thử nghiệm live trên hai điện thoại sử dụng dự án Firebase của bạn. Mã nguồn đã qua `node --check`, rules qua kiểm tra JSON. Muốn dùng thật cần thử trên thiết bị và Firebase Rules Playground.

## CỰC KỲ QUAN TRỌNG: Rules v2 khác v1

Bản này đổi schema từ `rooms/<code>/players` sang `rooms/<code>/slots/A` và `.../B` để giới hạn hai chỗ.

**Bạn bắt buộc phải Publish `database.rules.json` mới.** Nếu vẫn giữ rules của bản cũ, game báo `permission_denied` khi tạo / vào phòng.

1. https://console.firebase.google.com/ → chọn project `little-together-61944`.
2. Build → Realtime Database → **Rules**.
3. Xóa nội dung cũ, dán **toàn bộ** file `database.rules.json` từ ZIP này → **Publish**.
4. Build → Authentication → Sign-in method → bật **Anonymous**.
5. Chỉ dùng rules này cho bản thử nghiệm. Mọi tài khoản anonymous có thể đọc tên và vị trí của các phòng nếu biết mã phòng; không nên nhập thông tin cá nhân vào tên nhân vật.

### Cấu hình Firebase

File `firebase-config.js` đã chứa Web SDK config bạn gửi trước đó. Config web có thể đặt ở frontend; **không** đặt service-account key/admin secret trên GitHub.

Nếu muốn dùng database khác, thay `firebase-config.js` bằng thông số ứng dụng của bạn.

## Đưa v2 lên GitHub Pages

Repository của bạn: https://github.com/Thebadboy209/little-together

1. **Giải nén** ZIP.
2. Vào repo → **Add file → Upload files**.
3. Kéo thả **các file bên trong thư mục**, không kéo cả ZIP và không tạo một thư mục lồng trong root. Commit các file mới; thay thế file có cùng tên từ bản cũ.
4. Kiểm tra gốc repo phải có `index.html`, `style.css`, `game.js`, `firebase-config.js`, `database.rules.json`, `.nojekyll`.
5. Settings → Pages: Deploy from a branch → `main`, `/(root)`; ô Custom domain để trống. Nếu đã có GitHub Actions workflow để publish, có thể giữ Source GitHub Actions thay thế; chỉ nên dùng một cách triển khai.
6. Truy cập https://thebadboy209.github.io/little-together/ và refresh Ctrl+F5 để tránh cache cũ.

## Cách chơi

- Điện thoại A → chọn nhân vật + tên → **Tạo phòng 2 người** → copy mã.
- Điện thoại B → mở cùng trang game → chọn nhân vật → nhập mã → vào phòng.
- Host nhấn **Vào thế giới cùng nhau** khi đủ hai người.
- Di chuyển bằng joystick; mở **Bản đồ** để đến nhanh địa điểm. Đứng gần địa điểm, bấm **Tương tác**.
- Nhấn **Cử chỉ** để vẫy tay, ngồi, nhảy, ăn / thử tư thế câu cá.
- Mở tiệm thời trang để mua và đổi phụ kiện. Tiền tự thêm từ minigame câu cá, vườn và arcade phản xạ.

## Công nghệ & thư viện mở

- [Three.js](https://threejs.org/) — MIT License, dùng importmap CDN trong `index.html`; engine vẽ 3D. Dùng các mô hình tự dựng bằng geometry nên không cần download model bên ngoài.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) — hỗ trợ nâng cấp về sau bằng model `.glb`/`.gltf` + animation tùy giấy phép asset.
- [Three.js AnimationMixer](https://threejs.org/manual/pages/animation-system.html) — dành cho model có clip animation rigged trong bản nâng cấp.
- [Howler.js](https://github.com/goldfire/howler.js) — MIT; tùy chọn để thêm sound effects và ambient audio. Bản v2 **chưa tích hợp** Howler để giảm tải phụ thuộc.
- [Firebase Web SDK](https://firebase.google.com/docs/database/web/start) — kết nối Realtime Database và Anonymous Authentication; tuân thủ điều khoản / hạn mức Firebase.

## Ghi chú bản quyền

Ảnh người dùng cung cấp được dùng làm **tham khảo** tạo nhân vật procedural, không đóng gói lại các ảnh gốc hoặc mô hình nhân vật do bên thứ ba phát hành. Nếu muốn tạo bản 3D giống sát thiết kế tham chiếu, cần các model riêng, kiểm tra quyền sử dụng hoặc tự thiết kế / dựng model.

## Chẩn đoán lỗi

- Trang 404: kiểm tra Pages deployment / root `index.html` / custom domain.
- Trang trắng: thử Chrome/Safari mới; xem Console và đường truyền mạng đến `cdn.jsdelivr.net` (Three.js).
- `permission_denied`: dùng **Rules v2**, bật Anonymous, kiểm tra đúng `databaseURL`.
- Hai người không thấy nhau: cả hai phải cùng một mã phòng, một host đã nhấn Start, thiết bị có Internet và rời phòng cũ trước khi tạo phòng khác.
- Điện thoại yếu: độ phân giải render đã giới hạn, nhưng máy rất cũ có thể giảm FPS.
