/**
 * BỘ MẪU QUY CHUẨN VĂN BẢN, SÁNG KIẾN KINH NGHIỆM, TỔ CHUYÊN MÔN & THẨM ĐỊNH THI ĐUA
 * TUYỆT ĐỐI KHÔNG DÙNG TÊN RIÊNG (SỞ, XÃ, TRƯỜNG, HỌ TÊN CỤ THỂ HOẶC SỐ VĂN BẢN BỊA ĐẶT)
 * SỬ DỤNG DẤU "..." HOẶC CÁC TRƯỜNG CHUẨN THEO ĐÚNG THỂ THỨC QUY ĐỊNH
 * Căn cứ pháp lý:
 * - Nghị định số 30/2020/NĐ-CP về Thể thức và Kỹ thuật trình bày văn bản hành chính
 * - Hướng dẫn số 05-HD/VPTW về Thể thức và Kỹ thuật trình bày văn bản của Đảng
 * - Công văn số 5512/BGDĐT-GDTrH về Xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường
 * - Nghị định số 13/2012/NĐ-CP & Thông tư số 18/2013/TT-BKHCN về Điều lệ Sáng kiến
 * - Luật Thi đua, Khen thưởng năm 2022
 */

export interface OfficialTemplate {
  id: string;
  category: 'skkn_co_so' | 'skkn_thanh_pho' | 'to_chuyen_mon' | 'hoi_dong_sk' | 'ha_noi_khen_thuong';
  name: string;
  formNumber: string;
  legalBasis: string;
  description: string;
  contentTemplate: string;
  isCustom?: boolean;
}

