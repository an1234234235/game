# Lanternfall RPG Prototype

Khung game HTML5 RPG theo lượt, xây dựng bằng JavaScript, Phaser 3 và Vite. Hiện tại toàn bộ màn hình chỉ dùng hình khối, đường viền và chữ; dự án không kèm hình ảnh, âm thanh hoặc hoạt ảnh.

## Chạy trong VS Code

1. Mở thư mục dự án trong VS Code.
2. Cài Node.js bản LTS nếu máy chưa có.
3. Mở Terminal > New Terminal và chạy `npm install` một lần.
4. Chạy `npm run dev`.
5. Mở địa chỉ localhost mà Vite in ra trong trình duyệt.

Để kiểm tra bản build, chạy `npm run build`. Phaser hiển thị khung 1280×720 theo tỷ lệ 16:9 và tự co giãn vừa cửa sổ.

## Điều khiển

- Dungeon: di chuyển bằng WASD hoặc phím mũi tên; nhấn E hoặc nút Interact khi đứng cạnh Cave Wisp để vào trận.
- Battle: chọn Attack, Skill, Magic, Item, Guard hoặc Run. Chờ lượt Cave Wisp hoàn tất trước hành động tiếp theo.
- Thắng, thua hoặc Run sẽ mở Replay và Return to Dungeon.
- Inventory, Formation, World Map và Pause đều có phản hồi giao diện. Các điểm tương tác rương, NPC và cửa ra hiện là mô tả thử nghiệm.

## Cấu trúc

- `src/scenes/`: màn khám phá và màn chiến đấu, chỉ phụ trách hiển thị/input Phaser.
- `src/systems/CombatSystem.js`: logic lượt và kết quả trận chiến, không phụ thuộc Phaser.
- `src/data/`: mẫu 5 nghề, dữ liệu nhân vật, trạng thái ban đầu và manifest tài nguyên.
- `src/ui/`: màu sắc, kích thước và helper giao diện dùng chung.
- `assets/`: thư mục trống dành cho pixel art và âm thanh tự tạo.

Frame sprite sheet được quy ước là 128×128 trong `src/data/assetManifest.js`. Đường dẫn tài nguyên tương lai được tập trung tại `ASSET_PATHS`; không có sprite nào được nạp trong prototype. Phaser bật `pixelArt`, tắt antialias và canvas dùng `image-rendering: pixelated` để hạn chế nội suy mờ khi thêm pixel art.

## Chưa triển khai

Chưa có pixel art, tileset thật, âm thanh, hoạt ảnh, chiến đấu nhiều nhân vật hoặc cân bằng chỉ số. Skill/Magic/Item có hiệu ứng thử nghiệm tối giản; trang bị và trạng thái chỉ mới có chỗ trong cấu trúc dữ liệu.