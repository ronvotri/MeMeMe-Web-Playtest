# MeMeMe MVP 0.1.70.1 — Release Flow Repair + UI Density Pass

Status: **PENDING HUMAN ACCEPTANCE**

## Trọng tâm runtime

0.1.70.1 khóa lại luật Đồn/Bệnh viện theo một state flow duy nhất:

1. D6 đầu tiên chỉ dùng để kiểm tra **được thả / xuất viện**.
2. Nếu thất bại, lượt kết thúc như bình thường.
3. Nếu thành công, D6 kiểm tra bị tiêu thụ hoàn toàn, `specialHold` được gỡ, turn trở về `PRE_ROLL_ACTION` và `lastRoll = null`.
4. Cùng người chơi đó phải nhận **một D6 MỚI** để di chuyển trong cùng lượt.
5. CPU dùng cùng authoritative release state. Modal chỉ là feedback và không được chặn CPU nhận fresh movement D6.

## Checklist test bắt buộc

- [ ] Human ở Đồn, roll thất bại → vẫn ở Đồn, lượt kết thúc.
- [ ] Human ở Đồn, roll thành công → hiện `ĐƯỢC THẢ!` → modal đóng → xuất hiện D6 mới → di chuyển theo D6 mới.
- [ ] Human ở Bệnh viện, roll thất bại → vẫn ở Bệnh viện, lượt kết thúc.
- [ ] Human ở Bệnh viện, roll thành công → hiện `XUẤT VIỆN!` → modal đóng → xuất hiện D6 mới → di chuyển theo D6 mới.
- [ ] CPU ở Đồn, roll thành công → modal không làm treo lượt → CPU tự roll D6 mới và đi tiếp.
- [ ] CPU ở Bệnh viện, roll thành công → modal không làm treo lượt → CPU tự roll D6 mới và đi tiếp.
- [ ] Số D6 dùng để được thả/xuất viện **không bao giờ** được dùng lại làm số bước di chuyển.
- [ ] Cảnh sát / Bác sĩ / Trộm / Cascader vẫn dùng đúng Career Trait release faces của 0.1.70.

## Checklist UI Density

- [ ] Roll For Order dùng card bo góc, cụm P1–P4 cân hơn và kết quả D6 dễ đọc hơn.
- [ ] Khu Roll For Order không còn khoảng trắng dưới quá lớn làm D6/result trông nhỏ xíu.
- [ ] Mini Game ranking/leaderboard hiện kết quả rõ hơn, bố cục bớt trống.
- [ ] Ô `compactCard` xám cũ ở đáy màn hình không xuất hiện trong lượt CPU.
- [ ] Khi tới lượt human, control LÁ BÀI có skin bo góc thay vì rectangle vuông cũ.
- [ ] Không còn narration/card text bay xuyên khỏi modal.

## Acceptance

Chỉ gọi **Runtime PASS** sau khi test thật xác nhận đủ Human + CPU ở cả Đồn và Bệnh viện. CI PASS không thay thế human runtime acceptance.
