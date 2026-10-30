/**
 * KHUNG NỘI DUNG GIÁO DỤC TRÍ TUỆ NHÂN TẠO CHO HỌC SINH PHỔ THÔNG
 * Ban hành kèm theo Quyết định số 2422/QĐ-BGDĐT ngày 18 tháng 8 năm 2026 của Bộ trưởng Bộ Giáo dục và Đào tạo
 * 
 * 4 Mạch nội dung chính:
 * - A: Tư duy lấy con người làm trung tâm (A1, A2, A3)
 * - B: Đạo đức AI (B1, B2, B3)
 * - C: Các kĩ thuật và ứng dụng AI (C1, C2, C3, C4, C5)
 * - D: Thiết kế hệ thống AI (D1, D2)
 * 
 * Mã hoá Yêu cầu cần đạt: [Lớp].[Mã chủ đề].[Số thứ tự] (Ví dụ: 6.A1.1, 10.C3.1, 11.C3.MR3)
 */

export interface AiFrameworkRequirement {
  code: string; // e.g. "6.A1.1", "10.C3.MR1"
  grade: number; // 1 to 12
  strandCode: 'A' | 'B' | 'C' | 'D';
  strandName: string;
  topicCode: string; // "A1", "A2", "B1", "C1", "C2", "C3", "C4", "C5", "D1", "D2"
  topicName: string;
  subContent: string;
  requirementText: string;
  isExtended?: boolean; // MR (Mở rộng)
}

export const AI_EDUCATION_STRANDS = [
  { code: 'A', name: 'A. Tư duy lấy con người làm trung tâm' },
  { code: 'B', name: 'B. Đạo đức AI' },
  { code: 'C', name: 'C. Các kĩ thuật và ứng dụng AI' },
  { code: 'D', name: 'D. Thiết kế hệ thống AI' }
];

