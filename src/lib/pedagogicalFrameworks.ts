/**
 * Từ điển & Quy chuẩn Sư phạm Chuẩn hóa 32 Kỹ thuật Dạy học Tích cực & Các Phương pháp Dạy học
 * Dựa trên tài liệu nghiệp vụ sư phạm & bồi dưỡng giáo viên phát triển năng lực học sinh
 * Phục vụ tích hợp sâu và cụ thể hóa vào từng bước (B1-B4) của Giáo án chuẩn CV 5512 / CV 2345
 */

export interface PedagogicalMethodGuide {
  name: string;
  category: 'method' | 'technique';
  corePrinciples: string;
  step1GiaoNhiemVu: string;
  step2ThucHien: string;
  step3BaoCaoThaoLuan: string;
  step4KetLuanNhanDinh: string;
  sanPhamDuKienGuidance?: string;
}

export const PEDAGOGICAL_METHODS_DICTIONARY: Record<string, PedagogicalMethodGuide> = {
  // ==========================================
  // PHƯƠNG PHÁP DẠY HỌC TÍCH CỰC
  // ==========================================
  "Dạy học nhóm / Hợp tác": {
    name: "Dạy học nhóm / Hợp tác",
    category: "method",
    corePrinciples: "Chia lớp thành các nhóm nhỏ (4-6 HS), phân công rõ vai trò (Nhóm trưởng, Thư ký, Báo cáo viên, Phản biện); mỗi nhóm tự lực hoàn thành nhiệm vụ, phát triển năng lực giao tiếp và hợp tác.",
    step1GiaoNhiemVu: "GV giới thiệu chủ đề, xác định nhiệm vụ rõ ràng cho từng nhóm (giao phiếu học tập, bảng phụ, phương tiện), quy định thời gian thảo luận (5-8 phút) và tiêu chí đánh giá sản phẩm.",
    step2ThucHien: "HS làm việc cá nhân 1-2 phút suy nghĩ độc lập, sau đó các thành viên trong nhóm thảo luận, lập kế hoạch giải quyết nhiệm vụ, thống nhất kết quả và ghi vào bảng nhóm/phiếu học tập. GV bao quát, hướng dẫn các nhóm gặp khó khăn.",
    step3BaoCaoThaoLuan: "Đại diện các nhóm trình bày kết quả trước toàn lớp; các nhóm khác chú ý lắng nghe, chất vấn, phản biện chéo và bổ sung ý kiến.",
    step4KetLuanNhanDinh: "GV nhận xét tinh thần cộng tác của từng nhóm, chuẩn hóa kiến thức khoa học, chốt nội dung cốt lõi và hướng dẫn HS hoàn thiện ghi chép vào vở."
  },
  "Dạy học Tích cực": {
    name: "Dạy học Tích cực",
    category: "method",
    corePrinciples: "Lấy học sinh làm trung tâm, kích thích tư duy độc lập kết hợp tương tác nhóm, tăng cường hoạt động trải nghiệm thực hành và vận dụng kiến thức.",
    step1GiaoNhiemVu: "GV chuyển giao nhiệm vụ học tập rõ ràng, chia lớp thành các nhóm, cung cấp phiếu học tập và quy định thời gian hoàn thành cụ thể (5-7 phút).",
    step2ThucHien: "HS làm việc độc lập suy nghĩ cá nhân, sau đó thảo luận sôi nổi trong nhóm, đối chiếu kết quả, ghi chép vào bảng phụ / vở. GV đi từng bàn quan sát, trợ giúp.",
    step3BaoCaoThaoLuan: "Đại diện 1-2 nhóm lên bảng trình bày hoặc báo cáo trước lớp; các nhóm khác chú ý lắng nghe, chất vấn, đặt câu hỏi phản biện.",
    step4KetLuanNhanDinh: "GV chuẩn hóa kiến thức, phân tích các điểm sáng tạo và lỗi sai thường gặp của HS, chốt nội dung cốt lõi vào vở."
  },
  "Dạy học giải quyết vấn đề (PBL)": {
    name: "Dạy học giải quyết vấn đề (PBL)",
    category: "method",
    corePrinciples: "Đặt ra trước HS vấn đề nhận thức có mâu thuẫn giữa cái đã biết và cái chưa biết, kích thích nhu cầu tự lực khám phá và tìm giải pháp tối ưu qua 4 bước.",
    step1GiaoNhiemVu: "GV tạo tình huống có vấn đề xuất phát từ thực tiễn tạo mâu thuẫn nhận thức; hướng dẫn HS nhận biết và phát biểu chính xác vấn đề/tình huống cần giải quyết.",
    step2ThucHien: "HS thu thập thông tin, đề xuất các giả thuyết, liệt kê các cách giải quyết có thể có, phân tích ưu nhược điểm và lựa chọn phương án tối ưu nhất. GV hướng dẫn, cố vấn.",
    step3BaoCaoThaoLuan: "Các nhóm trình bày giải pháp của mình, lập luận bảo vệ phương án và phản biện tính khả thi của các giải pháp từ nhóm bạn.",
    step4KetLuanNhanDinh: "GV phân tích, so sánh các phương án giải quyết vấn đề, chốt lại phương pháp giải quyết tối ưu nhất và khái quát hóa thành quy tắc/thuật toán."
  },
  "Dạy học theo Dự án (PBL)": {
    name: "Dạy học theo Dự án (PBL)",
    category: "method",
    corePrinciples: "HS thực hiện một nhiệm vụ học tập phức hợp, gắn với thực tiễn, kết hợp lý thuyết với thực hành, tạo ra sản phẩm hành động có thể công bố, giới thiệu được.",
    step1GiaoNhiemVu: "GV nêu bối cảnh thực tiễn và bài toán thực tế của dự án, công bố Bộ Tiêu chí Đánh giá sản phẩm (Rubric), phân công vai trò trong nhóm.",
    step2ThucHien: "Các nhóm lập kế hoạch dự án, phân tích yêu cầu, thu thập thông tin/làm thí nghiệm/chế tạo mô hình thử nghiệm, tự kiểm tra đối chiếu tiêu chí Rubric.",
    step3BaoCaoThaoLuan: "Các nhóm trưng bày sản phẩm dự án (Poster, Mô hình, Bản thuyết trình, Video clip), đại diện nhóm thuyết minh quy trình và tính ứng dụng; các nhóm bạn phản biện, chấm chéo.",
    step4KetLuanNhanDinh: "GV đánh giá quy trình làm việc, mức độ sáng tạo và chất lượng sản phẩm; tổng kết kiến thức khoa học đằng sau dự án và mở rộng thực tế."
  },
  "Bàn tay nặn bột": {
    name: "Bàn tay nặn bột",
    category: "method",
    corePrinciples: "Quy trình 5 bước: 1. Tình huống xuất phát ➔ 2. Bộc lộ quan niệm ban đầu ➔ 3. Đề xuất câu hỏi & phương án thực nghiệm ➔ 4. Tiến hành thực nghiệm tìm tòi ➔ 5. Kết luận, hợp thức hóa kiến thức.",
    step1GiaoNhiemVu: "GV đưa ra tình huống xuất phát / hiện tượng tự nhiên gợi mở, yêu cầu HS vẽ hoặc ghi lại quan niệm ban đầu (suy nghĩ ban đầu) của cá nhân vào vở thực hành.",
    step2ThucHien: "HS thảo luận nhóm, so sánh các quan niệm ban đầu khác biệt, đề xuất câu hỏi thắc mắc và tự thiết kế phương án thí nghiệm / thực nghiệm kiểm chứng. HS tiến hành thí nghiệm, ghi lại bảng số liệu/hiện tượng.",
    step3BaoCaoThaoLuan: "Đại diện nhóm báo cáo kết quả thực nghiệm, so sánh hiện tượng quan sát được với quan niệm ban đầu để khẳng định hay bác bỏ dự đoán.",
    step4KetLuanNhanDinh: "GV chuẩn hóa kiến thức khoa học, hướng dẫn HS rút ra kết luận bản chất hiện tượng và chỉnh sửa quan niệm ban đầu cho đúng đắn."
  },
  "Dạy học theo Trạm": {
    name: "Dạy học theo Trạm",
    category: "method",
    corePrinciples: "Chia không gian lớp học thành 3-4 trạm học tập độc lập hoặc liên hoàn với các gói nhiệm vụ đa dạng (Trạm Khám phá, Trạm Thực hành, Trạm Vận dụng, Trạm Thử thách).",
    step1GiaoNhiemVu: "GV giới thiệu sơ đồ luân chuyển các Trạm, phát Phiếu hành trình học tập và quy định thời gian tại mỗi trạm (7-8 phút/trạm).",
    step2ThucHien: "Các nhóm di chuyển và thực hiện nhiệm vụ tại các Trạm theo đúng vòng luân chuyển, tự kiểm tra đáp án ẩn hoặc tương tác với học liệu. GV bao quát, hỗ trợ.",
    step3BaoCaoThaoLuan: "Sau khi hoàn thành qua tất cả các trạm, các nhóm tổng hợp Phiếu hành trình, cử đại diện báo cáo kết quả trạm khó nhất hoặc giải thích cách xử lý tình huống thử thách.",
    step4KetLuanNhanDinh: "GV hệ thống hóa toàn bộ kiến thức qua các trạm, biểu dương nhóm hoàn thành xuất sắc lộ trình và chốt kiến thức trọng tâm vào vở."
  },
  "Dạy học khám phá (Inquiry-based)": {
    name: "Dạy học khám phá (Inquiry-based)",
    category: "method",
    corePrinciples: "Học sinh đóng vai trò nhà nghiên cứu, tự khám phá quy luật, định lí, công thức thông qua quan sát mẫu, quy nạp và phân tích.",
    step1GiaoNhiemVu: "GV cung cấp các tập dữ liệu, bảng số liệu mẫu hoặc mô phỏng trực quan tương tác và giao nhiệm vụ khám phá quy luật ẩn chứa.",
    step2ThucHien: "HS thao tác khảo sát các trường hợp cụ thể, lập bảng so sánh, phát hiện mối liên hệ và đưa ra dự đoán quy tắc chung.",
    step3BaoCaoThaoLuan: "HS chia sẻ dự đoán quy luật trước lớp, trình bày các chứng cứ toán học hoặc thực nghiệm để chứng minh dự đoán đó luôn đúng.",
    step4KetLuanNhanDinh: "GV dẫn dắt HS phát biểu chính xác định lý / tính chất / công thức tổng quát và cùng HS chứng minh chặt chẽ."
  },
  "Lớp học Đảo ngược (Flipped Classroom)": {
    name: "Lớp học Đảo ngược (Flipped Classroom)",
    category: "method",
    corePrinciples: "HS tự học lý thuyết cơ bản ở nhà qua video/tài liệu; thời gian trên lớp tập trung 100% vào thảo luận chuyên sâu, giải bài tập nâng cao và giải quyết tình huống.",
    step1GiaoNhiemVu: "GV kiểm tra nhanh mức độ chuẩn bị bài ở nhà; giao các bài tập tình huống chuyên sâu cho các nhóm.",
    step2ThucHien: "HS vận dụng kiến thức đã học trước ở nhà để cùng thảo luận, giải quyết các ca bài tập nâng cao và bài toán thực tế phức tạp.",
    step3BaoCaoThaoLuan: "HS bảo vệ các bước giải quyết tình huống, đặt câu hỏi về những phần kiến thức chưa hiểu rõ khi tự học ở nhà.",
    step4KetLuanNhanDinh: "GV giải đáp các khúc mắc học sinh gặp phải khi tự học, hoàn thiện hệ thống kiến thức chuyên sâu và mở rộng tầm nhìn học sinh."
  },
  "Hành trình Thám hiểm/Cốt truyện": {
    name: "Hành trình Thám hiểm/Cốt truyện",
    category: "method",
    corePrinciples: "Gắn bài học vào một cốt truyện nhập vai ly kỳ, biến mỗi nhiệm vụ học tập thành một thử thách trên hành trình.",
    step1GiaoNhiemVu: "GV dẫn nhập cốt truyện nhiệm vụ (Storyline), phát bản đồ hành trình cho các đội thám hiểm và công bố thử thách cửa ải đầu tiên.",
    step2ThucHien: "Các nhóm phối hợp giải mã các câu đố/bài toán để thu thập chìa khóa vượt qua từng cửa ải kiến thức. GV hỗ trợ gợi ý khi nhóm gặp bế tắc.",
    step3BaoCaoThaoLuan: "Nhóm về đích báo cáo chìa khóa kiến thức tìm được; giải thích thuật toán/công thức đã giúp đội vượt qua các thử thách.",
    step4KetLuanNhanDinh: "GV trao huy hiệu chiến thắng cho các đội, tổng kết bài học thông qua sơ đồ kho báu tri thức đã thu hoạch."
  },
  "Dạy học Tích hợp theo Mô đun định hướng năng lực": {
    name: "Dạy học Tích hợp theo Mô đun định hướng năng lực",
    category: "method",
    corePrinciples: "Tích hợp lý thuyết với thực hành giải quyết tình huống nghề nghiệp/thực tiễn, tiếp cận định hướng hành động trọn vẹn: Nhận thức - Tư duy - Hành động - Tự đánh giá.",
    step1GiaoNhiemVu: "GV đưa ra vấn đề nhiệm vụ bài dạy, trình bày yêu cầu kỹ thuật và tiêu chuẩn sản phẩm cần đạt, thống nhất kế hoạch làm việc.",
    step2ThucHien: "HS tự thu thập thông tin, lập kế hoạch quy trình và trực tiếp thao tác tạo ra sản phẩm (bản thiết kế, thuật toán, mô hình mô phỏng, bài giải hoàn chỉnh).",
    step3BaoCaoThaoLuan: "HS báo cáo sản phẩm, đối chiếu với tiêu chuẩn kỹ thuật đã đề ra, thảo luận phương án tối ưu.",
    step4KetLuanNhanDinh: "GV và HS cùng đánh giá, rút kinh nghiệm, điều chỉnh và củng cố giải quyết vấn đề."
  },
  "WebQuest": {
    name: "WebQuest",
    category: "method",
    corePrinciples: "Dạy học theo định hướng khám phá trên nền tảng internet có cấu trúc (Mở đầu, Nhiệm vụ, Tiến trình, Nguồn tài nguyên, Đánh giá, Kết luận).",
    step1GiaoNhiemVu: "GV giới thiệu đường link WebQuest và giao nhiệm vụ truy tìm giải pháp cho các nhóm.",
    step2ThucHien: "HS sử dụng thiết bị số tra cứu tài nguyên đã định hướng, xử lý thông tin và hoàn thành báo cáo.",
    step3BaoCaoThaoLuan: "Các nhóm trình bày sản phẩm số hóa trước lớp.",
    step4KetLuanNhanDinh: "GV chuẩn hóa kiến thức và giáo dục kỹ năng sử dụng internet an toàn."
  },

  // ==========================================
  // 32 KỸ THUẬT DẠY HỌC TÍCH CỰC HIỆU QUẢ NHẤT
  // ==========================================
  "1. Kỹ thuật Các mảnh ghép (Jigsaw)": {
    name: "1. Kỹ thuật Các mảnh ghép (Jigsaw)",
    category: "technique",
    corePrinciples: "2 Vòng: Vòng 1 (Nhóm chuyên sâu) tìm hiểu 1 phần nhiệm vụ độc lập; Vòng 2 (Nhóm mảnh ghép) tập hợp chuyên gia từ các nhóm để chia sẻ và ghép nối thành bức tranh toàn diện.",
    step1GiaoNhiemVu: "Vòng 1 (Nhóm Chuyên sâu): Chia lớp thành các nhóm (Nhóm 1 tìm hiểu Phần A, Nhóm 2 tìm hiểu Phần B, Nhóm 3 tìm hiểu Phần C...). GV giao phiếu nhiệm vụ chuyên sâu.",
    step2ThucHien: "Giai đoạn 1: Các thành viên nhóm chuyên sâu thảo luận và trở thành 'chuyên gia' về nội dung của mình. Giai đoạn 2 (Vòng Mảnh ghép): Tái lập nhóm mới (mỗi nhóm gồm 1 thành viên từ Nhóm 1, 2, 3...). Từng chuyên gia lần lượt giảng giải nội dung của mình cho các bạn trong nhóm mới nghe và ghép nối thành bài giải hoàn chỉnh.",
    step3BaoCaoThaoLuan: "GV gọi ngẫu nhiên một thành viên bất kỳ trong nhóm mảnh ghép trình bày lại nội dung do bạn khác vừa truyền đạt để kiểm tra tính tiếp thu và chuyển giao thông tin.",
    step4KetLuanNhanDinh: "GV tổng kết toàn bộ bức tranh kiến thức bài học, đánh giá kỹ năng truyền đạt của các 'chuyên gia' và chốt đáp án chuẩn."
  },
  "2. Kỹ thuật Khăn trải bàn": {
    name: "2. Kỹ thuật Khăn trải bàn",
    category: "technique",
    corePrinciples: "Bố trí giấy A0 chia 4-6 góc độc lập cho các cá nhân viết ý kiến riêng và 1 ô trung tâm để tổng hợp ý kiến thống nhất của cả nhóm.",
    step1GiaoNhiemVu: "GV phát giấy A0 chia góc và ô giữa; giao câu hỏi/bài toán trọng tâm cho từng nhóm 4-6 HS.",
    step2ThucHien: "Giai đoạn 1 (2-3 phút): Từng cá nhân độc lập suy nghĩ và viết câu trả lời của mình vào góc riêng trên giấy A0 (không trao đổi). Giai đoạn 2 (3-4 phút): Cả nhóm thảo luận, so sánh các ý kiến cá nhân và thống nhất nội dung cốt lõi viết vào ô chính giữa.",
    step3BaoCaoThaoLuan: "Đại diện nhóm dán tờ giấy Khăn trải bàn lên bảng, báo cáo nội dung tại ô chính giữa và nêu rõ những điểm sáng tạo hoặc tranh luận giữa các góc cá nhân.",
    step4KetLuanNhanDinh: "GV nhận xét kỹ năng làm việc độc lập và hợp tác của nhóm, chuẩn hóa đáp án trong ô chính giữa và nhận xét các góc cá nhân."
  },
  "3. Kỹ thuật Động não (Brainstorming)": {
    name: "3. Kỹ thuật Động não (Brainstorming)",
    category: "technique",
    corePrinciples: "Huy động tối đa số lượng ý tưởng mới mẻ, độc đáo trong thời gian ngắn (tạo cơn lốc ý tưởng); nguyên tắc: không phê bình hay chỉ trích trong quá trình thu thập ý kiến.",
    step1GiaoNhiemVu: "GV nêu chủ đề/vấn đề mở, quy định thời gian (2-3 phút), phân công nhóm trưởng điều hành và thư ký ghi chép tất cả các ý kiến.",
    step2ThucHien: "Các thành viên trong nhóm liên tục đưa ra ý kiến, thư ký ghi nhanh lên bảng hoặc giấy to. Cả nhóm sau đó cùng phân loại, thu gọn các ý trùng lặp và chọn lọc giải pháp tối ưu.",
    step3BaoCaoThaoLuan: "Thư ký báo cáo danh sách ý tưởng và giải pháp tốt nhất của nhóm trước lớp.",
    step4KetLuanNhanDinh: "GV nhận xét độ phong phú của các ý tưởng, tổng kết và định hướng giải pháp hiệu quả."
  },
  "4. Kỹ thuật Bể cá": {
    name: "4. Kỹ thuật Bể cá",
    category: "technique",
    corePrinciples: "Nhóm trung tâm (Vòng trong) ngồi thảo luận; các học sinh còn lại ngồi vòng ngoài quan sát như xem cá trong bể, lắng nghe và nhận xét cách ứng xử, lập luận của nhóm trong.",
    step1GiaoNhiemVu: "GV đưa ra chủ đề thảo luận cho nhóm trung tâm (4-6 HS), các HS còn lại ngồi xung quanh theo dõi, ghi chép biên bản quan sát.",
    step2ThucHien: "Nhóm trung tâm thảo luận, tranh luận sôi nổi về chủ đề. Nhóm quan sát lắng nghe và ghi nhận các lập luận thuyết phục hoặc điểm chưa hợp lý.",
    step3BaoCaoThaoLuan: "Khi kết thúc thảo luận, nhóm quan sát đưa ra nhận xét, đánh giá về tiến trình và nội dung của nhóm trung tâm.",
    step4KetLuanNhanDinh: "GV đúc kết nội dung bài học, nhận xét kỹ năng lắng nghe và tranh biện của học sinh."
  },
  "5. Kỹ thuật Tia chớp": {
    name: "5. Kỹ thuật Tia chớp",
    category: "technique",
    corePrinciples: "Huy động sự tham gia tức thì của mọi thành viên vào một câu hỏi nhanh (1-2 câu), tạo không khí học tập cởi mở, sôi động.",
    step1GiaoNhiemVu: "GV nêu câu hỏi ngắn gọn về cảm nhận hoặc ý tưởng cốt lõi của bài học.",
    step2ThucHien: "Lần lượt từng HS phát biểu thật nhanh suy nghĩ của mình trong vòng 5-10 giây (không lặp lại y nguyên ý kiến bạn trước).",
    step3BaoCaoThaoLuan: "Tiến hành thảo luận nhanh khi tất cả các thành viên đã phát biểu xong.",
    step4KetLuanNhanDinh: "GV tổng hợp các từ khóa xuất hiện nhiều nhất và chốt thông điệp bài học."
  },
  "6. Kỹ thuật XYZ (Kỹ thuật 635)": {
    name: "6. Kỹ thuật XYZ (Kỹ thuật 635)",
    category: "technique",
    corePrinciples: "Mỗi nhóm 6 người (X=6), mỗi người viết 3 ý kiến (Y=3) trong 5 phút (Z=5) rồi chuyền giấy cho người bên cạnh bổ sung tiếp nối.",
    step1GiaoNhiemVu: "GV chia nhóm 6 người, phát phiếu XYZ và nêu vấn đề cần tìm giải pháp.",
    step2ThucHien: "Mỗi thành viên viết 3 ý kiến trong 5 phút, sau đó chuyền phiếu sang người bên cạnh để đọc và phát triển thêm 3 ý kiến mới; lặp lại qua các vòng.",
    step3BaoCaoThaoLuan: "Nhóm tổng hợp toàn bộ các ý kiến thu được, chọn ra 3 ý tưởng xuất sắc nhất để báo cáo.",
    step4KetLuanNhanDinh: "GV đánh giá hiệu quả phát triển ý tưởng tiếp nối và chốt kiến thức."
  },
  "7. Kỹ thuật Sơ đồ tư duy": {
    name: "7. Kỹ thuật Sơ đồ tư duy",
    category: "technique",
    corePrinciples: "Ghi chép và tổng hợp kiến thức bằng từ khóa trung tâm, các nhánh phân cấp logic, màu sắc và biểu tượng trực quan sinh động.",
    step1GiaoNhiemVu: "GV giao chủ đề trung tâm, phát giấy vẽ và bút màu, hướng dẫn các nhánh lớn.",
    step2ThucHien: "HS phát triển các nhánh chính và nhánh phụ, viết từ khóa, vẽ hình minh họa và kết nối các khái niệm.",
    step3BaoCaoThaoLuan: "HS trưng bày và thuyết trình sơ đồ tư duy của nhóm/cá nhân.",
    step4KetLuanNhanDinh: "GV nhận xét tính logic, tính bao quát và chuẩn hóa kiến thức trên sơ đồ mẫu."
  },
  "8. Kỹ thuật Chia sẻ nhóm đôi (Think, Pair, Share)": {
    name: "8. Kỹ thuật Chia sẻ nhóm đôi (Think, Pair, Share)",
    category: "technique",
    corePrinciples: "Gồm 3 nhịp: Think (Tự suy nghĩ độc lập) ➔ Pair (Trao đổi với bạn cùng bàn) ➔ Share (Chia sẻ trước nhóm lớn hoặc cả lớp).",
    step1GiaoNhiemVu: "GV nêu câu hỏi mở, yêu cầu HS dừng lại 1-2 phút suy nghĩ cá nhân (Think).",
    step2ThucHien: "HS bắt cặp với bạn bên cạnh, chia sẻ và đối chiếu cách giải quyết của mình, chỉnh sửa và hoàn thiện (Pair).",
    step3BaoCaoThaoLuan: "Đại diện cặp đôi chia sẻ ý kiến đã thống nhất trước toàn lớp (Share).",
    step4KetLuanNhanDinh: "GV nhận xét câu trả lời, khen ngợi sự phối hợp của các cặp đôi và chốt đáp án."
  },
  "9. Kỹ thuật Kipling (5W1H)": {
    name: "9. Kỹ thuật Kipling (5W1H)",
    category: "technique",
    corePrinciples: "Khai thác toàn diện một vấn đề qua hệ thống 6 câu hỏi cốt lõi: Who (Ai), What (Cái gì), Where (Ở đâu), When (Khi nào), Why (Tại sao), How (Như thế nào).",
    step1GiaoNhiemVu: "GV giao chủ đề/tình huống và bảng câu hỏi 5W1H.",
    step2ThucHien: "HS làm việc cá nhân hoặc nhóm, lần lượt trả lời 6 câu hỏi 5W1H để làm rõ bản chất hiện tượng/khái niệm.",
    step3BaoCaoThaoLuan: "HS báo cáo kết quả tổng hợp theo 6 khía cạnh của 5W1H.",
    step4KetLuanNhanDinh: "GV chuẩn hóa bức tranh tổng thể của vấn đề dựa trên bộ câu hỏi 5W1H."
  },
  "10. Kỹ thuật Trình bày một phút": {
    name: "10. Kỹ thuật Trình bày một phút",
    category: "technique",
    corePrinciples: "Tạo cơ hội cho HS đúc kết kiến thức trong 1 phút cuối tiết học: Điều quan trọng nhất em học được hôm nay là gì? Vấn đề gì em còn băn khoăn?",
    step1GiaoNhiemVu: "Cuối tiết học, GV nêu câu hỏi đúc kết và yêu cầu HS viết nhanh ra giấy trong 1 phút.",
    step2ThucHien: "HS tập trung suy nghĩ và ghi ngắn gọn 1-2 câu trả lời vào phiếu.",
    step3BaoCaoThaoLuan: "Gọi 2-3 HS trình bày trong đúng 60 giây trước lớp.",
    step4KetLuanNhanDinh: "GV giải đáp nhanh thắc mắc trọng tâm và đánh giá mức độ tiếp thu bài của lớp."
  },
  "11. Kỹ thuật Phân tích phim Video": {
    name: "11. Kỹ thuật Phân tích phim Video",
    category: "technique",
    corePrinciples: "Sử dụng đoạn video ngắn (3-5 phút) có câu hỏi định hướng trước khi xem, yêu cầu HS quan sát có mục đích và phân tích dữ liệu sau khi xem.",
    step1GiaoNhiemVu: "GV nêu câu hỏi định hướng quan sát trước khi bật video/mô phỏng.",
    step2ThucHien: "HS xem video/mô phỏng, chú ý quan sát các chi tiết trọng tâm và ghi chép nhanh thông tin.",
    step3BaoCaoThaoLuan: "HS thảo luận cặp đôi trả lời các câu hỏi đã giao và báo cáo trước lớp.",
    step4KetLuanNhanDinh: "GV chốt hiện tượng khoa học và phân tích bản chất qua video."
  },
  "12. Kỹ thuật Đóng vai": {
    name: "12. Kỹ thuật Đóng vai",
    category: "technique",
    corePrinciples: "Học sinh nhập vai thực hành, làm thử cách ứng xử trong một tình huống giả định thực tế; trọng tâm là phần thảo luận, rút ra bài học sau khi diễn.",
    step1GiaoNhiemVu: "GV giao tình huống thực tế, phân vai và quy định thời gian chuẩn bị (3-4 phút).",
    step2ThucHien: "Các nhóm thảo luận kịch bản và phân vai diễn thử trong nhóm.",
    step3BaoCaoThaoLuan: "Nhóm lên đóng vai thể hiện tình huống; cả lớp nhận xét về cách ứng xử và cảm xúc của các vai diễn.",
    step4KetLuanNhanDinh: "GV kết luận, định hướng cách ứng xử tích cực và bài học rút ra."
  },
  "13. Kỹ thuật Trò chơi": {
    name: "13. Kỹ thuật Trò chơi",
    category: "technique",
    corePrinciples: "Tìm hiểu kiến thức thông qua trò chơi có luật chơi rõ ràng, tạo động lực thi đua lành mạnh và củng cố khắc sâu bài học.",
    step1GiaoNhiemVu: "GV phổ biến tên trò chơi, luật chơi và quy tắc chấm điểm.",
    step2ThucHien: "HS tiến hành chơi hào hứng, trả lời các câu hỏi / vượt chướng ngại vật.",
    step3BaoCaoThaoLuan: "Đánh giá kết quả sau trò chơi, phân tích tại sao đáp án đúng.",
    step4KetLuanNhanDinh: "GV thảo luận về ý nghĩa giáo dục và chốt kiến thức trọng tâm."
  },
  "14. Kỹ thuật Dự án": {
    name: "14. Kỹ thuật Dự án",
    category: "technique",
    corePrinciples: "Thực hiện nhiệm vụ học tập phức hợp theo nhóm qua 3 bước: Lập kế hoạch ➔ Thực hiện dự án ➔ Tổng hợp và trình bày sản phẩm.",
    step1GiaoNhiemVu: "GV nêu chủ đề dự án và hướng dẫn lập kế hoạch nhiệm vụ.",
    step2ThucHien: "HS thu thập thông tin, điều tra, thực nghiệm và xây dựng sản phẩm.",
    step3BaoCaoThaoLuan: "Các nhóm trình bày sản phẩm dự án và phản ánh quá trình học tập.",
    step4KetLuanNhanDinh: "GV đánh giá sản phẩm và đúc kết kiến thức tổng hợp."
  },
  "15. Kỹ thuật Giao nhiệm vụ": {
    name: "15. Kỹ thuật Giao nhiệm vụ",
    category: "technique",
    corePrinciples: "Giao nhiệm vụ cụ thể, rõ ràng: Giao cho ai? Làm cái gì? Ở đâu? Thời gian bao lâu? Phương tiện gì? Sản phẩm là gì? Cách đánh giá ra sao?",
    step1GiaoNhiemVu: "GV nêu rõ ràng 6 yếu tố của nhiệm vụ (Đối tượng, Nội dung, Địa điểm, Thời gian, Phương tiện, Sản phẩm yêu cầu).",
    step2ThucHien: "HS tiếp nhận nhiệm vụ, xác định rõ yêu cầu sản phẩm và bắt tay vào thực hiện đúng thời hạn.",
    step3BaoCaoThaoLuan: "HS nộp và trình bày sản phẩm theo đúng tiêu chí đã giao.",
    step4KetLuanNhanDinh: "GV đối chiếu sản phẩm với yêu cầu giao việc ban đầu để đánh giá chính xác."
  },
  "16. Kỹ thuật Đặt câu hỏi": {
    name: "16. Kỹ thuật Đặt câu hỏi",
    category: "technique",
    corePrinciples: "Hệ thống câu hỏi ngắn gọn, rõ ràng, phân bậc từ dễ đến khó (Nhận biết ➔ Thông hiểu ➔ Vận dụng), đúng lúc, kích thích suy nghĩ sâu sắc.",
    step1GiaoNhiemVu: "GV đưa ra câu hỏi gợi mở định hướng mục tiêu bài học.",
    step2ThucHien: "HS suy nghĩ độc lập, phân tích câu hỏi và chuẩn bị câu trả lời có lập luận.",
    step3BaoCaoThaoLuan: "HS trả lời câu hỏi và có thể đặt câu hỏi ngược lại cho GV và bạn cùng lớp.",
    step4KetLuanNhanDinh: "GV nhận xét câu trả lời và mở rộng câu hỏi phát triển tư duy."
  },
  "17. Kỹ thuật Giải quyết vấn đề": {
    name: "17. Kỹ thuật Giải quyết vấn đề",
    category: "technique",
    corePrinciples: "Tiến trình khoa học: Nhận dạng vấn đề ➔ Thu thập thông tin ➔ Liệt kê cách giải quyết ➔ Phân tích đánh giá ➔ Chọn cách tối ưu ➔ Thực hiện và rút kinh nghiệm.",
    step1GiaoNhiemVu: "GV đưa ra tình huống chứa đựng mâu thuẫn nhận thức.",
    step2ThucHien: "HS nhận dạng vấn đề, liệt kê các cách giải quyết và chọn phương án tối ưu.",
    step3BaoCaoThaoLuan: "HS trình bày lời giải và cách lập luận chọn giải pháp.",
    step4KetLuanNhanDinh: "GV kiểm tra tính đúng đắn và rút kinh nghiệm cho các tình huống tương tự."
  },
  "18. Kỹ thuật Phòng tranh": {
    name: "18. Kỹ thuật Phòng tranh",
    category: "technique",
    corePrinciples: "Các nhóm phác họa ý tưởng lên giấy/bìa dán quanh lớp học như triển lãm tranh; cả lớp đi xem triển lãm và dán giấy nhận xét bình luận bổ sung.",
    step1GiaoNhiemVu: "GV giao nhiệm vụ vẽ/trình bày giải pháp lên tờ bìa lớn, phát giấy sticker nhận xét.",
    step2ThucHien: "Các nhóm hoàn thành sản phẩm và dán lên tường lớp học; HS di chuyển xem triển lãm và dán ý kiến nhận xét.",
    step3BaoCaoThaoLuan: "Các nhóm đọc phản hồi của bạn bè, giải trình các thắc mắc trước lớp.",
    step4KetLuanNhanDinh: "GV tổng hợp các phương án tối ưu và tuyên dương các sản phẩm sáng tạo."
  },
  "19. Kỹ thuật Công đoạn": {
    name: "19. Kỹ thuật Công đoạn",
    category: "technique",
    corePrinciples: "Mỗi nhóm giải quyết 1 nhiệm vụ trên giấy A0, sau đó luân chuyển giấy A0 theo vòng tròn cho nhóm khác đọc, góp ý bổ sung cho đến khi nhận lại tờ giấy của mình.",
    step1GiaoNhiemVu: "GV chia nhóm (Nhóm 1 làm câu A, Nhóm 2 làm câu B, Nhóm 3 làm câu C...), phát giấy A0.",
    step2ThucHien: "Nhóm 1 thảo luận ghi kết quả, sau đó chuyển giấy cho Nhóm 2 góp ý, Nhóm 2 chuyển cho Nhóm 3... Cứ thế luân chuyển qua tất cả các nhóm.",
    step3BaoCaoThaoLuan: "Nhóm nhận lại bài của mình cùng ý kiến đóng góp của các nhóm bạn, xử lý và treo kết quả hoàn thiện lên tường.",
    step4KetLuanNhanDinh: "GV nhận xét sự tương tác đóng góp của các nhóm và chuẩn hóa đáp án."
  },
  "20. Kỹ thuật Hỏi Chuyên gia": {
    name: "20. Kỹ thuật Hỏi Chuyên gia",
    category: "technique",
    corePrinciples: "Một nhóm học sinh đóng vai chuyên gia về một chủ đề ngồi phía trên lớp học điều khiển buổi tư vấn, giải đáp thắc mắc cho các bạn học sinh trong lớp.",
    step1GiaoNhiemVu: "GV phân công nhóm chuyên gia nghiên cứu sâu một chủ đề tài liệu.",
    step2ThucHien: "Nhóm chuyên gia ngồi bàn chủ tọa; các học sinh trong lớp nghiên cứu câu hỏi muốn chất vấn.",
    step3BaoCaoThaoLuan: "Các bạn học sinh đặt câu hỏi và nhóm chuyên gia lần lượt giải đáp, tranh luận.",
    step4KetLuanNhanDinh: "GV đánh giá độ sâu hiểu biết của nhóm chuyên gia và làm sáng tỏ thêm các vấn đề học sinh quan tâm."
  },
  "21. Kỹ thuật KWL (KWLH)": {
    name: "21. Kỹ thuật KWL (KWLH)",
    category: "technique",
    corePrinciples: "K (Know - Đã biết), W (Want to know - Muốn biết), L (Learned - Đã học được), H (How - Tìm hiểu thêm thế nào). Giúp HS chủ động định hướng và tự đánh giá nhận thức.",
    step1GiaoNhiemVu: "GV phát bảng KWL, yêu cầu HS điền cột K (đã biết) và cột W (muốn biết) trong 2 phút đầu.",
    step2ThucHien: "Trong quá trình học và đọc tài liệu, HS tự tìm câu trả lời cho cột W và ghi kiến thức mới vào cột L.",
    step3BaoCaoThaoLuan: "HS đối chiếu cột W và L, chia sẻ những điều mới mẻ học được với bạn bên cạnh.",
    step4KetLuanNhanDinh: "GV nhận xét sự tiến bộ nhận thức của HS và định hướng cột H (tự nghiên cứu ở nhà)."
  },
  "22. Kỹ thuật Ổ bi": {
    name: "22. Kỹ thuật Ổ bi",
    category: "technique",
    corePrinciples: "HS chia 2 nhóm ngồi thành 2 vòng tròn đồng tâm đối diện nhau (như vòng ổ bi). Vòng trong trao đổi với vòng ngoài, sau đó quay dịch chuyển để luôn tạo cặp đối tác mới.",
    step1GiaoNhiemVu: "GV xếp bàn ghế 2 vòng tròn đồng tâm và giao chủ đề luyện tập đối tác.",
    step2ThucHien: "HS vòng trong trao đổi 1 phút với bạn đối diện ở vòng ngoài; nghe hiệu lệnh thì vòng trong dịch chuyển theo chiều kim đồng hồ để gặp bạn mới và tiếp tục trao đổi.",
    step3BaoCaoThaoLuan: "HS chia sẻ những điều ấn tượng nhất khi được trao đổi với nhiều bạn khác nhau.",
    step4KetLuanNhanDinh: "GV tổng kết kiến thức rèn luyện và kỹ năng giao tiếp phản xạ của học sinh."
  },
  "23. Kỹ thuật Tranh luận ủng hộ – Phản đối": {
    name: "23. Kỹ thuật Tranh luận ủng hộ – Phản đối",
    category: "technique",
    corePrinciples: "Chia 2 phe: Phe Ủng hộ và Phe Phản đối cùng tranh luận về một vấn đề đa chiều để xem xét đa góc độ; mục tiêu không phải đánh bại đối lập mà là hiểu thấu đáo vấn đề.",
    step1GiaoNhiemVu: "GV nêu luận điểm tranh luận và chia lớp thành 2 phe (Ủng hộ / Phản đối).",
    step2ThucHien: "Mỗi phe thu thập lập luận, bằng chứng chứng minh quan điểm của mình.",
    step3BaoCaoThaoLuan: "Hai phe luân phiên đưa ra luận điểm và phản bác ý kiến đối phương một cách văn minh, logic.",
    step4KetLuanNhanDinh: "GV nhận xét kỹ năng tư duy phản biện, tổng hợp các góc nhìn và đưa ra kết luận trung lập, khách quan."
  },
  "24. Kỹ thuật Thông tin phản hồi trong dạy học": {
    name: "24. Kỹ thuật Thông tin phản hồi trong dạy học",
    category: "technique",
    corePrinciples: "GV và HS cùng nhận xét, đánh giá tích cực, có kiểm soát, cụ thể, không nhận xét về giá trị cá nhân mà hướng vào hành động cải tiến.",
    step1GiaoNhiemVu: "GV hướng dẫn các quy tắc đưa phản hồi tích cực (cụ thể, đúng lúc, mang tính xây dựng).",
    step2ThucHien: "HS đưa ra phản hồi đối với bài làm của bạn theo cấu trúc gợi ý.",
    step3BaoCaoThaoLuan: "Trao đổi cởi mở giữa người nhận và người đưa phản hồi.",
    step4KetLuanNhanDinh: "GV chốt các điểm cần khắc phục và định hướng phương án cải tiến."
  },
  "25. Kỹ thuật 3 lần 3": {
    name: "25. Kỹ thuật 3 lần 3",
    category: "technique",
    corePrinciples: "Lấy ý kiến phản hồi nhanh và toàn diện: Mỗi HS viết ra 3 điều tốt – 3 điều chưa tốt – 3 đề nghị cải tiến.",
    step1GiaoNhiemVu: "GV phát phiếu '3 lần 3' sau một hoạt động thảo luận/thực hành.",
    step2ThucHien: "HS viết ra: 3 điều làm tốt; 3 điều chưa hài lòng; 3 kiến nghị cải tiến cụ thể.",
    step3BaoCaoThaoLuan: "Tổng hợp nhanh các ý kiến phản hồi tiêu biểu của lớp.",
    step4KetLuanNhanDinh: "GV tiếp thu các đề xuất cải tiến và giải thích cách hoàn thiện ở hoạt động sau."
  },
  "26. Kỹ thuật Chia nhóm đa dạng": {
    name: "26. Kỹ thuật Chia nhóm đa dạng",
    category: "technique",
    corePrinciples: "Sử dụng các hình thức chia nhóm linh hoạt gây hứng thú: Điểm danh số, Màu sắc, Loài hoa, Mùa trong năm, Ghép hình, Sở thích, Tháng sinh...",
    step1GiaoNhiemVu: "GV áp dụng cách chia nhóm bất ngờ (như bốc thăm mảnh ghép hình để tìm đồng đội).",
    step2ThucHien: "HS tìm các bạn có cùng tiêu chí (màu sắc/mảnh ghép hoàn chỉnh) để nhanh chóng lập nhóm.",
    step3BaoCaoThaoLuan: "Nhóm mới bầu nhóm trưởng, thư ký và sẵn sàng nhận nhiệm vụ.",
    step4KetLuanNhanDinh: "GV khen ngợi tốc độ ổn định nhóm của lớp và bắt đầu hoạt động học tập."
  },
  "27. Kỹ thuật Chúng em biết 3": {
    name: "27. Kỹ thuật Chúng em biết 3",
    category: "technique",
    corePrinciples: "Chia nhóm 3 người, thảo luận trong 5-10 phút về chủ đề và chọn ra 3 điểm quan trọng nhất để trình bày trước lớp.",
    step1GiaoNhiemVu: "GV nêu chủ đề, chia nhóm 3 HS và yêu cầu tìm ra 3 điểm cốt lõi nhất.",
    step2ThucHien: "Nhóm 3 người thảo luận sôi nổi, chắt lọc và ghi lại đúng 3 điểm mấu chốt.",
    step3BaoCaoThaoLuan: "Đại diện nhóm trình bày 3 điểm quan trọng đã chọn.",
    step4KetLuanNhanDinh: "GV tổng hợp các điểm cốt lõi từ các nhóm và đúc kết kiến thức chuẩn."
  },
  "28. Kỹ thuật Viết tích cực": {
    name: "28. Kỹ thuật Viết tích cực",
    category: "technique",
    corePrinciples: "Dành thời gian ngắn cho HS tự do viết câu trả lời hoặc tóm tắt những gì đã hiểu sau một phần bài học để củng cố và phản hồi việc nắm kiến thức.",
    step1GiaoNhiemVu: "GV đặt câu hỏi và dành 2-3 phút cho HS viết tự do vào vở.",
    step2ThucHien: "HS tập trung viết mạch lạc những suy nghĩ và cách hiểu của mình.",
    step3BaoCaoThaoLuan: "GV gọi một vài HS chia sẻ nội dung đã viết trước lớp.",
    step4KetLuanNhanDinh: "GV nhận xét, chỉ ra những chỗ các em hiểu đúng và điều chỉnh những chỗ còn nhầm lẫn."
  },
  "29. Kỹ thuật Đọc tích cực / Đọc hợp tác": {
    name: "29. Kỹ thuật Đọc tích cực / Đọc hợp tác",
    category: "technique",
    corePrinciples: "Tăng cường tự học qua 4 bước đọc: Đoán trước khi đọc ➔ Đọc và đoán nội dung ➔ Tìm ý chính ➔ Tóm tắt ý chính và chia sẻ nhóm đôi.",
    step1GiaoNhiemVu: "GV nêu câu hỏi định hướng, yêu cầu đọc lướt tìm tựa đề/từ khóa.",
    step2ThucHien: "HS đọc cá nhân, gạch chân ý chính, liên hệ kiến thức cũ, sau đó chia sẻ cặp đôi để thống nhất ý chính.",
    step3BaoCaoThaoLuan: "HS nêu các câu hỏi thắc mắc trong bài đọc để GV và cả lớp cùng giải đáp.",
    step4KetLuanNhanDinh: "GV tổng kết nội dung bài đọc và hướng dẫn cách tự đọc tài liệu hiệu quả."
  },
  "30. Kỹ thuật Hỏi và trả lời (Vấn đáp vòng tròn)": {
    name: "30. Kỹ thuật Hỏi và trả lời (Vấn đáp vòng tròn)",
    category: "technique",
    corePrinciples: "GV hoặc 1 HS đặt câu hỏi, gọi 1 bạn trả lời. Bạn vừa trả lời xong lập tức đặt tiếp câu hỏi khác và chỉ định bạn tiếp theo trả lời liên hoàn.",
    step1GiaoNhiemVu: "GV khởi xướng câu hỏi đầu tiên về chủ đề bài học.",
    step2ThucHien: "HS được gọi trả lời câu hỏi, sau đó suy nghĩ đặt câu hỏi tiếp theo cho bạn khác.",
    step3BaoCaoThaoLuan: "Tiến trình hỏi - đáp liên hoàn diễn ra liên tục, tạo phản xạ nhanh.",
    step4KetLuanNhanDinh: "GV điều phối dừng hoạt động đúng lúc, tổng kết các câu hỏi hay và câu trả lời chính xác."
  },
  "31. Kỹ thuật Nói cách khác": {
    name: "31. Kỹ thuật Nói cách khác",
    category: "technique",
    corePrinciples: "Liệt kê các cách nói tiêu cực hoặc chưa hay trong cuộc sống, sau đó tìm 10 cách diễn đạt tích cực, mang tính khích lệ hơn để thay đổi tư duy ngôn ngữ.",
    step1GiaoNhiemVu: "GV yêu cầu các nhóm liệt kê các câu nói chưa tích cực về một việc.",
    step2ThucHien: "Các nhóm thảo luận tìm cách chuyển đổi thành các cách nói tích cực, tôn trọng.",
    step3BaoCaoThaoLuan: "Trình bày bảng so sánh cách nói cũ và cách nói mới trước lớp.",
    step4KetLuanNhanDinh: "GV giáo dục kỹ năng giao tiếp văn minh, thái độ sống tích cực."
  },
  "32. Kỹ thuật Tóm tắt nội dung tài liệu theo nhóm": {
    name: "32. Kỹ thuật Tóm tắt nội dung tài liệu theo nhóm",
    category: "technique",
    corePrinciples: "Nhóm nhỏ cùng đọc tài liệu, thảo luận ý nghĩa, chuẩn bị câu trả lời và cử đại diện báo cáo; các thành viên trong nhóm lần lượt trả lời chất vấn của lớp.",
    step1GiaoNhiemVu: "GV phát tài liệu và câu hỏi hướng dẫn tóm tắt cho các nhóm.",
    step2ThucHien: "HS đọc to tài liệu trong nhóm, thảo luận ý nghĩa và chuẩn bị trả lời các câu hỏi.",
    step3BaoCaoThaoLuan: "Đại diện nhóm trình bày ý chính; các thành viên trong nhóm lần lượt giải đáp thắc mắc của các bạn trong lớp.",
    step4KetLuanNhanDinh: "GV chuẩn hóa kiến thức tài liệu và đánh giá kỹ năng làm việc nhóm."
  }
};

