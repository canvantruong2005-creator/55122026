/**
 * BẢNG MÃ CHỈ BÁO NĂNG LỰC SỐ (DIGITAL COMPETENCY FRAMEWORK)
 * Căn cứ Thông tư số 02/2025/TT-BGDĐT ngày 24/01/2025 của Bộ GD&ĐT quy định Khung năng lực số cho người học
 * và Phụ lục 1: Bảng mã chỉ báo năng lực số theo từng cấp học:
 * - L1-L2-L3 (Cơ bản 1 - CB1): Tiểu học lớp 1, 2, 3
 * - L4-L5 (Cơ bản 2 - CB2): Tiểu học lớp 4, 5
 * - L6-L7 (Trung cấp 1 - TC1): THCS lớp 6, 7
 * - L8-L9 (Trung cấp 2 - TC2): THCS lớp 8, 9
 * - L10-L11-L12 (Nâng cao 1 - NC1): THPT lớp 10, 11, 12
 */

export interface CompetencyIndicator {
  gradeGroup: 'L1-L2-L3' | 'L4-L5' | 'L6-L7' | 'L8-L9' | 'L10-L11-L12';
  gradeLevelName: string; // CB1, CB2, TC1, TC2, NC1
  applicableGrades: string[];
  indicators: string[]; // [a- ..., b- ...]
}

export interface SubCompetency {
  code: string; // e.g. "1.1", "1.2", "6.1"
  name: string;
  description?: string;
  levels: CompetencyIndicator[];
}

export interface CompetencyDomain {
  domainId: number;
  code: string;
  name: string;
  description: string;
  subCompetencies: SubCompetency[];
}