export const AI_FRAMEWORK_REQUIREMENTS: AiFrameworkRequirement[] = [
  // ========================== LỚP 1 ==========================
  {
    code: '1.A1.1',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Con người có cảm xúc, AI thì không',
    requirementText: 'Nêu được ví dụ về một số cảm xúc quen thuộc của con người (vui, buồn, giận dữ, sợ hãi, ngạc nhiên,…) qua các tình huống gần gũi trong cuộc sống và bước đầu nhận ra rằng con người có cảm xúc còn AI thì không.'
  },
  {
    code: '1.A1.2',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Con người có cảm xúc, AI thì không',
    requirementText: 'Nêu được rằng AI có thể mô phỏng hoặc nhận diện cảm xúc của con người, chứ không trải nghiệm cảm xúc như con người.'
  },
  {
    code: '1.A1.3',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'AI thể hiện cảm xúc do con người lập trình',
    requirementText: 'Nêu được rằng việc AI thể hiện cảm xúc (ví dụ: cười, buồn, ngạc nhiên, tức giận trên màn hình hoặc qua giọng nói) là do con người lập trình hoặc thiết kế trước.'
  },
  {
    code: '1.A1.4',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'AI thể hiện cảm xúc do con người lập trình',
    requirementText: 'Nêu được một số ví dụ minh họa (như robot cười khi người dùng kể chuyện vui, hoặc trợ lí ảo nói "Tôi rất vui được giúp bạn"), và giải thích được rằng những biểu hiện này chỉ là phản ứng được lập trình sẵn.'
  },
  {
    code: '1.A2.1',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A2',
    topicName: 'AI vì sự tiến bộ của con người',
    subContent: 'Ý nghĩa cảm xúc mà AI thể hiện',
    requirementText: 'Nêu được các cách mà AI thể hiện cảm xúc qua hình ảnh, giọng nói hoặc hành vi (ví dụ: biểu tượng khuôn mặt vui, giọng nói thân thiện, hoặc lời chào dễ thương).'
  },
  {
    code: '1.A2.MR1',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A2',
    topicName: 'AI vì sự tiến bộ của con người',
    subContent: 'Ý nghĩa cảm xúc mà AI thể hiện',
    requirementText: 'Nêu được rằng những biểu hiện này giúp AI giao tiếp tự nhiên hơn với con người, khiến người dùng cảm thấy thoải mái, gần gũi và dễ hợp tác hơn.',
    isExtended: true
  },
  {
    code: '1.A2.2',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A2',
    topicName: 'AI vì sự tiến bộ của con người',
    subContent: 'Nhận diện AI trong cuộc sống',
    requirementText: 'Nhận biết và kể tên được một số sản phẩm hoặc thiết bị có sử dụng trí tuệ nhân tạo (ví dụ: loa thông minh, điện thoại có trợ lí ảo, robot hút bụi, xe tự lái, camera nhận diện khuôn mặt, ứng dụng dịch ngôn ngữ…).'
  },
  {
    code: '1.A2.3',
    grade: 1,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A2',
    topicName: 'AI vì sự tiến bộ của con người',
    subContent: 'Nhận diện AI trong cuộc sống',
    requirementText: 'Mô tả được công dụng chính của từng sản phẩm và cách AI giúp sản phẩm hoạt động thông minh hơn (ví dụ: loa thông minh hiểu lệnh bằng giọng nói; robot hút bụi tự tìm đường và tránh chướng ngại vật).'
  },
  {
    code: '1.B1.1',
    grade: 1,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B1',
    topicName: 'Các khía cạnh đạo đức của AI',
    subContent: 'Việc làm tốt và việc làm xấu',
    requirementText: 'Nêu được một số hành vi sử dụng AI có thể gây hại cho người khác.'
  },
  {
    code: '1.B3.1',
    grade: 1,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B3',
    topicName: 'Nguyên tắc đạo đức và trách nhiệm xã hội',
    subContent: 'Máy thông minh làm việc tốt',
    requirementText: 'Nhận biết được rằng không được phép sử dụng AI với mục đích làm hại người khác.'
  },
  {
    code: '1.B3.2',
    grade: 1,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B3',
    topicName: 'Nguyên tắc đạo đức và trách nhiệm xã hội',
    subContent: 'Máy thông minh làm việc tốt',
    requirementText: 'Nêu được ví dụ về việc con người sử dụng AI đúng cách, vì mục đích tốt đẹp.'
  },
  {
    code: '1.C1.1',
    grade: 1,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Nhận biết AI và ứng dụng AI',
    requirementText: 'Nhận biết được AI trong một số ví dụ cụ thể và đơn giản về AI.'
  },
  {
    code: '1.C1.2',
    grade: 1,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Nhận biết AI và ứng dụng AI',
    requirementText: 'Nhận diện được một số công cụ AI quen thuộc và phổ biến trên điện thoại hoặc máy tính bảng (ví dụ: trợ lí ảo, nhận diện khuôn mặt, …).'
  },
  {
    code: '1.C1.3',
    grade: 1,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Chức năng và công cụ AI',
    requirementText: 'Nhận biết được các thiết bị thông minh có các bộ phận giống với bộ phận của con người (ví dụ: camera là "mắt" và micro là "tai" của các thiết bị đó).'
  },
  {
    code: '1.C1.4',
    grade: 1,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Chức năng và công cụ AI',
    requirementText: 'Nhận biết được AI có khả năng hiểu các mệnh lệnh đơn giản của con người, trò chuyện theo kịch bản định sẵn.'
  },
  {
    code: '1.D1.1',
    grade: 1,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D1',
    topicName: 'Nhận diện và hình thành giải pháp',
    subContent: 'Máy thông minh học từ ví dụ',
    requirementText: 'Nêu được ví dụ về một tình huống mà AI "học" từ hình ảnh hoặc thông tin do con người cung cấp (ví dụ: AI học nhận biết con mèo, quả táo…).'
  },
  {
    code: '1.D2.1',
    grade: 1,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D2',
    topicName: 'Cấu trúc và tương tác, cải tiến hệ thống',
    subContent: 'Nhiều loại máy thông minh',
    requirementText: 'Nhận biết được rằng có loại máy thông minh chỉ làm được một việc (như nhận biết hình ảnh), có loại có thể làm nhiều việc khác nhau (như lắng nghe - trả lời, thực hiện theo lệnh…).'
  },

  // ========================== LỚP 6 ==========================
  {
    code: '6.A1.1',
    grade: 6,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Con người tạo và điều khiển AI',
    requirementText: 'Giải thích được AI là sản phẩm do con người tạo ra, lập trình và điều khiển để thực hiện những nhiệm vụ cụ thể; AI không tự sinh ra và không hoạt động độc lập với con người. Nêu được ví dụ về một số công cụ AI quen thuộc trong đời sống hằng ngày và chỉ ra được vai trò của con người trong việc tạo ra chúng.'
  },
  {
    code: '6.A1.2',
    grade: 6,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'AI hoạt động theo lập trình',
    requirementText: 'Trình bày được vai trò của AI chỉ là công cụ hỗ trợ hoạt động của con người; con người đưa ra quyết định cuối cùng và chịu trách nhiệm khi sử dụng AI.'
  },
  {
    code: '6.A1.3',
    grade: 6,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'AI hoạt động theo lập trình',
    requirementText: 'Thực hiện được việc kiểm tra lại một kết quả do AI đưa ra (đối chiếu với sách giáo khoa, nguồn tin cậy khác hoặc hỏi thầy cô) trước khi sử dụng, thể hiện thói quen "con người quyết định cuối cùng".'
  },
  {
    code: '6.A3.1',
    grade: 6,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A3',
    topicName: 'Công dân trong kỉ nguyên AI',
    subContent: 'Con người ra quyết định với AI',
    requirementText: 'Nêu được ví dụ về tình huống con người ra quyết định với sự hỗ trợ của AI (ví dụ: trong y tế, AI gợi ý chẩn đoán, bác sĩ xem xét và quyết định phương án điều trị; trong giao thông, AI đề xuất lộ trình nhanh hơn, người lái xe cân nhắc trước khi lựa chọn). Thực hành ra quyết định trong một tình huống giả định có gợi ý của AI.'
  },
  {
    code: '6.A3.3',
    grade: 6,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A3',
    topicName: 'Công dân trong kỉ nguyên AI',
    subContent: 'Quyền riêng tư và bảo vệ dữ liệu cá nhân',
    requirementText: 'Giải thích được dữ liệu cá nhân (hình ảnh, giọng nói, họ tên, địa chỉ, thông tin học tập, thói quen sử dụng mạng,...) là tài sản của mỗi người; chỉ chủ sở hữu mới có quyền quyết định việc chia sẻ hoặc cho phép sử dụng dữ liệu đó.'
  },
  {
    code: '6.B1.1',
    grade: 6,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B1',
    topicName: 'Các khía cạnh đạo đức của AI',
    subContent: 'Mặt tốt và mặt xấu',
    requirementText: 'Chỉ ra được mặt tích cực và hạn chế của một số tính năng AI cụ thể (ví dụ: tính năng thu thập dữ liệu người dùng giúp AI đưa ra gợi ý chính xác hơn nhưng có thể ảnh hưởng đến quyền riêng tư).'
  },
  {
    code: '6.B2.1',
    grade: 6,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B2',
    topicName: 'Sử dụng AI an toàn và có trách nhiệm',
    subContent: 'An toàn khi sử dụng AI',
    requirementText: 'Đặt được một số câu hỏi đơn giản để kiểm tra tính an toàn và minh bạch của ứng dụng AI ("Công cụ này có an toàn không?", "Công cụ này có thu thập thông tin cá nhân không?", "Có thể tắt tính năng này không?") và áp dụng để nhận xét.'
  },
  {
    code: '6.C1.1',
    grade: 6,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Thành phần cơ bản trong kiến trúc AI',
    requirementText: 'Giải thích được hai thành phần chính để huấn luyện ("dạy") AI là dữ liệu (văn bản, hình ảnh) và thuật toán (phương pháp học từ dữ liệu). Mô tả các bước hoạt động chính của công cụ AI.'
  },
  {
    code: '6.C2.1',
    grade: 6,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C2',
    topicName: 'Ứng dụng AI trong học tập và cuộc sống',
    subContent: 'Làm quen với ứng dụng AI',
    requirementText: 'Phân biệt được công cụ, tính năng có ứng dụng AI và không ứng dụng AI qua các ví dụ gần gũi trong cuộc sống (ví dụ: trợ lí ảo có ứng dụng AI; máy tính bỏ túi không ứng dụng AI).'
  },
  {
    code: '6.C3.1',
    grade: 6,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Một số công nghệ AI quen thuộc và đơn giản',
    requirementText: 'Kể được tên một số công nghệ AI quen thuộc trong đời sống (ví dụ: nhận dạng hình ảnh, chuyển đổi giữa văn bản và giọng nói,...).'
  },
  {
    code: '6.D1.1',
    grade: 6,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D1',
    topicName: 'Nhận diện và hình thành giải pháp',
    subContent: 'Lựa chọn sử dụng AI phù hợp',
    requirementText: 'Nêu được một số tình huống quen thuộc nên hoặc không nên sử dụng AI (ví dụ: nên dùng AI để luyện phát âm ngoại ngữ, tìm đường đi; không nên nhờ AI viết hộ bài văn, làm hộ bài tập vì làm giảm cơ hội tự rèn luyện).'
  },

  // ========================== LỚP 7 ==========================
  {
    code: '7.A1.1',
    grade: 7,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Quyền ra quyết định',
    requirementText: 'Giải thích được lí do con người cần giữ quyền ra quyết định khi sử dụng AI (bảo đảm công bằng, bảo đảm an toàn, bảo vệ quyền lợi con người, không để AI xâm phạm quyền riêng tư, tự do hoặc phẩm giá cá nhân).'
  },
  {
    code: '7.A1.2',
    grade: 7,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Xác thực kết quả',
    requirementText: 'Nêu được ví dụ hậu quả có thể xảy ra khi không có sự xác thực của con người về độ chính xác của kết quả do AI đưa ra trong một số trường hợp thực tế.'
  },
  {
    code: '7.B3.1',
    grade: 7,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B3',
    topicName: 'Nguyên tắc đạo đức và trách nhiệm xã hội',
    subContent: 'Trách nhiệm khi sử dụng AI',
    requirementText: 'Thể hiện được thái độ và cam kết cá nhân trong việc sử dụng AI có trách nhiệm; thể hiện được việc khai báo trung thực khi có sử dụng AI trong sản phẩm học tập.'
  },
  {
    code: '7.C4.1',
    grade: 7,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C4',
    topicName: 'Dữ liệu trong AI',
    subContent: 'Các khía cạnh đạo đức liên quan đến dữ liệu huấn luyện AI',
    requirementText: 'Trình bày được các vấn đề đạo đức có thể nảy sinh từ dữ liệu huấn luyện AI (ví dụ: dữ liệu thiếu đa dạng dẫn đến phân biệt đối xử, dữ liệu riêng tư bị xâm phạm).'
  },
  {
    code: '7.C5.1',
    grade: 7,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C5',
    topicName: 'Kĩ thuật và thuật toán AI',
    subContent: 'Tìm hiểu một số cách học của AI',
    requirementText: 'Mô tả được các bước chính trong quá trình huấn luyện AI qua một ví dụ cụ thể (thu thập và gán nhãn dữ liệu ảnh; cho máy học từ dữ liệu; kiểm tra trên ảnh mới; điều chỉnh kết quả).'
  },
  {
    code: '7.D1.1',
    grade: 7,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D1',
    topicName: 'Nhận diện và hình thành giải pháp',
    subContent: 'Ý tưởng dự án AI từ thực tiễn',
    requirementText: 'Nêu được ví dụ về một vấn đề trong trường học hoặc cộng đồng có thể được giải quyết hoặc cải thiện bằng AI; mô tả phạm vi của vấn đề đó.'
  },

  // ========================== LỚP 8 ==========================
  {
    code: '8.A1.1',
    grade: 8,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'AI không thay thế con người',
    requirementText: 'Nêu được một số lĩnh vực mà AI không nên thay thế con người (trong giáo dục: giáo viên hiểu tâm lí học sinh; trong y tế: bác sĩ lắng nghe bệnh nhân; trong nghệ thuật: nghệ sĩ thể hiện cảm xúc).'
  },
  {
    code: '8.A1.2',
    grade: 8,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Rủi ro khi lạm dụng AI',
    requirementText: 'Nêu được những rủi ro của việc lạm dụng các công cụ AI tạo sinh (GenAI), liên hệ với nguy cơ suy giảm tư duy phản biện, kĩ năng sáng tạo, sử dụng thông tin sai lệch.'
  },
  {
    code: '8.B1.1',
    grade: 8,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B1',
    topicName: 'Các khía cạnh đạo đức của AI',
    subContent: 'Rủi ro với AI',
    requirementText: 'Nhận diện và phân loại được một số rủi ro phổ biến khi sử dụng AI: rủi ro về dữ liệu & quyền riêng tư, rủi ro thuật toán thiên vị, rủi ro bị lừa đảo bằng nội dung giả mạo (deepfake).'
  },
  {
    code: '8.C1.1',
    grade: 8,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C1',
    topicName: 'Đặc điểm chính của AI',
    subContent: 'Cách AI thực hiện một số chức năng cơ bản',
    requirementText: 'Mô tả được ở mức đơn giản cách AI thực hiện một số chức năng cơ bản như "đọc", "nghe", "nhìn" (thu âm, chuyển giọng nói thành văn bản, phân tích đặc điểm hình ảnh).'
  },
  {
    code: '8.C5.1',
    grade: 8,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C5',
    topicName: 'Kĩ thuật và thuật toán AI',
    subContent: 'Cách AI nhận diện cảm xúc',
    requirementText: 'Nêu được cách AI nhận diện cảm xúc dựa vào các đặc điểm (nét mặt, từ khoá trong văn bản và lời nói, ngữ điệu giọng nói, cử chỉ).'
  },
  {
    code: '8.D2.1',
    grade: 8,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D2',
    topicName: 'Cấu trúc và tương tác, cải tiến hệ thống',
    subContent: 'Dự án AI đơn giản của em',
    requirementText: 'Trình bày được ví dụ về một kịch bản hội thoại cho một tình huống cụ thể có ứng dụng AI (chatbot, trợ lí ảo).'
  },

  // ========================== LỚP 9 ==========================
  {
    code: '9.A3.1',
    grade: 9,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A3',
    topicName: 'Công dân trong kỉ nguyên AI',
    subContent: 'Định hướng học tập trong kỉ nguyên AI',
    requirementText: 'Trình bày được những năng lực con người cần rèn luyện trong thế giới có AI: học cách học suốt đời, phát triển tư duy phản biện, giữ vững tính sáng tạo và cảm xúc, nâng cao kĩ năng hợp tác.'
  },
  {
    code: '9.B2.3',
    grade: 9,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B2',
    topicName: 'Sử dụng AI an toàn và có trách nhiệm',
    subContent: 'Trách nhiệm khi sử dụng AI',
    requirementText: 'Phân tích được một số dấu hiệu của nội dung giả mạo do AI tạo ra (deepfake); kiểm chứng thông tin bằng các nguồn phù hợp và đề xuất cách ứng phó khi phát hiện nội dung giả mạo.'
  },
  {
    code: '9.C2.1',
    grade: 9,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C2',
    topicName: 'Ứng dụng AI trong học tập và cuộc sống',
    subContent: 'Thực hành vận dụng AI giải quyết vấn đề',
    requirementText: 'Đề xuất được ý tưởng mới, sáng tạo để giải quyết một vấn đề bằng AI; vận dụng kiến thức tạo ra một công cụ AI đơn giản (chatbot, mô hình nhận dạng).'
  },
  {
    code: '9.C4.1',
    grade: 9,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C4',
    topicName: 'Dữ liệu trong AI',
    subContent: 'Cách cải thiện dữ liệu, nâng cao chất lượng',
    requirementText: 'Trình bày được một số cách cải thiện bộ dữ liệu để nâng cao chất lượng của sản phẩm AI (bổ sung dữ liệu thiếu, loại bỏ trùng lặp, sửa dữ liệu sai, gán nhãn lại).'
  },
  {
    code: '9.D1.1',
    grade: 9,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D1',
    topicName: 'Nhận diện và hình thành giải pháp',
    subContent: 'Con người dẫn dắt AI',
    requirementText: 'Trình bày được vai trò của con người là người đồng sáng tạo và dẫn dắt trong việc thiết kế, vận hành và phát triển các hệ thống, công cụ AI.'
  },

  // ========================== LỚP 10 ==========================
  {
    code: '10.A1.1',
    grade: 10,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Con người trong hệ thống AI',
    requirementText: 'Thực hành xác định được vai trò của con người trong sử dụng, vận hành, tùy chỉnh một hệ thống AI cụ thể.'
  },
  {
    code: '10.A3.1',
    grade: 10,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A3',
    topicName: 'Công dân trong kỉ nguyên AI',
    subContent: 'Luật pháp với AI',
    requirementText: 'Kể tên được một vài quy định hoặc luật lệ (Luật An ninh mạng, Luật Dữ liệu, Luật Bảo vệ dữ liệu cá nhân) có chức năng bảo vệ người dùng trong không gian số.'
  },
  {
    code: '10.B2.1',
    grade: 10,
    strandCode: 'B',
    strandName: 'Đạo đức AI',
    topicCode: 'B2',
    topicName: 'Sử dụng AI an toàn và có trách nhiệm',
    subContent: 'Tuân thủ quy định và pháp luật khi sử dụng AI',
    requirementText: 'Nêu được ví dụ về hành vi sử dụng AI hoặc sự cố liên quan đến AI vi phạm quy định của nhà trường hoặc các văn bản pháp luật liên quan đến sử dụng CNTT.'
  },
  {
    code: '10.C3.1',
    grade: 10,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Cách đặt prompt phù hợp với mục tiêu cụ thể',
    requirementText: 'Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu cụ thể; thực hành đặt prompt giải quyết một số vấn đề gần gũi trong học tập và cuộc sống một cách hiệu quả.'
  },
  {
    code: '10.C3.3',
    grade: 10,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Một số công nghệ trong AI',
    requirementText: 'Phân biệt được AI tạo sinh (Generative AI) với các hệ thống AI phân loại, dự đoán qua các ví dụ cụ thể.'
  },
  {
    code: '10.C4.1',
    grade: 10,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C4',
    topicName: 'Dữ liệu trong AI',
    subContent: 'Các dạng dữ liệu huấn luyện và ảnh hưởng',
    requirementText: 'Phân tích được sự ảnh hưởng của chất lượng dữ liệu đến chất lượng đầu ra của hệ thống AI.'
  },
  {
    code: '10.D2.1',
    grade: 10,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D2',
    topicName: 'Cấu trúc và tương tác, cải tiến hệ thống',
    subContent: 'Hệ thống AI',
    requirementText: 'Mô tả được các thành phần cơ bản của hệ thống AI (dữ liệu, mô hình, thuật toán, đầu ra, phản hồi) phù hợp với nhiệm vụ cụ thể.'
  },

  // ========================== LỚP 11 ==========================
  {
    code: '11.A1.1',
    grade: 11,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Quy trình sử dụng AI an toàn',
    requirementText: 'Xây dựng được quy trình sử dụng một sản phẩm AI cụ thể một cách thích hợp, đảm bảo tính an toàn và kiểm soát của con người.'
  },
  {
    code: '11.C3.1',
    grade: 11,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Cách đặt prompt phù hợp với mục tiêu cụ thể',
    requirementText: 'Xác định được một số kĩ thuật prompt nâng cao từ các yêu cầu cụ thể như: ràng buộc định dạng đầu ra (JSON, bảng biểu), chia nhỏ nhiệm vụ (Chain of Thought).'
  },
  {
    code: '11.C3.MR3',
    grade: 11,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Tùy chỉnh hệ thống AI và RAG',
    requirementText: 'Xác định được các phương pháp tùy chỉnh hệ thống AI: điều chỉnh tham số, cung cấp system instructions, sử dụng kĩ thuật sinh nội dung tăng cường bằng truy xuất (RAG).',
    isExtended: true
  },
  {
    code: '11.C5.1',
    grade: 11,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C5',
    topicName: 'Kĩ thuật và thuật toán AI',
    subContent: 'Kiến thức cơ bản về mạng nơ-ron nhân tạo',
    requirementText: 'Nêu được một số ứng dụng của mạng nơ-ron nhân tạo (Artificial Neural Network); trình bày kiến thức cơ bản về cấu trúc nơ-ron và lớp ẩn.'
  },
  {
    code: '11.D1.1',
    grade: 11,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D1',
    topicName: 'Nhận diện và hình thành giải pháp',
    subContent: 'Thiết kế hệ thống AI',
    requirementText: 'Trình bày được cách thức thiết kế và vận hành tổng thể của một hệ thống AI, thể hiện được mối quan hệ giữa mục tiêu, dữ liệu và các thành phần trong hệ thống.'
  },

  // ========================== LỚP 12 ==========================
  {
    code: '12.A1.1',
    grade: 12,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A1',
    topicName: 'Tính chủ động của con người',
    subContent: 'Quyền kiểm soát của con người trong dự án AI',
    requirementText: 'Phân tích được một hệ thống AI nhằm đảm bảo con người có quyền kiểm soát và chịu trách nhiệm đối với tất cả các bước quan trọng trong vòng đời AI.'
  },
  {
    code: '12.A2.1',
    grade: 12,
    strandCode: 'A',
    strandName: 'Tư duy lấy con người làm trung tâm',
    topicCode: 'A2',
    topicName: 'AI vì sự tiến bộ của con người',
    subContent: 'Nguyên tắc đạo đức khi thiết kế AI',
    requirementText: 'Trình bày được các nguyên tắc đạo đức cơ bản trong thiết kế AI: an toàn, công bằng, minh bạch, tôn trọng quyền riêng tư, trách nhiệm giải trình và phục vụ lợi ích xã hội.'
  },
  {
    code: '12.C3.1',
    grade: 12,
    strandCode: 'C',
    strandName: 'Các kĩ thuật và ứng dụng AI',
    topicCode: 'C3',
    topicName: 'Công nghệ AI',
    subContent: 'Một số công cụ thiết kế và phát triển hệ thống AI',
    requirementText: 'Nêu và sử dụng được một số công cụ mã nguồn mở hoặc miễn phí để thiết kế, huấn luyện AI như: Teachable Machine, ML5.js, TensorFlow.js, MIT App Inventor.'
  },
  {
    code: '12.D2.MR2',
    grade: 12,
    strandCode: 'D',
    strandName: 'Thiết kế hệ thống AI',
    topicCode: 'D2',
    topicName: 'Cấu trúc và tương tác, cải tiến hệ thống',
    subContent: 'Hệ thống tác nhân AI (AI Agent)',
    requirementText: 'Trình bày được khả năng và cấu trúc cơ bản của một hệ thống tác nhân AI (AI Agent); xây dựng và kiểm thử hệ thống agent đơn giản.',
    isExtended: true
  }
];

export function getAiRequirementsForGrade(gradeNumber: number): AiFrameworkRequirement[] {
  return AI_FRAMEWORK_REQUIREMENTS.filter(r => r.grade === gradeNumber);
}