/**
 * Xây dựng đoạn Prompt sư phạm chi tiết để đưa vào AI sinh giáo án CV 5512
 */
export function buildPedagogicalMethodInstruction(
  selectedPP: string,
  selectedKT: string,
  customPedagogyText?: string
): string {
  const ppGuide = PEDAGOGICAL_METHODS_DICTIONARY[selectedPP] || {
    name: selectedPP,
    category: 'method',
    corePrinciples: `Áp dụng chuẩn hóa phương pháp ${selectedPP}, lấy học sinh làm chủ thể hoạt động khám phá.`,
    step1GiaoNhiemVu: `GV giao nhiệm vụ cụ thể, rõ ràng theo đúng tinh thần phương pháp ${selectedPP}.`,
    step2ThucHien: `HS tích cực hoạt động cá nhân và hợp tác nhóm theo phương pháp ${selectedPP}.`,
    step3BaoCaoThaoLuan: `HS báo cáo sản phẩm, tương tác phản biện sôi nổi.`,
    step4KetLuanNhanDinh: `GV nhận xét, chuẩn hóa kiến thức và kết luận sư phạm.`
  };

  const ktGuide = PEDAGOGICAL_METHODS_DICTIONARY[selectedKT] || {
    name: selectedKT,
    category: 'technique',
    corePrinciples: `Áp dụng chuẩn hóa kỹ thuật ${selectedKT} trong tổ chức hoạt động học.`,
    step1GiaoNhiemVu: `GV hướng dẫn quy trình thực hiện kỹ thuật ${selectedKT}.`,
    step2ThucHien: `HS thực hiện đúng các bước của kỹ thuật ${selectedKT}.`,
    step3BaoCaoThaoLuan: `HS trình bày sản phẩm đặc thù của kỹ thuật ${selectedKT}.`,
    step4KetLuanNhanDinh: `GV chốt kiến thức và đánh giá sản phẩm kỹ thuật.`
  };

  let customSection = '';
  if (customPedagogyText && customPedagogyText.trim()) {
    customSection = `
3. TÀI LIỆU HƯỚNG DẪN / QUY TRÌNH PPDH & KTDH DO GIÁO VIÊN TẢI LÊN (BẮT BUỘC ƯU TIÊN TÍCH HỢP):
"""
${customPedagogyText.trim()}
"""
-> YÊU CẦU AI: Căn cứ chính xác vào tài liệu PPDH/KTDH giáo viên vừa tải lên ở trên để cụ thể hóa các hoạt động, câu lệnh của GV và nhiệm vụ của HS trong giáo án.
`;
  }

  return `
=== QUY CHUẨN TÍCH HỢP BẮT BUỘC VỀ PHƯƠNG PHÁP & KỸ THUẬT DẠY HỌC ĐÃ CHỌN (CHỐNG SOẠN RẬP KHUÔN, SƠ SÀI) ===
Giáo viên đã chỉ định cụ thể:
1. PHƯƠNG PHÁP DẠY HỌC CHỦ ĐẠO: "${selectedPP}"
   - Bản chất & Nguyên tắc sư phạm: ${ppGuide.corePrinciples}
   - BẮT BUỘC CỤ THỂ HÓA VÀO CỘT 1 (Hoạt động của GV & HS) VÀ CỘT 2 (Dự kiến sản phẩm) trong Hoạt động Khởi động & Hình thành kiến thức mới:
     + Bước 1 (Giao nhiệm vụ): ${ppGuide.step1GiaoNhiemVu}
     + Bước 2 (Thực hiện nhiệm vụ): ${ppGuide.step2ThucHien}
     + Bước 3 (Báo cáo, thảo luận): ${ppGuide.step3BaoCaoThaoLuan}
     + Bước 4 (Kết luận, nhận định): ${ppGuide.step4KetLuanNhanDinh}

2. KỸ THUẬT DẠY HỌC CHỦ ĐẠO: "${selectedKT}"
   - Bản chất & Quy trình thực hiện: ${ktGuide.corePrinciples}
   - BẮT BUỘC BIẾN ĐỔI KỊCH BẢN CỘT TRÁI VÀ CỘT PHẢI THEO ĐÚNG ĐẶC THÙ CỦA "${selectedKT}":
     + Nếu chọn "Kỹ thuật Khăn trải bàn": Bắt buộc chia 2 giai đoạn: (1) Cá nhân viết độc lập vào góc riêng trên giấy A0 (2-3 phút, không trao đổi); (2) Nhóm thảo luận thống nhất và ghi ý kiến chung vào ô trung tâm. Cột Sản phẩm trình bày rõ ý kiến đồng thuận ở ô trung tâm.
     + Nếu chọn "Kỹ thuật Các mảnh ghép (Jigsaw)": Bắt buộc chia 2 vòng: Vòng 1 (Nhóm chuyên sâu) nghiên cứu 1 phần bài học/ví dụ; Vòng 2 (Nhóm mảnh ghép) tập hợp thành viên từ các nhóm chuyên gia để giảng lại cho nhau nghe và hoàn thành nhiệm vụ tổng hợp.
     + Nếu chọn "Kỹ thuật Phòng tranh (Gallery Walk)": Bắt buộc có khâu trưng bày sản phẩm trên bảng nhóm xung quanh lớp, HS di chuyển tham quan và dùng giấy note dán phản biện/chấm điểm.
     + Nếu chọn "Kỹ thuật Trò chơi / Quiz": Bắt buộc nêu rõ tên trò chơi, luật chơi, cách tính điểm và phân tích đáp án đúng/sai.
     + Nếu chọn "Kỹ thuật Chia sẻ nhóm đôi (Think-Pair-Share)": Bắt buộc có đủ 3 nhịp: Tự suy nghĩ cá nhân -> Trao đổi cặp đôi -> Chia sẻ trước lớp.
     + Nếu chọn "Kỹ thuật KWL / KWLH": Bắt buộc chia rõ 3 giai đoạn: K (Đã biết ở Khởi động) - W (Muốn biết trước khi học) - L (Đã học được ở Luyện tập & Vận dụng).

3. NGUYÊN TẮC TƯƠNG THÍCH VÀ KHAI THÁC SGK CỦA PHƯƠNG PHÁP & KĨ THUẬT:
   - Dùng Phương pháp và Kĩ thuật dạy học đã chọn để giải quyết TRƯỚC HẾT 100% CÁC CÂU HỎI KHÁM PHÁ, VÍ DỤ MẪU (Ví dụ 1, Ví dụ 2...), BÀI TẬP LUYỆN TẬP TRONG SGK, sau đó mới mở rộng thêm bài toán thực tế.
   - Tuyệt đối KHÔNG viết chung chung; phải có lời thoại dẫn dắt của GV, phân công cụ thể vai trò Nhóm trưởng, Thư ký, Báo cáo viên và phân tích chi tiết từng bước làm của HS.
${customSection}
==================================================================================================
`;
}