export const OFFICIAL_SKKN_AND_DEPARTMENT_TEMPLATES: OfficialTemplate[] = [
  // ==========================================
  // 1. CÁC MẪU SÁNG KIẾN KINH NGHIỆM CƠ SỞ (CẤP TRƯỜNG / CẤP CƠ SỞ)
  // ==========================================
  {
    id: 'skkn-mau-01',
    category: 'skkn_co_so',
    formNumber: 'Mẫu số 01',
    name: 'Đơn yêu cầu công nhận sáng kiến cơ sở',
    legalBasis: 'Thông tư số 18/2013/TT-BKHCN & Nghị định số 13/2012/NĐ-CP',
    description: 'Mẫu đơn chính thức của tác giả/đồng tác giả đề nghị Hội đồng sáng kiến xét và công nhận sáng kiến (kèm bảng kê tác giả, tỷ lệ %, người hỗ trợ áp dụng).',
    contentTemplate: `Mẫu số 01

CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
---------------------------------

ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN

Kính gửi: Hội đồng Sáng kiến ...

Tôi (chúng tôi) ghi tên dưới đây:

| Số TT | Họ và tên | Ngày tháng năm sinh | Nơi công tác (hoặc nơi thường trú) | Chức danh | Trình độ chuyên môn | Tỷ lệ (%) đóng góp vào việc tạo ra sáng kiến |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | ... | ... | ... | ... | ... | ...% |
| 2 | ... | ... | ... | ... | ... | ...% |

Là tác giả (nhóm tác giả) đề nghị xét công nhận sáng kiến:
"..."

- Chủ đầu tư tạo ra sáng kiến (trường hợp tác giả không đồng thời là chủ đầu tư tạo ra sáng kiến): ...
- Lĩnh vực áp dụng sáng kiến: ...
- Ngày sáng kiến được áp dụng lần đầu hoặc áp dụng thử (ghi ngày nào sớm hơn): ...
- Mô tả bản chất của sáng kiến (theo quy định tại điểm d khoản 1 Điều 5 Thông tư số 18/2013/TT-BKHCN):
  + Về tính mới, tính sáng tạo: ...
  + Về khả năng áp dụng: ...
- Những thông tin cần được bảo mật (nếu có): ...
- Các điều kiện cần thiết để áp dụng sáng kiến: ...
- Đánh giá lợi ích thu được hoặc dự kiến có thể thu được do áp dụng sáng kiến theo ý kiến của tác giả: ...
- Đánh giá lợi ích theo ý kiến của tổ chức, cá nhân đã tham gia áp dụng sáng kiến lần đầu hoặc áp dụng thử: ...

Danh sách những người đã tham gia áp dụng thử hoặc áp dụng sáng kiến lần đầu (nếu có):
| Số TT | Họ và tên | Ngày tháng năm sinh | Nơi công tác (hoặc nơi thường trú) | Chức danh | Trình độ chuyên môn | Nội dung công việc hỗ trợ |
| :---: | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | ... | ... | ... | ... | ... | ... |
| 2 | ... | ... | ... | ... | ... | ... |

Tôi (chúng tôi) xin cam đoan mọi thông tin nêu trong đơn là trung thực, đúng sự thật và hoàn toàn chịu trách nhiệm trước pháp luật.

                                             ..., ngày ... tháng ... năm ...
                                                         Người nộp đơn
                                                     (Ký và ghi rõ họ tên)
                                                              ...`
  },
  {
    id: 'skkn-mau-02',
    category: 'skkn_co_so',
    formNumber: 'Mẫu số 02',
    name: 'Báo cáo Sáng kiến kinh nghiệm (Toàn văn ≤ 15 trang A4)',
    legalBasis: 'Nghị định số 13/2012/NĐ-CP & Thông tư số 18/2013/TT-BKHCN',
    description: 'Bản báo cáo toàn văn cấu trúc hoàn chỉnh: Bìa cơ quan chủ quản, Đặt vấn đề, Nội dung chi tiết (hiện trạng, giải pháp, kết quả đối chứng, hiệu quả khoa học/kinh tế/xã hội, tính khả thi), Kiến nghị đề xuất.',
    contentTemplate: `Mẫu số 02

TÊN CƠ QUAN CHỦ QUẢN: ...
TÊN CƠ QUAN, ĐƠN VỊ: ...
----------------------------

SÁNG KIẾN KINH NGHIỆM

Tên Sáng kiến: ...
Tên Tác giả: ...
Đơn vị công tác: ...
Chức vụ: ...
Năm thực hiện: ... - ...

============================================================
NỘI DUNG SÁNG KIẾN KINH NGHIỆM

I. ĐẶT VẤN ĐỀ
1. Tính cấp thiết phải tiến hành sáng kiến:
...

2. Mục tiêu của đề tài, sáng kiến:
...

3. Thời gian, đối tượng, phạm vi nghiên cứu:
- Thời gian thực hiện: Từ tháng .../... đến tháng .../...
- Đối tượng nghiên cứu: ...
- Phạm vi nghiên cứu, áp dụng: ...

II. NỘI DUNG CỦA SÁNG KIẾN
1. Hiện trạng vấn đề (Nêu rõ cách làm cũ, phân tích nhược điểm, số liệu khảo sát đối chứng trước khi thực hiện):
...

2. Mô tả sáng kiến, giải pháp thực hiện sáng kiến để giải quyết vấn đề (Nêu rõ cách làm mới, tính sáng tạo, hiệu quả, quy trình triển khai chi tiết):
- Giải pháp 1: ...
- Giải pháp 2: ...
- Giải pháp 3: ...

3. Kết quả sau khi áp dụng giải pháp sáng kiến tại đơn vị:
(Nêu rõ kết quả, bảng số liệu so sánh, đối chứng trước và sau khi áp dụng):
...

4. Hiệu quả của sáng kiến:
4.1. Hiệu quả về khoa học, chuyên môn: ...
4.2. Hiệu quả về kinh tế: ...
4.3. Hiệu quả về xã hội, giáo dục: ...

5. Tính khả thi và khả năng nhân rộng:
...

6. Thời gian thực hiện đề tài, sáng kiến: ...
7. Kinh phí thực hiện đề tài, sáng kiến: ...

III. KIẾN NGHỊ, ĐỀ XUẤT
1. Với đơn vị công tác: ...
2. Với cơ quan quản lý cấp trên: ...

(Nội dung đề nghị ngắn gọn không quá 15 trang giấy khổ A4)

   XÁC NHẬN CỦA CƠ QUAN                      ..., ngày ... tháng ... năm ...
    (Ký tên, đóng dấu)                              Người viết sáng kiến
            ...                                     (Ký, ghi rõ họ tên)
                                                             ...`
  },
  {
    id: 'skkn-mau-03',
    category: 'hoi_dong_sk',
    formNumber: 'Mẫu số 03',
    name: 'Phiếu nhận xét, đánh giá sáng kiến của Hội đồng cơ sở',
    legalBasis: 'Thông tư số 18/2013/TT-BKHCN & Nghị định số 13/2012/NĐ-CP',
    description: 'Phiếu chấm điểm, nhận xét chuẩn 4 nội dung trọng tâm: Tính mới/sáng tạo; Khả năng áp dụng; Hiệu quả; Hình thức trình bày; Kết luận Đạt/Không đạt.',
    contentTemplate: `Mẫu số 03

TÊN CƠ QUAN, ĐƠN VỊ: ...
HỘI ĐỒNG SÁNG KIẾN CƠ SỞ
-----------------------
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày ... tháng ... năm ...

PHIẾU NHẬN XÉT, ĐÁNH GIÁ SÁNG KIẾN

- Tên sáng kiến: ...
- Tác giả sáng kiến: ...
- Họ tên người đánh giá: ... (Ủy viên Hội đồng)
- Cơ quan công tác: ...

NHẬN XÉT CHI TIẾT

1. Nội dung 1: Sáng kiến có tính mới, sáng tạo, tiên tiến:
(Nhận xét về tính mới và nêu rõ sự khác biệt của giải pháp mới so với giải pháp cũ; nêu cách thức thực hiện, các bước thực hiện cụ thể):
1.1. Sáng kiến có tính mới, phù hợp với thực tiễn của cơ quan, đơn vị và đối tượng nghiên cứu áp dụng:
...
1.2. Sáng kiến nêu rõ sự khác biệt của giải pháp mới so với giải pháp cũ (có số liệu khảo sát, đánh giá trước khi thực hiện):
...
1.3. Sáng kiến nêu rõ cách làm, giải pháp mới, phân tích thể hiện sự sáng tạo, hiệu quả:
...

2. Nội dung 2: Sáng kiến có khả năng áp dụng:
(Nhận xét mức độ thực hiện và khả năng triển khai, áp dụng cho các đơn vị, cá nhân cùng ngành, lĩnh vực hoặc rộng rãi trong thực tế):
2.1. Sáng kiến có nêu nội dung so sánh số liệu, kết quả giữa trước và sau khi áp dụng cách làm, giải pháp mới:
...
2.2. Sáng kiến có nêu được khả năng áp dụng và nhân rộng cho các đơn vị, cá nhân cùng lĩnh vực:
...

3. Nội dung 3: Sáng kiến mang lại hiệu quả, lợi ích thu được hoặc dự kiến có thể thu được do áp dụng sáng kiến:
(Nhận xét sáng kiến đã mang lại hiệu quả cụ thể về nâng cao chất lượng công tác, giáo dục, tiết kiệm thời gian, nhân lực và lợi ích xã hội):
...

4. Nội dung 4: Về hình thức trình bày:
(Nhận xét cách trình bày khoa học, đúng quy định dung lượng, thể thức):
...

KẾT QUẢ ĐÁNH GIÁ:
[ ] Đạt         [ ] Không đạt

                                                    Người đánh giá
                                                  (Họ, tên và chữ ký)
                                                          ...`
  },
  {
    id: 'skkn-mau-04',
    category: 'hoi_dong_sk',
    formNumber: 'Mẫu số 04',
    name: 'Quyết định công nhận sáng kiến cơ sở của Thủ trưởng đơn vị',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022 & Nghị định số 13/2012/NĐ-CP',
    description: 'Văn bản hành chính chính thức của Thủ trưởng đơn vị công nhận danh sách sáng kiến cơ sở đủ điều kiện (kèm danh sách trích ngang).',
    contentTemplate: `Mẫu số 04

TÊN CƠ QUAN CHỦ QUẢN: ...
TÊN CƠ QUAN, ĐƠN VỊ: ...
Số: .../QĐ-...

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày ... tháng ... năm ...

QUYẾT ĐỊNH
Về việc công nhận sáng kiến cấp cơ sở năm ...

THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ CƠ SỞ

- Căn cứ Luật Thi đua, Khen thưởng ngày 15 tháng 6 năm 2022;
- Căn cứ Nghị định số 13/2012/NĐ-CP ngày 02 tháng 3 năm 2012 của Chính phủ ban hành Điều lệ Sáng kiến;
- Căn cứ Thông tư số 18/2013/TT-BKHCN ngày 01 tháng 8 năm 2013 của Bộ Khoa học và Công nghệ;
- Căn cứ Biên bản họp Hội đồng xét công nhận sáng kiến ngày ... tháng ... năm ...;
- Theo đề nghị của Chủ tịch Hội đồng Sáng kiến.

QUYẾT ĐỊNH:

Điều 1. Công nhận sáng kiến cấp cơ sở năm ... cho các cá nhân có tên trong danh sách đính kèm.
Điều 2. Các cá nhân có sáng kiến được công nhận tại Điều 1 được cấp Giấy chứng nhận sáng kiến và hưởng các quyền lợi theo quy định hiện hành.
Điều 3. Các bộ phận liên quan và các cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./.

Nơi nhận:                                          THỦ TRƯỞNG
- Như Điều 3;                                   (Ký, đóng dấu)
- Cơ quan quản lý cấp trên (để b/c);                  ...
- Lưu: VT.`
  },
  {
    id: 'skkn-mau-05',
    category: 'hoi_dong_sk',
    formNumber: 'Mẫu số 05',
    name: 'Giấy chứng nhận sáng kiến (Chuẩn Thông tư 18/2013/TT-BKHCN)',
    legalBasis: 'Thông tư số 18/2013/TT-BKHCN của Bộ Khoa học và Công nghệ',
    description: 'Giấy chứng nhận chính thức cấp cho tác giả sáng kiến sau khi được thủ trưởng đơn vị cơ sở công nhận.',
    contentTemplate: `Mẫu số 05

TÊN CƠ QUAN, ĐƠN VỊ: ...
Số: .../GCN-SK

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------

GIẤY CHỨNG NHẬN SÁNG KIẾN

THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ: ...
CHỨNG NHẬN

Ông/Bà: ...
Chức danh/Chức vụ: ...
Nơi làm việc: ...

Là tác giả (đồng tác giả) của sáng kiến:
"..."

Do chủ đầu tư tạo ra sáng kiến là: ...

Được công nhận là tác giả sáng kiến cấp cơ sở theo Quyết định số ... ngày ... tháng ... năm ... của Thủ trưởng đơn vị ...

Vào sổ sáng kiến:
Số: .../...                                      ..., ngày ... tháng ... năm ...
                                                    THỦ TRƯỞNG ĐƠN VỊ
                                                    (Ký tên, đóng dấu)
                                                            ...`
  },
  {
    id: 'skkn-mau-06',
    category: 'skkn_thanh_pho',
    formNumber: 'Mẫu số 06',
    name: 'Tờ trình đề nghị công nhận phạm vi ảnh hưởng & hiệu quả áp dụng của Sáng kiến',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022 & Quy định về phân cấp công nhận sáng kiến',
    description: 'Tờ trình của cơ quan, trường học đề nghị Hội đồng sáng kiến cấp trên xét công nhận phạm vi ảnh hưởng và hiệu quả áp dụng.',
    contentTemplate: `Mẫu số 06

TÊN CƠ QUAN CHỦ QUẢN: ...
TÊN CƠ QUAN, ĐƠN VỊ: ...
Số: .../TTr-...

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày ... tháng ... năm ...

TỜ TRÌNH
V/v đề nghị công nhận phạm vi ảnh hưởng và hiệu quả áp dụng của sáng kiến

Kính gửi:
- ...;
- Hội đồng Sáng kiến ...

Căn cứ Biên bản cuộc họp Hội đồng xét công nhận sáng kiến của đơn vị ngày ... tháng ... năm ...;
Đơn vị ... đề nghị Hội đồng Sáng kiến cấp trên xem xét, công nhận phạm vi ảnh hưởng và hiệu quả áp dụng của các sáng kiến cụ thể như sau:

Số lượng sáng kiến, giải pháp đề nghị công nhận:
- Tổng số: ... sáng kiến, giải pháp.

(Có danh sách và hồ sơ sáng kiến kèm theo).

Kính trình cấp có thẩm quyền xem xét, quyết định./.

Nơi nhận:                                    THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ
- Như trên;                                       (Ký tên, đóng dấu)
- Lưu: VT.                                                ...`
  },
  {
    id: 'skkn-mau-07',
    category: 'skkn_co_so',
    formNumber: 'Mẫu số 07',
    name: 'Bản mô tả nội dung cơ bản của sáng kiến (Bản tóm tắt ≤ 3 trang)',
    legalBasis: 'Thông tư số 18/2013/TT-BKHCN & Nghị định số 13/2012/NĐ-CP',
    description: 'Bản mô tả tóm tắt đính kèm Đơn yêu cầu công nhận sáng kiến, thể hiện rõ tính mới, tính khả thi, đối chứng kết quả và phạm vi ảnh hưởng.',
    contentTemplate: `Mẫu số 07

Tên Cơ quan/Tổ chức: ...
CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
---------------------------------

BẢN MÔ TẢ NỘI DUNG CƠ BẢN CỦA SÁNG KIẾN
(Đính kèm Đơn Yêu cầu công nhận sáng kiến)

Tên Sáng kiến: ...
Tác giả/Nhóm tác giả: ...

1. Thực trạng:
(1) Các vấn đề tồn tại trước khi thực hiện sáng kiến: ...
(2) Lý do thực hiện sáng kiến: ...

2. Nội dung sáng kiến:
(1) Nghiên cứu, đề xuất các giải pháp cụ thể để giải quyết thực trạng nêu trên:
- Tính mới, tính tiên tiến: ...
- Tính khả thi: ...
(2) Kết quả của sáng kiến:
- Có đối chứng, so sánh kết quả trước và sau khi thực hiện giải pháp: ...

3. Đánh giá phạm vi ảnh hưởng của Sáng kiến:
[ ] Đã áp dụng hiệu quả trong phạm vi cơ quan, đơn vị
[ ] Đã được nhân rộng, chuyển giao áp dụng ra phạm vi ngành/địa phương (theo chứng cứ kèm theo)
[ ] Có khả năng nhân rộng toàn diện

(Báo cáo tóm tắt đề nghị ngắn gọn không quá 3 trang giấy khổ A4)

Xác nhận của Thủ trưởng đơn vị                   ..., ngày ... tháng ... năm ...
       (Ký tên, đóng dấu)                              Người viết sáng kiến
               ...                                     (Ký, ghi rõ họ tên)
                                                                ...`
  },

  // ==========================================
  // 2. CÁC MẪU VĂN BẢN KHEN THƯỞNG & THẨM ĐỊNH THI ĐUA
  // ==========================================
  {
    id: 'hn-mau-01',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 01',
    name: 'Công văn đề nghị cấp đổi/cấp lại hiện vật khen thưởng (Tập thể)',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022 & Quy định về quản lý hiện vật khen thưởng',
    description: 'Công văn của cơ quan, tổ chức trình cấp có thẩm quyền xin cấp đổi/cấp lại bằng khen, kỷ niệm chương bị hư hỏng, thất lạc hoặc sai sót thông tin.',
    contentTemplate: `TÊN CƠ QUAN CHỦ QUẢN: ...         CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TÊN ĐƠN VỊ: ...                   Độc lập - Tự do - Hạnh phúc
----------------------------            --------------------------
Số: … /CV-...                           ..., ngày … tháng … năm ...

V/v đề nghị cấp đổi/cấp lại
hiện vật khen thưởng

Kính gửi: ...

Tên tập thể đề nghị cấp đổi/cấp lại: ...
Trực thuộc: ...
Địa chỉ hiện nay: ...
Điện thoại liên hệ: ...
Đã được tặng thưởng: ...
Theo Quyết định số: ... ngày ... tháng ... năm ... của ...
Đơn vị trình khen: ...
Lý do cấp đổi/cấp lại: ...
Hiện vật xin cấp đổi/cấp lại:
1. ...
(Có hiện vật/hồ sơ kèm theo)

Đơn vị cam đoan những điều khai trên là đúng, nếu sai xin chịu trách nhiệm trước pháp luật.

                                          THỦ TRƯỞNG ĐƠN VỊ
                                     (Ký, ghi rõ họ và tên, đóng dấu)
                                                    ...`
  },
  {
    id: 'hn-mau-05',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 05',
    name: 'Tờ trình đề nghị khen thưởng cấp trên',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022 & Quy định thi đua khen thưởng hiện hành',
    description: 'Mẫu Tờ trình chuẩn đề nghị cấp có thẩm quyền xét tặng Bằng khen, Cờ thi đua hoặc danh hiệu Chiến sĩ thi đua.',
    contentTemplate: `TÊN CƠ QUAN, TỔ CHỨC: ...
Số: …/TTr-...

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày … tháng … năm ...

TỜ TRÌNH
Về việc đề nghị tặng ...
(Khen thưởng thành tích công tác năm ...)

Kính gửi: ...
(qua Cơ quan/Ban Thi đua - Khen thưởng ...)

- Căn cứ Luật Thi đua, Khen thưởng ngày 15 tháng 6 năm 2022;
- Căn cứ các quy định hiện hành về thi đua, khen thưởng;
- Căn cứ kết quả thẩm định hồ sơ của Hội đồng Thi đua - Khen thưởng ...;

Đơn vị ... kính trình cấp có thẩm quyền:
Xét, tặng ... cho:
1. Tập thể: ...
2. Cá nhân: ... - Chức vụ: ...

Đã có thành tích: ...

Các trường hợp đề nghị khen thưởng trên đã được xét duyệt, thẩm định đảm bảo đúng quy định về đối tượng, tiêu chuẩn, hồ sơ và thủ tục.

(Có danh sách và hồ sơ đề nghị khen thưởng kèm theo).

Kính trình cấp có thẩm quyền xem xét, quyết định./.

Nơi nhận:                                    QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ
- Như trên;                                   (Chữ ký, dấu / chữ ký số)
- Lưu: VT.                                                ...`
  },
  {
    id: 'hn-mau-08',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 08',
    name: 'Báo cáo thành tích đề nghị tặng danh hiệu "Chiến sĩ thi đua cấp tỉnh/thành phố"',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022',
    description: 'Báo cáo thành tích cá nhân đề nghị danh hiệu Chiến sĩ thi đua cấp Tỉnh/Thành phố (yêu cầu các năm liên tục đạt CSTĐ cơ sở và có sáng kiến cấp tỉnh/thành phố).',
    contentTemplate: `Mẫu số 08

ĐƠN VỊ CẤP TRÊN: ...
TÊN ĐƠN VỊ: ...
---------------------------------------

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày … tháng … năm ...

BÁO CÁO THÀNH TÍCH
ĐỀ NGHỊ TẶNG DANH HIỆU "CHIẾN SĨ THI ĐUA ..."

I. SƠ LƯỢC LÝ LỊCH
- Họ tên: ...
- Sinh ngày: ... Giới tính: ... Dân tộc: ... Tôn giáo: ...
- Quê quán: ...
- Nơi thường trú: ...
- Cơ quan công tác: ...
- Chức vụ: ...
- Trình độ chuyên môn, nghiệp vụ: ...

II. THÀNH TÍCH ĐẠT ĐƯỢC (Giai đoạn ... - ...)
1. Quyền hạn, nhiệm vụ được giao: ...
2. Thành tích đạt được của cá nhân:
2.1. Kết quả thực hiện nhiệm vụ: ...
2.2. Đổi mới phương pháp và ứng dụng tiến bộ khoa học kỹ thuật/chuyển đổi số: ...
2.3. Chấp hành chủ trương của Đảng, chính sách, pháp luật của Nhà nước: ...

3. Các sáng kiến, đề tài khoa học đã được công nhận:
- Sáng kiến 1: "...", Quyết định công nhận số ... ngày .../.../... của ...
- Sáng kiến 2: "...", Quyết định công nhận số ... ngày .../.../... của ...

III. DANH HIỆU THI ĐUA, HÌNH THỨC KHEN THƯỞNG ĐÃ ĐƯỢC NHẬN
1. Danh hiệu thi đua (các năm đạt CSTĐ cơ sở):
- Năm ...: Danh hiệu "Chiến sĩ thi đua cơ sở" (QĐ số ... ngày .../.../...).
- Năm ...: Danh hiệu "Chiến sĩ thi đua cơ sở" (QĐ số ... ngày .../.../...).
- Năm ...: Danh hiệu "Chiến sĩ thi đua cơ sở" (QĐ số ... ngày .../.../...).

2. Hình thức khen thưởng đã nhận:
- Năm ...: ... (QĐ số ... ngày .../.../...).

   THỦ TRƯỞNG ĐƠN VỊ XÁC NHẬN                 NGƯỜI BÁO CÁO THÀNH TÍCH
        (Ký, đóng dấu)                             (Ký, ghi rõ họ tên)
              ...                                          ...

                 XÁC NHẬN CỦA CẤP TRÌNH KHEN THƯỞNG
                                (Ký, đóng dấu)
                                      ...`
  },
  {
    id: 'hn-mau-10',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 10',
    name: 'Báo cáo thành tích cá nhân đề nghị tặng Bằng khen cấp tỉnh/thành phố/Bộ',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022',
    description: 'Báo cáo thành tích cá nhân đề nghị cấp có thẩm quyền tặng Bằng khen về thành tích công tác (kèm hồ sơ sáng kiến, xếp loại).',
    contentTemplate: `Mẫu số 10

ĐƠN VỊ CẤP TRÊN: ...
TÊN ĐƠN VỊ: ...
---------------------------------------

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày … tháng … năm ...

BÁO CÁO THÀNH TÍCH
ĐỀ NGHỊ TẶNG BẰNG KHEN CỦA ...
(Khen thưởng thành tích công tác năm ...)

I. SƠ LƯỢC LÝ LỊCH
- Họ tên: ...
- Sinh ngày: ... Giới tính: ...
- Quê quán: ...
- Trú quán: ...
- Đơn vị công tác: ...
- Chức vụ: ...
- Trình độ chuyên môn, nghiệp vụ: ...

II. THÀNH TÍCH ĐẠT ĐƯỢC TỪ NĂM ... ĐẾN NĂM ...
1. Quyền hạn, nhiệm vụ được giao: ...
2. Thành tích đạt được của cá nhân:
2.1. Kết quả thực hiện nhiệm vụ được giao: ...
2.2. Những sáng kiến kinh nghiệm, đề tài đã được công nhận:
- Sáng kiến 1: "..." (QĐ công nhận số ... ngày .../.../...).
- Sáng kiến 2: "..." (QĐ công nhận số ... ngày .../.../...).

III. KẾT QUẢ XẾP LOẠI & DANH HIỆU THI ĐUA
1. Xếp loại hoàn thành nhiệm vụ:
- Năm ...: ... (QĐ số ...).
- Năm ...: ... (QĐ số ...).

2. Danh hiệu thi đua:
- Năm ...: Chiến sĩ thi đua cơ sở (QĐ số ...).
- Năm ...: Chiến sĩ thi đua cơ sở (QĐ số ...).

   THỦ TRƯỞNG ĐƠN VỊ XÁC NHẬN                 NGƯỜI BÁO CÁO THÀNH TÍCH
        (Ký, đóng dấu)                             (Ký, ghi rõ họ tên)
              ...                                          ...

                 XÁC NHẬN CỦA CẤP TRÌNH KHEN THƯỞNG
                                (Ký, đóng dấu)
                                      ...`
  },
  {
    id: 'hn-mau-16',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 16',
    name: 'Báo cáo thành tích đề nghị tặng danh hiệu "Chiến sĩ thi đua cơ sở"',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022',
    description: 'Báo cáo thành tích cá nhân hàng năm đề nghị công nhận danh hiệu Chiến sĩ thi đua cơ sở (kèm sáng kiến kinh nghiệm đã được công nhận).',
    contentTemplate: `Mẫu số 16

TÊN ĐƠN VỊ CẤP TRÊN: ...
TÊN ĐƠN VỊ: ...
---------------------------------------

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày … tháng … năm ...

BÁO CÁO THÀNH TÍCH
ĐỀ NGHỊ TẶNG DANH HIỆU "CHIẾN SĨ THI ĐUA CƠ SỞ" NĂM ...

I. SƠ LƯỢC LÝ LỊCH:
- Họ tên: ...
- Sinh ngày: ... Giới tính: ... Dân tộc: ... Tôn giáo: ...
- Quê quán: ...
- Nơi thường trú: ...
- Cơ quan công tác: ...
- Chức vụ: ...
- Trình độ chuyên môn, nghiệp vụ: ...

II. THÀNH TÍCH ĐẠT ĐƯỢC:
1. Quyền hạn, nhiệm vụ được giao: ...
2. Thành tích đạt được của cá nhân:
2.1. Kết quả đạt được về năng suất, chất lượng, hiệu quả thực hiện nhiệm vụ: ...
2.2. Các giải pháp, sáng kiến kinh nghiệm áp dụng vào thực tiễn:
- Tên sáng kiến: "..."
- Quyết định công nhận số: ... ngày .../.../... của ...
- Hiệu quả mang lại: ...
2.3. Chấp hành chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước: ...

III. DANH HIỆU THI ĐUA VÀ HÌNH THỨC KHEN THƯỞNG:
1. Danh hiệu thi đua năm trước liền kề: ...
2. Hình thức khen thưởng: ...

                                                 NGƯỜI VIẾT BÁO CÁO
                                                (Ký, ghi rõ họ và tên)
                                                          ...

   THỦ TRƯỞNG ĐƠN VỊ XÁC NHẬN            XÁC NHẬN CỦA CẤP TRÌNH KHEN THƯỞNG
        (Ký, đóng dấu)                               (Ký, đóng dấu)
              ...                                          ...`
  },
  {
    id: 'hn-mau-21',
    category: 'ha_noi_khen_thuong',
    formNumber: 'Mẫu số 21',
    name: 'Văn bản xác nhận hiệu quả áp dụng & phạm vi ảnh hưởng của Sáng kiến / Đề tài',
    legalBasis: 'Luật Thi đua, Khen thưởng năm 2022 & Thông tư số 18/2013/TT-BKHCN',
    description: 'Văn bản của cơ quan, tổ chức có thẩm quyền xác nhận hiệu quả áp dụng, phạm vi ảnh hưởng làm căn cứ đề nghị xét tặng danh hiệu CSTĐ các cấp.',
    contentTemplate: `Mẫu số 21

TÊN CƠ QUAN, TỔ CHỨC: ...
Số: .../XN-...
V/v xác nhận hiệu quả áp dụng và
phạm vi ảnh hưởng của sáng kiến

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
..., ngày ... tháng ... năm ...

Kính gửi: ...

- Căn cứ Luật Thi đua, Khen thưởng ngày 15 tháng 6 năm 2022;
- Căn cứ Nghị định số 13/2012/NĐ-CP ngày 02 tháng 3 năm 2012 của Chính phủ ban hành Điều lệ Sáng kiến;
- Căn cứ các quy định và hướng dẫn hiện hành về đánh giá phạm vi ảnh hưởng sáng kiến;
- Căn cứ Biên bản họp Hội đồng xét công nhận sáng kiến ngày ... tháng ... năm ...;

Cơ quan/Đơn vị ... xác nhận hiệu quả áp dụng, khả năng nhân rộng của sáng kiến đề nghị xét, tặng danh hiệu thi đua/khen thưởng cho cá nhân sau đây:

1. Họ và tên: ...
Chức vụ, đơn vị công tác: ...
- Tên sáng kiến: "..."
- Hiệu quả đạt được khi áp dụng sáng kiến: ...
- Khả năng nhân rộng và phạm vi ảnh hưởng của sáng kiến: ...

Ý kiến của cơ quan, tổ chức có thẩm quyền: Thống nhất xác nhận sáng kiến đạt hiệu quả áp dụng và có phạm vi ảnh hưởng ..., đủ điều kiện đề nghị xét tặng danh hiệu Chiến sĩ thi đua và các hình thức khen thưởng cấp trên theo quy định./.

Nơi nhận:                                    QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ
- Như trên;                                   (Chữ ký, dấu / chữ ký số)
- Lưu: VT.                                                ...`
  },

  // ==========================================
  // 3. CÁC MẪU KẾ HOẠCH & VĂN BẢN CỦA TỔ / NHÓM CHUYÊN MÔN
  // ==========================================
  {
    id: 'to-cm-phu-luc-1',
    category: 'to_chuyen_mon',
    formNumber: 'Phụ lục 1 (CV 5512)',
    name: 'Kế hoạch dạy học môn học của Tổ chuyên môn (Cả năm học)',
    legalBasis: 'Công văn số 5512/BGDĐT-GDTrH ngày 18/12/2020 của Bộ GD&ĐT',
    description: 'Khung kế hoạch dạy học của Tổ chuyên môn gồm Phân phối chương trình chi tiết, Chuyên đề lựa chọn, Kiểm tra đánh giá định kỳ và Phòng học bộ môn.',
    contentTemplate: `TRƯỜNG ...                                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN: ...                          Độc lập - Tự do - Hạnh phúc
--------------------                       --------------------------

KẾ HOẠCH DẠY HỌC CỦA TỔ CHUYÊN MÔN
MÔN HỌC: ... - KHỐI LỚP: ...
NĂM HỌC ... - ...

I. ĐẶC ĐIỂM TÌNH HÌNH
1. Số lớp: ...; Số học sinh: ...
2. Đội ngũ giáo viên: ...
3. Thiết bị dạy học: ...
4. Phòng học bộ môn/Phòng chức năng: ...

II. KẾ HOẠCH DẠY HỌC
1. Phân phối chương trình:
| STT | Bài học / Chủ đề | Số tiết | Thời điểm (Tuần) | Thiết bị dạy học | Địa điểm dạy học |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | ... | ... | ... | ... | ... |
| 2 | ... | ... | ... | ... | ... |
| 3 | ... | ... | ... | ... | ... |

2. Chuyên đề lựa chọn (nếu có):
- Chuyên đề: ... (Số tiết: ...).

3. Kiểm tra, đánh giá định kỳ:
| Bài kiểm tra, đánh giá | Thời gian | Thời điểm | Yêu cầu cần đạt | Hình thức |
| :--- | :---: | :---: | :--- | :--- |
| Giữa Học kỳ 1 | ... phút | Tuần ... | ... | ... |
| Cuối Học kỳ 1 | ... phút | Tuần ... | ... | ... |
| Giữa Học kỳ 2 | ... phút | Tuần ... | ... | ... |
| Cuối Học kỳ 2 | ... phút | Tuần ... | ... | ... |

III. CÁC NHIỆM VỤ KHÁC
- Bồi dưỡng học sinh có năng khiếu: ...
- Phụ đạo học sinh cần hỗ trợ: ...

                                         ..., ngày ... tháng ... năm ...
    HIỆU TRƯỞNG PHÊ DUYỆT                          TỔ TRƯỞNG CHUYÊN MÔN
      (Ký và đóng dấu)                             (Ký và ghi rõ họ tên)
            ...                                            ...`
  },
  {
    id: 'to-cm-phu-luc-2',
    category: 'to_chuyen_mon',
    formNumber: 'Phụ lục 2 (CV 5512)',
    name: 'Kế hoạch tổ chức các hoạt động giáo dục của Tổ chuyên môn',
    legalBasis: 'Công văn số 5512/BGDĐT-GDTrH ngày 18/12/2020 của Bộ GD&ĐT',
    description: 'Kế hoạch tổ chức các hoạt động giáo dục ngoài giờ, chuyên đề ngoại khóa, ngày hội STEM và câu lạc bộ học thuật.',
    contentTemplate: `TRƯỜNG ...                                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN: ...                          Độc lập - Tự do - Hạnh phúc
--------------------                       --------------------------

KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC NĂM HỌC ... - ...

1. Khối lớp: ...; Số học sinh tham gia: ...
2. Danh mục hoạt động giáo dục chuyên đề:

| STT | Chủ đề hoạt động | Yêu cầu cần đạt | Số tiết | Thời điểm | Địa điểm | Chủ trì | Phối hợp | Điều kiện thực hiện |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | ... | ... | ... | ... | ... | ... | ... | ... |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |

                                         ..., ngày ... tháng ... năm ...
    HIỆU TRƯỞNG PHÊ DUYỆT                          TỔ TRƯỞNG CHUYÊN MÔN
      (Ký và đóng dấu)                             (Ký và ghi rõ họ tên)
            ...                                            ...`
  },
  {
    id: 'to-cm-phu-luc-3',
    category: 'to_chuyen_mon',
    formNumber: 'Phụ lục 3 (CV 5512)',
    name: 'Kế hoạch giáo dục của Giáo viên trong năm học',
    legalBasis: 'Công văn số 5512/BGDĐT-GDTrH ngày 18/12/2020 của Bộ GD&ĐT',
    description: 'Kế hoạch giáo dục cá nhân của giáo viên phân công nhiệm vụ giảng dạy, thiết bị sử dụng, phòng bộ môn và các nhiệm vụ khác.',
    contentTemplate: `TRƯỜNG ...                                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN: ...                          Độc lập - Tự do - Hạnh phúc
--------------------                       --------------------------

KẾ HOẠCH GIÁO DỤC CỦA GIÁO VIÊN
NĂM HỌC ... - ...

Họ và tên giáo viên: ...
Nhiệm vụ được phân công: ...

I. KẾ HOẠCH DẠY HỌC
1. Phân phối chương trình chi tiết theo từng bài học, tiết dạy, thiết bị dạy học và địa điểm học tập.
2. Nhiệm vụ kiểm tra đánh giá định kỳ và thường xuyên.
3. Kế hoạch bồi dưỡng học sinh và phụ đạo học sinh.

II. KẾ HOẠCH BỒI DƯỠNG CHUYÊN MÔN VÀ TỰ HỌC
1. Tham gia các lớp tập huấn đổi mới phương pháp và chuyển đổi số.
2. Đăng ký thực hiện đề tài / sáng kiến kinh nghiệm trong năm học: ...

                                         ..., ngày ... tháng ... năm ...
    TỔ TRƯỞNG CHUYÊN MÔN                               GIÁO VIÊN
    (Ký và ghi rõ họ tên)                        (Ký và ghi rõ họ tên)
            ...                                          ...`
  },
  {
    id: 'to-cm-bien-ban-ncbh',
    category: 'to_chuyen_mon',
    formNumber: 'Mẫu BB-SHCM',
    name: 'Biên bản Sinh hoạt chuyên môn theo Nghiên cứu bài học (4 bước)',
    legalBasis: 'Công văn số 5555/BGDĐT-GDTrH & Hướng dẫn SHCM theo NCBH',
    description: 'Biên bản sinh hoạt chuyên môn định kỳ theo đúng quy trình 4 bước nghiên cứu bài học chuẩn Bộ GD&ĐT.',
    contentTemplate: `TRƯỜNG ...                                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN: ...                          Độc lập - Tự do - Hạnh phúc
--------------------                       --------------------------

BIÊN BẢN SINH HOẠT CHUYÊN MÔN THEO NGHIÊN CỨU BÀI HỌC
(LẦN ... - THÁNG ... NĂM ...)

Thời gian: ... giờ ... ngày ... tháng ... năm ...
Địa điểm: ...
Thành phần tham dự: .../... giáo viên trong tổ (Vắng: ...).
Chủ trì: Đồng chí ... - Chức vụ: ...
Thư ký: Đồng chí ... - Chức vụ: ...

NỘI DUNG SINH HOẠT:

BƯỚC 1: XÂY DỰNG KẾ HOẠCH BÀI DẠY MINH HỌA
- Bài học nghiên cứu: ...
- Giáo viên dạy minh họa được phân công: ...
- Nhóm chuyên môn thảo luận, thiết kế các hoạt động học tập: ...

BƯỚC 2: TỔ CHỨC DẠY HỌC MINH HỌA VÀ DỰ GIỜ QUAN SÁT
- Tiết dạy được tiến hành vào ngày .../.../... tại lớp ...
- Quan sát và ghi nhận hoạt động học của học sinh: ...

BƯỚC 3: PHÂN TÍCH VÀ SUY NGẪM BÀI HỌC
- Ý kiến chia sẻ của giáo viên dạy minh họa: ...
- Ý kiến đóng góp và phân tích của các thành viên trong tổ: ...

BƯỚC 4: VẬN DỤNG BÀI HỌC VÀO THỰC TIỄN
- Thống nhất các biện pháp sư phạm rút ra để áp dụng vào các bài học tiếp theo: ...

Cuộc họp kết thúc lúc ... giờ ... cùng ngày.

         THƯ KÝ CUỘC HỌP                           CHỦ TRÌ CUỘC HỌP
      (Ký và ghi rõ họ tên)                      (Ký và ghi rõ họ tên)
              ...                                        ...`
  },
  {
    id: 'to-cm-phieu-du-gio',
    category: 'to_chuyen_mon',
    formNumber: 'Mẫu Phiếu Dự giờ',
    name: 'Phiếu dự giờ và đánh giá tiết dạy giáo viên',
    legalBasis: 'Thông tư số 20/2018/TT-BGDĐT & Công văn hướng dẫn đánh giá giờ dạy',
    description: 'Phiếu dự giờ, phân tích hoạt động học của học sinh và đánh giá giờ dạy theo chuẩn nghề nghiệp giáo viên.',
    contentTemplate: `TRƯỜNG ...                                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                           Độc lập - Tự do - Hạnh phúc
                                           --------------------------

PHIẾU DỰ GIỜ VÀ ĐÁNH GIÁ TIẾT DẠY

Họ và tên người dạy: ...
Môn học: ... - Lớp: ... - Tiết theo PPCT: ...
Tên bài học: ...
Họ và tên người dự: ... - Chức vụ: ...

I. TIẾN TRÌNH VÀ HOẠT ĐỘNG HỌC TẬP CỦA HỌC SINH
| Thời gian | Hoạt động của Giáo viên | Hoạt động của Học sinh | Phân tích hoạt động học của HS |
| :---: | :--- | :--- | :--- |
| ... | Hoạt động 1: Mở đầu / Khởi động | ... | ... |
| ... | Hoạt động 2: Hình thành kiến thức mới | ... | ... |
| ... | Hoạt động 3: Luyện tập | ... | ... |
| ... | Hoạt động 4: Vận dụng | ... | ... |

II. NHẬN XÉT VÀ ĐÁNH GIÁ TIẾT DẠY
1. Kế hoạch và tài liệu dạy học: ...
2. Hoạt động của giáo viên: ...
3. Hoạt động của học sinh: ...

XẾP LOẠI TIẾT DẠY: ...

                                           ..., ngày ... tháng ... năm ...
                                                    NGƯỜI DỰ GIỜ
                                                (Ký và ghi rõ họ tên)
                                                        ...`
  }
];