export const DIGITAL_COMPETENCY_DOMAINS: CompetencyDomain[] = [
  {
    domainId: 1,
    code: 'NLS.1',
    name: '1. Khai thác dữ liệu và thông tin',
    description: 'Duyệt, tìm kiếm, lọc, đánh giá và quản lý dữ liệu, thông tin và nội dung số.',
    subCompetencies: [
      {
        code: '1.1',
        name: '1.1. Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được nhu cầu thông tin, tìm kiếm dữ liệu, thông tin và nội dung thông qua tìm kiếm đơn giản trong môi trường số.',
              'b- Tìm được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.',
              'c- Xác định được các chiến lược tìm kiếm đơn giản.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được nhu cầu thông tin.',
              'b- Tìm được dữ liệu, thông tin và nội dung thông qua tìm kiếm đơn giản trong môi trường số.',
              'c- Tìm được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.',
              'd- Xác định được các chiến lược tìm kiếm đơn giản.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được nhu cầu thông tin.',
              'b- Thực hiện được rõ ràng và theo quy trình các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số.',
              'c- Giải thích được cách truy cập và điều hướng các kết quả tìm kiếm.',
              'd- Giải thích được rõ ràng và theo quy trình chiến lược tìm kiếm.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Minh họa được nhu cầu thông tin.',
              'b- Tổ chức được tìm kiếm dữ liệu, thông tin và nội dung trong môi trường số.',
              'c- Mô tả được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.',
              'd- Tổ chức được các chiến lược tìm kiếm.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đáp ứng được nhu cầu thông tin.',
              'b- Áp dụng được kỹ thuật tìm kiếm để lấy được dữ liệu, thông tin và nội dung trong môi trường số.',
              'c- Chỉ cho người khác cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.',
              'd- Tự đề xuất được chiến lược tìm kiếm.'
            ]
          }
        ]
      },
      {
        code: '1.2',
        name: '1.2. Đánh giá dữ liệu, thông tin và nội dung số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Phát hiện được độ tin cậy và độ chính xác của các nguồn chung của dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Phát hiện được độ tin cậy và độ chính xác của các nguồn chung của dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Thực hiện phân tích, so sánh, đánh giá được độ tin cậy và độ chính xác của các nguồn dữ liệu, thông tin và nội dung số đã được tổ chức rõ ràng.',
              'b- Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số được xác định rõ ràng.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thực hiện phân tích, so sánh và đánh giá được các nguồn dữ liệu, thông tin và nội dung số.',
              'b- Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Thực hiện đánh giá được độ tin cậy và độ chính xác của các nguồn dữ liệu, thông tin và nội dung số.',
              'b- Tiến hành đánh giá được các dữ liệu, thông tin và nội dung số khác nhau.'
            ]
          }
        ]
      },
      {
        code: '1.3',
        name: '1.3. Quản lý dữ liệu, thông tin và nội dung số',
        description: 'Tổ chức, lưu trữ và truy xuất được dữ liệu, thông tin và nội dung trong môi trường số. Tổ chức và sắp xếp được chúng trong một môi trường có cấu trúc.',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được cách tổ chức, lưu trữ và truy xuất dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường số.',
              'b- Nhận biết được nơi để sắp xếp dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường có cấu trúc.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được cách tổ chức, lưu trữ và truy xuất dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường số.',
              'b- Nhận biết được nơi để sắp xếp dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường có cấu trúc.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Lựa chọn được dữ liệu, thông tin và nội dung để tổ chức, lưu trữ và truy xuất chúng một cách thường xuyên trong môi trường số.',
              'b- Sắp xếp chúng một cách trật tự trong một môi trường có cấu trúc.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Sắp xếp được thông tin, dữ liệu, nội dung để dễ dàng lưu trữ và truy xuất.',
              'b- Tổ chức được thông tin, dữ liệu và nội dung trong một môi trường có cấu trúc.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Thao tác được thông tin, dữ liệu và nội dung để tổ chức, lưu trữ và truy xuất dễ dàng hơn.',
              'b- Triển khai được việc tổ chức và sắp xếp dữ liệu, thông tin và nội dung trong môi trường có cấu trúc.'
            ]
          }
        ]
      }
    ]
  },
  {
    domainId: 2,
    code: 'NLS.2',
    name: '2. Giao tiếp và Hợp tác trong môi trường số',
    description: 'Tương tác, chia sẻ thông tin, trách nhiệm công dân, hợp tác số, quy tắc ứng xử mạng và quản lý danh tính số.',
    subCompetencies: [
      {
        code: '2.1',
        name: '2.1. Tương tác thông qua công nghệ số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Lựa chọn được các công nghệ số đơn giản để tương tác.',
              'b- Xác định được các phương tiện giao tiếp đơn giản thích hợp cho một bối cảnh cụ thể.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Lựa chọn được các công nghệ số đơn giản để tương tác.',
              'b- Xác định được các phương tiện giao tiếp đơn giản thích hợp cho một bối cảnh cụ thể.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Thực hiện được các tương tác được xác định rõ ràng và thường xuyên với các công nghệ số.',
              'b- Lựa chọn được các phương tiện giao tiếp số phù hợp, được xác định rõ ràng cho phù hợp với bối cảnh nhất định.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Lựa chọn được nhiều công nghệ số để tương tác.',
              'b- Lựa chọn được nhiều phương tiện truyền thông số cho phù hợp với bối cảnh nhất định.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Sử dụng được nhiều công nghệ số để tương tác.',
              'b- Cho người khác thấy phương tiện giao tiếp số phù hợp nhất cho một bối cảnh cụ thể.'
            ]
          }
        ]
      },
      {
        code: '2.2',
        name: '2.2. Chia sẻ thông tin và nội dung thông qua công nghệ số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận biết được các công nghệ số đơn giản, phù hợp để chia sẻ dữ liệu, thông tin và nội dung kỹ thuật số.',
              'b- Nhận biết được phương pháp trích dẫn và ghi nguồn cơ bản.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Nhận biết được các công nghệ số đơn giản, phù hợp để chia sẻ dữ liệu, thông tin và nội dung kỹ thuật số.',
              'b- Xác định được phương pháp trích dẫn và ghi nguồn cơ bản.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Lựa chọn các công nghệ số phù hợp được xác định rõ để trao đổi dữ liệu, thông tin và nội dung số.',
              'b- Giải thích cách thức hoạt động như một trung gian để chia sẻ thông tin và nội dung thông qua các công nghệ kỹ thuật số được xác định rõ ràng và thường xuyên.',
              'c- Minh họa rõ ràng và thường xuyên các phương pháp tham chiếu và ghi chú nguồn.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Vận dụng được các công nghệ số phù hợp để chia sẻ dữ liệu, thông tin và nội dung số.',
              'b- Giải thích được cách đóng vai trò trung gian để chia sẻ thông tin và nội dung thông qua công nghệ số.',
              'c- Áp dụng được các phương pháp tham chiếu và ghi chú nguồn.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Chia sẻ dữ liệu, thông tin và nội dung số thông qua nhiều công cụ số phù hợp.',
              'b- Hướng dẫn người khác cách đóng vai trò trung gian để chia sẻ thông tin và nội dung thông qua công nghệ số.',
              'c- Áp dụng được nhiều phương pháp tham chiếu và ghi nguồn khác nhau.'
            ]
          }
        ]
      },
      {
        code: '2.3',
        name: '2.3. Sử dụng công nghệ số để thực hiện trách nhiệm công dân',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được các dịch vụ số đơn giản để có thể tham gia vào xã hội.',
              'b- Nhận biết được các công nghệ số đơn giản, phù hợp để nâng cao năng lực cho bản thân và tham gia vào xã hội với tư cách là một công dân.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các dịch vụ số đơn giản để có thể tham gia vào xã hội.',
              'b- Nhận biết được các công nghệ số đơn giản, phù hợp để nâng cao năng lực cho bản thân và tham gia vào xã hội với tư cách là một công dân.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Lựa chọn được các dịch vụ số được xác định rõ ràng và phổ biến để tham gia vào xã hội.',
              'b- Xác định được các công nghệ số rõ ràng và thích hợp để tự mình trang bị và tham gia vào xã hội như một công dân.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Lựa chọn được các dịch vụ số để tham gia vào xã hội.',
              'b- Thảo luận về các công nghệ số phù hợp để nâng cao năng lực của bản thân và tham gia vào xã hội với tư cách là một công dân.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đề xuất được các dịch vụ số khác nhau để tham gia vào xã hội.',
              'b- Sử dụng được các công nghệ số thích hợp để tự mình trang bị và tham gia vào xã hội như một công dân.'
            ]
          }
        ]
      },
      {
        code: '2.4',
        name: '2.4. Hợp tác thông qua công nghệ số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Chọn được những công cụ và công nghệ số đơn giản cho các quá trình cộng tác.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Chọn được những công cụ và công nghệ số đơn giản cho các quá trình cộng tác.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Lựa chọn được các công cụ và công nghệ số được xác định rõ ràng và thường xuyên cho các quá trình hợp tác.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Lựa chọn được các công cụ và công nghệ số cho các quá trình hợp tác.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đề xuất được các công cụ và công nghệ số khác nhau cho các quá trình hợp tác.'
            ]
          }
        ]
      },
      {
        code: '2.5',
        name: '2.5. Quy tắc ứng xử trên mạng (Netiquette)',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Phân biệt được các chuẩn mực hành vi đơn giản và biết cách sử dụng công nghệ số và tương tác trong môi trường số.',
              'b- Chọn được các phương thức và chiến lược giao tiếp đơn giản phù hợp trong môi trường số.',
              'c- Phân biệt các khía cạnh đơn giản của sự đa dạng về văn hóa và thế hệ cần được tính đến trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Phân biệt được các chuẩn mực hành vi đơn giản và bí quyết sử dụng công nghệ số và tương tác trong môi trường số.',
              'b- Chọn được các phương thức và chiến lược giao tiếp đơn giản phù hợp trong môi trường số.',
              'c- Phân biệt các khía cạnh đơn giản của sự đa dạng về văn hóa và thế hệ cần được tính đến trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Làm rõ được các chuẩn mực hành vi thường xuyên và được xác định rõ ràng cũng như bí quyết khi sử dụng công nghệ số và tương tác trong môi trường số.',
              'b- Thể hiện được các chiến lược giao tiếp thường xuyên và xác định rõ ràng phương thức giao tiếp phù hợp trong môi trường số.',
              'c- Mô tả các khía cạnh đa dạng về văn hóa và thế hệ được xác định rõ ràng và thông thường cần xem xét trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận về các chuẩn mực hành vi và cách sử dụng công nghệ số và tương tác trong môi trường số.',
              'b- Thảo luận các chiến lược giao tiếp phù hợp trong môi trường số.',
              'c- Thảo luận các khía cạnh đa dạng về văn hóa và thế hệ cần xem xét trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các chuẩn mực hành vi và bí quyết khác nhau khi sử dụng công nghệ số và tương tác trong môi trường số.',
              'b- Áp dụng được các chiến lược giao tiếp khác nhau trong môi trường số một cách phù hợp.',
              'c- Áp dụng được các khía cạnh đa dạng về văn hóa và thế hệ khác nhau để xem xét trong môi trường số.'
            ]
          }
        ]
      },
      {
        code: '2.6',
        name: '2.6. Quản lý danh tính số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được danh tính số.',
              'b- Mô tả được những cách đơn giản để bảo vệ danh tiếng trực tuyến của bản thân.',
              'c- Nhận biết được dữ liệu đơn giản do mình tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được danh tính số.',
              'b- Mô tả được những cách đơn giản để bảo vệ danh tiếng trực tuyến của bản thân.',
              'c- Nhận biết được dữ liệu đơn giản do mình tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Phân biệt được một loạt các danh tính số thông thường và được xác định rõ ràng.',
              'b- Giải thích được những cách được xác định rõ ràng và thường xuyên để bảo vệ danh tiếng trực tuyến của bản thân.',
              'c- Mô tả dữ liệu được xác định rõ ràng mà bạn thường xuyên thu được thông qua các công cụ, môi trường hoặc dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Hiển thị được nhiều danh tính số cụ thể.',
              'b- Thảo luận những cách cụ thể để bảo vệ danh tiếng trực tuyến của bản thân.',
              'c- Thao tác dữ liệu cá nhân tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Sử dụng được nhiều danh tính số khác nhau.',
              'b- Áp dụng được các cách khác nhau để bảo vệ danh tính trực tuyến của bản thân.',
              'c- Sử dụng được dữ liệu tạo ra thông qua công cụ, môi trường và một số dịch vụ số.'
            ]
          }
        ]
      }
    ]
  },
  {
    domainId: 3,
    code: 'NLS.3',
    name: '3. Sáng tạo nội dung số',
    description: 'Phát triển, tích hợp và tái tạo nội dung số, thực thi bản quyền, giấy phép và lập trình.',
    subCompetencies: [
      {
        code: '3.1',
        name: '3.1. Phát triển nội dung số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được các cách tạo và chỉnh sửa nội dung đơn giản ở các định dạng đơn giản.',
              'b- Chọn được cách thể hiện bản thân thông qua việc tạo ra các nội dung số đơn giản.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các cách tạo và chỉnh sửa nội dung đơn giản ở các định dạng đơn giản.',
              'b- Chọn được cách thể hiện bản thân thông qua việc tạo ra các nội dung số đơn giản.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được cách tạo và chỉnh sửa nội dung có khái niệm cụ thể và mang tính phổ thông bằng những định dạng rõ ràng, phổ biến.',
              'b- Thể hiện được bản thân thông qua việc tạo ra các nội dung số thông thường và được xác định rõ ràng.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Chỉ ra được cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau.',
              'b- Thể hiện được bản thân thông qua việc tạo ra các nội dung số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau.',
              'b- Chỉ ra được những cách thể hiện bản thân thông qua việc tạo ra các nội dung số.'
            ]
          }
        ]
      },
      {
        code: '3.2',
        name: '3.2. Tích hợp và tạo lập lại nội dung số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Chọn được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục đơn giản có nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Chọn được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục đơn giản có nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục nội dung và thông tin mới được xác định rõ ràng để tạo ra những nội dung và thông tin mới và độc đáo.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Làm việc với các mục nội dung và thông tin mới khác nhau, sửa đổi, tinh chỉnh, cải thiện và tích hợp chúng để tạo ra những mục mới và độc đáo.'
            ]
          }
        ]
      },
      {
        code: '3.3',
        name: '3.3. Thực thi bản quyền và giấy phép',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được các quy tắc đơn giản về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các quy tắc đơn giản về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được các quy tắc thông thường và được xác định rõ ràng về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận các quy tắc về bản quyền và giấy phép áp dụng cho thông tin và nội dung số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các quy định khác nhau về bản quyền và giấy phép cho dữ liệu, thông tin và nội dung số.'
            ]
          }
        ]
      },
      {
        code: '3.4',
        name: '3.4. Lập trình',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Liệt kê được các hướng dẫn đơn giản để hệ thống máy tính giải quyết một vấn đề đơn giản hoặc thực hiện một nhiệm vụ đơn giản.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Liệt kê được các hướng dẫn đơn giản để hệ thống máy tính giải quyết một vấn đề đơn giản hoặc thực hiện một nhiệm vụ đơn giản.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Liệt kê được các hướng dẫn thông thường và được xác định rõ ràng cho một hệ thống máy tính để giải quyết các vấn đề thường ngày hoặc thực hiện các tác vụ thường ngày.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Liệt kê được các hướng dẫn cho một hệ thống máy tính để giải quyết một vấn đề nhất định hoặc thực hiện một nhiệm vụ cụ thể.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Tự thao tác được bằng các hướng dẫn dành cho hệ thống máy tính để giải quyết một vấn đề khác hoặc thực hiện các nhiệm vụ khác nhau.'
            ]
          }
        ]
      }
    ]
  },
  {
    domainId: 4,
    code: 'NLS.4',
    name: '4. An toàn trong môi trường số',
    description: 'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư, sức khỏe, an sinh số và môi trường.',
    subCompetencies: [
      {
        code: '4.1',
        name: '4.1. Bảo vệ thiết bị',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận biết được cách bảo vệ thiết bị và nội dung số một cách đơn giản.',
              'b- Phân biệt được rủi ro và mối đe dọa đơn giản trong môi trường số.',
              'c- Chọn lựa được các biện pháp an toàn và bảo mật đơn giản.',
              'd- Nhận biết được những cách thức đơn giản để quan tâm đến mức độ tin cậy và quyền riêng tư.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Nhận biết được cách bảo vệ thiết bị và nội dung số một cách đơn giản.',
              'b- Phân biệt được rủi ro và mối đe dọa đơn giản trong môi trường số.',
              'c- Tuân theo được các biện pháp an toàn và bảo mật đơn giản.',
              'd- Nhận biết được những cách thức đơn giản để quan tâm đến mức độ tin cậy và quyền riêng tư.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được những cách thức cơ bản và phổ biến để bảo vệ thiết bị và nội dung số.',
              'b- Phân biệt được những rủi ro và mối đe dọa cơ bản và phổ biến trong môi trường số.',
              'c- Chọn lựa được các biện pháp an toàn và bảo mật rõ ràng và thường xuyên.',
              'd- Chỉ ra được những cách thức cơ bản và phổ biến để quan tâm đến mức độ tin cậy và quyền riêng tư.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thiết lập được những cách thức bảo vệ thiết bị và nội dung số.',
              'b- Phân biệt được rủi ro và mối đe dọa trong môi trường số.',
              'c- Chọn lựa được các biện pháp an toàn và bảo mật.',
              'd- Giải thích được các cách thức để quan tâm đến mức độ tin cậy và quyền riêng tư.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các cách khác nhau để bảo vệ thiết bị và nội dung số.',
              'b- Nhận thức được sự đa dạng của các rủi ro và đe dọa trong môi trường số.',
              'c- Áp dụng được các biện pháp an toàn và bảo mật.',
              'd- Sử dụng được các cách thức khác nhau để quan tâm đến mức độ tin cậy và quyền riêng tư.'
            ]
          }
        ]
      },
      {
        code: '4.2',
        name: '4.2. Bảo vệ dữ liệu cá nhân và quyền riêng tư',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Lựa chọn được những cách thức đơn giản để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.',
              'b- Nhận biết được các cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn, có khả năng bảo vệ bản thân và người khác.',
              'c- Nhận diện được các tuyên bố cơ bản trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Lựa chọn được những cách thức đơn giản để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.',
              'b- Nhận biết được các cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn, có khả năng bảo vệ bản thân và người khác.',
              'c- Nhận diện được các tuyên bố cơ bản trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được các cách thức cơ bản và phổ biến để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.',
              'b- Giải thích được các cách thức cơ bản và phổ biến để sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn.',
              'c- Chỉ ra được các tuyên bố cơ bản và phổ biến trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận về cách bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.',
              'b- Thảo luận về cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn.',
              'c- Chỉ ra được các tuyên bố trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các cách thức khác nhau để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.',
              'b- Áp dụng được các cách thức đặc thù để chia sẻ dữ liệu cá nhân một cách an toàn.',
              'c- Giải thích được các tuyên bố trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.'
            ]
          }
        ]
      },
      {
        code: '4.3',
        name: '4.3. Bảo vệ sức khỏe và an sinh số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Phân biệt được các cách thức đơn giản để tránh rủi ro và đe dọa đến sức khỏe thể chất và tinh thần khi sử dụng công nghệ số.',
              'b- Lựa chọn được những cách thức đơn giản để bảo vệ bản thân khỏi nguy cơ trong môi trường số.',
              'c- Nhận biết được những công nghệ số đơn giản cho tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Phân biệt được các cách thức đơn giản để tránh rủi ro và đe dọa đến sức khỏe thể chất và tinh thần khi sử dụng công nghệ số.',
              'b- Lựa chọn được những cách thức đơn giản để bảo vệ bản thân khỏi nguy cơ trong môi trường số.',
              'c- Nhận biết được những công nghệ số đơn giản cho tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được những cách thức cơ bản và phổ biến để tránh rủi ro và đe dọa đối với sức khỏe thể chất và tinh thần khi sử dụng công nghệ số.',
              'b- Lựa chọn được những cách thức cơ bản và phổ biến để bảo vệ bản thân khỏi nguy cơ trong môi trường số.',
              'c- Chỉ ra được những công nghệ số cơ bản và phổ biến giúp tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Giải thích được những cách thức để tránh những sự đe dọa liên quan đến việc sử dụng công nghệ số đối với sức khỏe thể chất và tinh thần.',
              'b- Lựa chọn được cách thức bảo vệ bản thân và người khác khỏi nguy cơ trong môi trường số.',
              'c- Thảo luận về những công nghệ số giúp tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Trình bày được các cách thức khác nhau để tránh rủi ro và đe dọa đến sức khỏe thể chất và tinh thần khi sử dụng công nghệ số.',
              'b- Áp dụng được các cách thức khác nhau để bảo vệ bản thân và người khác khỏi nguy cơ trong môi trường số.',
              'c- Trình bày được các công nghệ số khác nhau giúp tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'
            ]
          }
        ]
      },
      {
        code: '4.4',
        name: '4.4. Bảo vệ môi trường',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận biết được tác động cơ bản của công nghệ số và việc sử dụng công nghệ số đối với môi trường.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Nhận biết được tác động cơ bản của công nghệ số và việc sử dụng công nghệ số đối với môi trường.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được những tác động cơ bản và phổ biến của công nghệ số và việc sử dụng công nghệ số đối với môi trường.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận về các cách thức bảo vệ môi trường khỏi tác động của công nghệ số và việc sử dụng công nghệ số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Trình bày được các cách thức khác nhau để bảo vệ môi trường khỏi tác động của công nghệ số và việc sử dụng công nghệ số.'
            ]
          }
        ]
      }
    ]
  },
  {
    domainId: 5,
    code: 'NLS.5',
    name: '5. Giải quyết vấn đề trong môi trường số',
    description: 'Xử lý sự cố kỹ thuật, xác định nhu cầu, sử dụng sáng tạo công nghệ số và tự cải thiện năng lực số.',
    subCompetencies: [
      {
        code: '5.1',
        name: '5.1. Giải quyết các vấn đề kỹ thuật',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được các vấn đề kỹ thuật đơn giản khi vận hành thiết bị và sử dụng môi trường số.',
              'b- Xác định được các giải pháp đơn giản để giải quyết chúng.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các vấn đề kỹ thuật đơn giản khi vận hành thiết bị và sử dụng môi trường số.',
              'b- Xác định được các giải pháp đơn giản để giải quyết chúng.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được các vấn đề kỹ thuật thông thường và được xác định rõ ràng khi vận hành thiết bị và sử dụng môi trường số.',
              'b- Chọn được các giải pháp được xác định rõ ràng và thông thường cho chúng.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Phân biệt được các vấn đề kỹ thuật khi vận hành thiết bị và sử dụng môi trường số.',
              'b- Chọn được giải pháp cho chúng.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đánh giá được các vấn đề kỹ thuật khi sử dụng môi trường số và vận hành các thiết bị số.',
              'b- Áp dụng được các giải pháp khác nhau cho chúng.'
            ]
          }
        ]
      },
      {
        code: '5.2',
        name: '5.2. Xác định nhu cầu và giải pháp công nghệ',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được nhu cầu cá nhân.',
              'b- Nhận ra được các công cụ số đơn giản và các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.',
              'c- Chọn được những cách đơn giản để điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được nhu cầu cá nhân.',
              'b- Nhận ra được các công cụ số đơn giản và các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.',
              'c- Chọn được những cách đơn giản để điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chỉ ra được những nhu cầu được xác định rõ ràng và thường xuyên.',
              'b- Chọn được các công cụ số thông thường và được xác định rõ ràng cũng như các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.',
              'c- Chọn được những cách thông thường và được xác định rõ ràng để điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Giải thích nhu cầu cá nhân.',
              'b- Lựa chọn được các công cụ số và các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.',
              'c- Chọn được cách điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đánh giá được nhu cầu cá nhân.',
              'b- Áp dụng được các công cụ số khác nhau và các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.',
              'c- Sử dụng được các cách khác nhau để điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'
            ]
          }
        ]
      },
      {
        code: '5.3',
        name: '5.3. Sử dụng sáng tạo công nghệ số',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Xác định được các công cụ và công nghệ số đơn giản có thể được sử dụng để tạo ra kiến thức và đổi mới quy trình cũng như sản phẩm.',
              'b- Thể hiện được sự quan tâm của cá nhân và tập thể đến quá trình xử lý nhận thức đơn giản để hiểu và giải quyết các vấn đề khái niệm đơn giản và các tình huống có vấn đề trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các công cụ và công nghệ số đơn giản có thể được sử dụng để tạo ra kiến thức và đổi mới quy trình cũng như sản phẩm.',
              'b- Tuân theo quy trình nhận thức đơn giản của cá nhân và tập thể để hiểu và giải quyết các vấn đề khái niệm đơn giản và các tình huống có vấn đề trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Chọn được các công cụ và công nghệ số có thể được sử dụng để tạo ra kiến thức rõ ràng cũng như các quy trình và sản phẩm đổi mới được xác định rõ ràng.',
              'b- Gắn kết được cá nhân và tập thể vào một số quá trình xử lý nhận thức để hiểu và giải quyết các vấn đề mang tính khái niệm và tình huống có vấn đề thông thường và được xác định rõ ràng trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Phân biệt được các công cụ và công nghệ số có thể được sử dụng để tạo ra kiến thức và đổi mới quy trình và sản phẩm.',
              'b- Gắn kết được cá nhân và tập thể vào quá trình xử lý nhận thức để hiểu và giải quyết các vấn đề khái niệm và tình huống có vấn đề trong môi trường số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Áp dụng được các công cụ và công nghệ số khác nhau để tạo ra kiến thức cũng như các quy trình và sản phẩm đổi mới.',
              'b- Áp dụng xử lý nhận thức của cá nhân và tập thể để giải quyết các vấn đề khái niệm và tình huống có vấn đề khác nhau trong môi trường số.'
            ]
          }
        ]
      },
      {
        code: '5.4',
        name: '5.4. Xác định các vấn đề cần cải thiện về Năng Lực Số (NLS)',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận ra được NLS của tôi cần được cải thiện hoặc cập nhật ở đâu.',
              'b- Xác định được nơi để tìm kiếm cơ hội phát triển bản thân và cập nhật sự phát triển công nghệ số.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Nhận ra được NLS của tôi cần được cải thiện hoặc cập nhật ở đâu.',
              'b- Xác định được nơi để tìm kiếm cơ hội phát triển bản thân và cập nhật sự phát triển công nghệ số.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được NLS của bản thân cần được cải thiện hoặc cập nhật ở đâu.',
              'b- Chỉ ra được nơi để tìm kiếm các cơ hội được xác định rõ ràng để phát triển bản thân và cập nhật sự phát triển công nghệ số.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Thảo luận về lĩnh vực NLS của bản thân cần được cải thiện hoặc cập nhật.',
              'b- Chỉ ra được cách hỗ trợ người khác phát triển NLS của họ.',
              'c- Chỉ ra được nơi để tìm kiếm cơ hội phát triển bản thân và cập nhật sự phát triển công nghệ số.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Chứng minh được NLS của tôi cần được cải thiện hoặc cập nhật ở đâu.',
              'b- Minh họa được những cách khác nhau để hỗ trợ người khác phát triển NLS của họ.',
              'c- Đề xuất được các cơ hội khác nhau để phát triển bản thân và cập nhật sự phát triển công nghệ số.'
            ]
          }
        ]
      }
    ]
  },
  {
    domainId: 6,
    code: 'NLS.6',
    name: '6. Ứng dụng Trí tuệ nhân tạo (AI)',
    description: 'Hiểu biết về trí tuệ nhân tạo, sử dụng AI an toàn và đánh giá hệ thống AI.',
    subCompetencies: [
      {
        code: '6.1',
        name: '6.1. Hiểu biết về trí tuệ nhân tạo',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận biết được một số ứng dụng AI đơn giản trong đời sống.',
              'b- Làm quen với các khái niệm ban đầu về AI thông qua trải nghiệm thực tế.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Xác định được các khái niệm cơ bản của AI.',
              'b- Nhớ lại được các ứng dụng đơn giản của AI trong cuộc sống hàng ngày.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được nguyên tắc hoạt động cơ bản của AI.',
              'b- Diễn giải được các thuật ngữ và khái niệm liên quan đến AI.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Áp dụng được các nguyên tắc cơ bản của AI để giải quyết vấn đề đơn giản.',
              'b- Thực hiện được các thao tác cơ bản trên các công cụ AI.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Phân tích được cách AI hoạt động trong các ứng dụng cụ thể.',
              'b- So sánh được các hệ thống AI khác nhau và cách chúng xử lý dữ liệu.'
            ]
          }
        ]
      },
      {
        code: '6.2',
        name: '6.2. Sử dụng trí tuệ nhân tạo',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận diện được các công cụ AI đơn giản.',
              'b- Thực hiện được các thao tác cơ bản với các công cụ AI dưới sự hướng dẫn của giáo viên.',
              'c- Nhận thức được cơ bản về các vấn đề đạo đức và pháp lý liên quan đến AI.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Áp dụng được các công cụ AI để giải quyết vấn đề đơn giản.',
              'b- Tương tác được với các hệ thống AI cơ bản.',
              'c- Tuân thủ các quy định pháp luật cơ bản khi sử dụng AI.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Sử dụng được các công cụ AI trong công việc và học tập hàng ngày.',
              'b- Thực hành được các kỹ năng sử dụng AI thông qua các bài tập và dự án nhỏ.',
              'c- Xem xét các khía cạnh đạo đức khi sử dụng AI, bảo đảm không vi phạm quyền riêng tư và bảo mật dữ liệu.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Tối ưu hóa việc sử dụng các công cụ AI để đạt hiệu quả cao hơn.',
              'b- Quản lý được việc triển khai các công cụ AI trong các dự án nhỏ.',
              'c- Bảo vệ được dữ liệu cá nhân và tuân thủ các quy định pháp luật về bảo mật thông tin khi sử dụng AI.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Phát triển được các ứng dụng AI tùy chỉnh để giải quyết các vấn đề cụ thể.',
              'b- Điều chỉnh được các hệ thống AI để phù hợp với nhu cầu cụ thể.',
              'c- Đánh giá và giảm thiểu được các rủi ro đạo đức và pháp lý liên quan đến việc sử dụng AI.'
            ]
          }
        ]
      },
      {
        code: '6.3',
        name: '6.3. Đánh giá trí tuệ nhân tạo',
        levels: [
          {
            gradeGroup: 'L1-L2-L3',
            gradeLevelName: 'Cơ bản 1 (CB1)',
            applicableGrades: ['Lớp 1', 'Lớp 2', 'Lớp 3'],
            indicators: [
              'a- Nhận diện được một số vật dụng/trò chơi thông minh có sử dụng AI.',
              'b- Nhớ được rằng không phải mọi thông tin từ máy móc đều đúng.'
            ]
          },
          {
            gradeGroup: 'L4-L5',
            gradeLevelName: 'Cơ bản 2 (CB2)',
            applicableGrades: ['Lớp 4', 'Lớp 5'],
            indicators: [
              'a- Nhận diện được các yếu tố cơ bản của hệ thống AI cần được đánh giá.',
              'b- Mô tả được các chức năng chính của hệ thống AI.'
            ]
          },
          {
            gradeGroup: 'L6-L7',
            gradeLevelName: 'Trung cấp 1 (TC1)',
            applicableGrades: ['Lớp 6', 'Lớp 7'],
            indicators: [
              'a- Giải thích được cách thức hoạt động của các hệ thống AI đơn giản.',
              'b- Tóm tắt được các đặc điểm và ứng dụng của hệ thống AI.'
            ]
          },
          {
            gradeGroup: 'L8-L9',
            gradeLevelName: 'Trung cấp 2 (TC2)',
            applicableGrades: ['Lớp 8', 'Lớp 9'],
            indicators: [
              'a- Phân tích được hiệu quả của hệ thống AI trong việc giải quyết các vấn đề cụ thể.',
              'b- So sánh được hiệu suất của các hệ thống AI khác nhau.'
            ]
          },
          {
            gradeGroup: 'L10-L11-L12',
            gradeLevelName: 'Nâng cao 1 (NC1)',
            applicableGrades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
            indicators: [
              'a- Đánh giá được độ chính xác và tin cậy của các hệ thống AI.',
              'b- Xem xét được các kết quả và đưa ra nhận xét về hiệu quả của hệ thống AI.'
            ]
          }
        ]
      }
    ]
  }
];

export function getIndicatorsForGrade(gradeString: string): { domainName: string; subName: string; code: string; indicator: string }[] {
  const result: { domainName: string; subName: string; code: string; indicator: string }[] = [];
  
  let targetGroup: 'L1-L2-L3' | 'L4-L5' | 'L6-L7' | 'L8-L9' | 'L10-L11-L12' = 'L6-L7';
  if (/lớp\s*[123]\b/i.test(gradeString)) targetGroup = 'L1-L2-L3';
  else if (/lớp\s*[45]\b/i.test(gradeString)) targetGroup = 'L4-L5';
  else if (/lớp\s*[67]\b/i.test(gradeString)) targetGroup = 'L6-L7';
  else if (/lớp\s*[89]\b/i.test(gradeString)) targetGroup = 'L8-L9';
  else if (/lớp\s*(10|11|12)\b/i.test(gradeString)) targetGroup = 'L10-L11-L12';

  for (const domain of DIGITAL_COMPETENCY_DOMAINS) {
    for (const sub of domain.subCompetencies) {
      const matchLevel = sub.levels.find(l => l.gradeGroup === targetGroup);
      if (matchLevel) {
        for (const ind of matchLevel.indicators) {
          result.push({
            domainName: domain.name,
            subName: sub.name,
            code: sub.code,
            indicator: ind
          });
        }
      }
    }
  }

  return result;
}
