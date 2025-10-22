/**
 * PAPS 수업 관리 모듈
 *
 * 이 모듈은 PAPS(Physical Activity Promotion System) 수업의 모든 기능을 관리합니다.
 * PAPS 반 생성/삭제, 학생 관리, 기록 입력, 등급 계산, 엑셀 내보내기 등을 담당합니다.
 *
 * 현재 지원하는 기능:
 * - PAPS 반 관리 (생성, 편집, 삭제, 선택)
 * - 학생 명단 관리 (추가, 삭제, 엑셀 업로드)
 * - PAPS 기록 입력 및 등급 계산
 * - 엑셀 내보내기/가져오기
 * - 차트 및 통계 생성
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
// PAPS 항목 정의
const PAPS_ITEMS = {
    "심폐지구력": { id: "endurance", options: ["왕복오래달리기", "오래달리기", "스텝검사"] },
    "유연성": { id: "flexibility", options: ["앉아윗몸앞으로굽히기", "종합유연성검사"] },
    "근력/근지구력": { id: "strength", options: ["악력", "팔굽혀펴기", "윗몸말아올리기"] },
    "순발력": { id: "power", options: ["제자리멀리뛰기", "50m 달리기"] },
    "체지방": { id: "bodyfat", options: ["BMI"] }
};
// PAPS 평가 기준 데이터 (원본 기준표에 따른 정확한 데이터)
const PAPS_CRITERIA_DATA = {
    "남자": {
        "초4": { "왕복오래달리기": [[50, 9999, 1], [40, 49, 2], [30, 39, 3], [20, 29, 4], [0, 19, 5]], "앉아윗몸앞으로굽히기": [[18.1, 9999, 1], [13.1, 18, 2], [8.1, 13, 3], [3.1, 8, 4], [0, 3, 5]], "제자리멀리뛰기": [[180.1, 9999, 1], [150.1, 180, 2], [130.1, 150, 3], [110.1, 130, 4], [0, 110, 5]], "팔굽혀펴기": [[25, 9999, 1], [20, 24, 2], [15, 19, 3], [10, 14, 4], [0, 9, 5]], "윗몸말아올리기": [[45, 9999, 1], [35, 44, 2], [25, 34, 3], [15, 24, 4], [0, 14, 5]], "악력": [[28, 9999, 1], [22, 27.9, 2], [17, 21.9, 3], [12, 16.9, 4], [0, 11.9, 5]], "50m 달리기": [[0, 8.9, 1], [9, 9.9, 2], [10, 10.9, 3], [11, 11.9, 4], [12, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[350.1, 9999, 1], [300.1, 350, 2], [250.1, 300, 3], [200.1, 250, 4], [0, 200, 5]] },
        "초5": { "왕복오래달리기": [[55, 9999, 1], [45, 54, 2], [35, 44, 3], [25, 34, 4], [0, 24, 5]], "앉아윗몸앞으로굽히기": [[19.1, 9999, 1], [14.1, 19, 2], [9.1, 14, 3], [4.1, 9, 4], [0, 4, 5]], "제자리멀리뛰기": [[190.1, 9999, 1], [160.1, 190, 2], [140.1, 160, 3], [120.1, 140, 4], [0, 120, 5]], "팔굽혀펴기": [[28, 9999, 1], [23, 27, 2], [18, 22, 3], [13, 17, 4], [0, 12, 5]], "윗몸말아올리기": [[50, 9999, 1], [40, 49, 2], [30, 39, 3], [20, 29, 4], [0, 19, 5]], "악력": [[32, 9999, 1], [26, 31.9, 2], [21, 25.9, 3], [16, 20.9, 4], [0, 15.9, 5]], "50m 달리기": [[0, 8.7, 1], [8.8, 9.7, 2], [9.8, 10.7, 3], [10.8, 11.7, 4], [11.8, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[105, 9999, 1], [95, 104, 2], [85, 94, 3], [75, 84, 4], [0, 74, 5]], "던지기": [[400.1, 9999, 1], [350.1, 400, 2], [300.1, 350, 3], [250.1, 300, 4], [0, 250, 5]] },
        "초6": { "왕복오래달리기": [[60, 9999, 1], [50, 59, 2], [40, 49, 3], [30, 39, 4], [0, 29, 5]], "앉아윗몸앞으로굽히기": [[20.1, 9999, 1], [15.1, 20, 2], [10.1, 15, 3], [5.1, 10, 4], [0, 5, 5]], "제자리멀리뛰기": [[200.1, 9999, 1], [170.1, 200, 2], [150.1, 170, 3], [130.1, 150, 4], [0, 130, 5]], "팔굽혀펴기": [[31, 9999, 1], [26, 30, 2], [21, 25, 3], [16, 20, 4], [0, 15, 5]], "윗몸말아올리기": [[55, 9999, 1], [45, 54, 2], [35, 44, 3], [25, 34, 4], [0, 24, 5]], "악력": [[36, 9999, 1], [30, 35.9, 2], [25, 29.9, 3], [20, 24.9, 4], [0, 19.9, 5]], "50m 달리기": [[0, 8.5, 1], [8.6, 9.5, 2], [9.6, 10.5, 3], [10.6, 11.5, 4], [11.6, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[110, 9999, 1], [100, 109, 2], [90, 99, 3], [80, 89, 4], [0, 79, 5]], "던지기": [[450.1, 9999, 1], [400.1, 450, 2], [350.1, 400, 3], [300.1, 350, 4], [0, 300, 5]] },
        "중1": { "왕복오래달리기": [[64, 9999, 1], [50, 63, 2], [36, 49, 3], [20, 35, 4], [0, 19, 5]], "앉아윗몸앞으로굽히기": [[21.1, 9999, 1], [16.1, 21, 2], [11.1, 16, 3], [6.1, 11, 4], [0, 6, 5]], "제자리멀리뛰기": [[211.1, 9999, 1], [177.1, 211, 2], [159.1, 177, 3], [131.1, 159, 4], [0, 131, 5]], "팔굽혀펴기": [[34, 9999, 1], [29, 33, 2], [24, 28, 3], [19, 23, 4], [0, 18, 5]], "윗몸말아올리기": [[60, 9999, 1], [50, 59, 2], [40, 49, 3], [30, 39, 4], [0, 29, 5]], "악력": [[42, 9999, 1], [30, 41.9, 2], [22.5, 29.9, 3], [16.5, 22.4, 4], [0, 16.4, 5]], "50m 달리기": [[0, 8.3, 1], [8.4, 9.3, 2], [9.4, 10.3, 3], [10.4, 11.3, 4], [11.4, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[115, 9999, 1], [105, 114, 2], [95, 104, 3], [85, 94, 4], [0, 84, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "중2": { "왕복오래달리기": [[67, 9999, 1], [53, 66, 2], [39, 52, 3], [23, 38, 4], [0, 22, 5]], "앉아윗몸앞으로굽히기": [[22.1, 9999, 1], [17.1, 22, 2], [12.1, 17, 3], [7.1, 12, 4], [0, 7, 5]], "제자리멀리뛰기": [[218.1, 9999, 1], [184.1, 218, 2], [166.1, 184, 3], [138.1, 166, 4], [0, 138, 5]], "팔굽혀펴기": [[37, 9999, 1], [32, 36, 2], [27, 31, 3], [22, 26, 4], [0, 21, 5]], "윗몸말아올리기": [[65, 9999, 1], [55, 64, 2], [45, 54, 3], [35, 44, 4], [0, 34, 5]], "악력": [[48, 9999, 1], [36, 47.9, 2], [28.5, 35.9, 3], [22.5, 28.4, 4], [0, 22.4, 5]], "50m 달리기": [[0, 8.1, 1], [8.2, 9.1, 2], [9.2, 10.1, 3], [10.2, 11.1, 4], [11.2, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[120, 9999, 1], [110, 119, 2], [100, 109, 3], [90, 99, 4], [0, 89, 5]], "던지기": [[550.1, 9999, 1], [500.1, 550, 2], [450.1, 500, 3], [400.1, 450, 4], [0, 400, 5]] },
        "중3": { "왕복오래달리기": [[70, 9999, 1], [56, 69, 2], [42, 55, 3], [26, 41, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[23.1, 9999, 1], [18.1, 23, 2], [13.1, 18, 3], [8.1, 13, 4], [0, 8, 5]], "제자리멀리뛰기": [[225.1, 9999, 1], [191.1, 225, 2], [173.1, 191, 3], [145.1, 173, 4], [0, 145, 5]], "팔굽혀펴기": [[40, 9999, 1], [35, 39, 2], [30, 34, 3], [25, 29, 4], [0, 24, 5]], "윗몸말아올리기": [[70, 9999, 1], [60, 69, 2], [50, 59, 3], [40, 49, 4], [0, 39, 5]], "악력": [[54, 9999, 1], [42, 53.9, 2], [34.5, 41.9, 3], [28.5, 34.4, 4], [0, 28.4, 5]], "50m 달리기": [[0, 7.9, 1], [8, 8.9, 2], [9, 9.9, 3], [10, 10.9, 4], [11, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[125, 9999, 1], [115, 124, 2], [105, 114, 3], [95, 104, 4], [0, 94, 5]], "던지기": [[600.1, 9999, 1], [550.1, 600, 2], [500.1, 550, 3], [450.1, 500, 4], [0, 450, 5]] },
        "고1": { "왕복오래달리기": [[70, 9999, 1], [56, 69, 2], [42, 55, 3], [26, 41, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[23.1, 9999, 1], [18.1, 23, 2], [13.1, 18, 3], [8.1, 13, 4], [0, 8, 5]], "제자리멀리뛰기": [[225.1, 9999, 1], [191.1, 225, 2], [173.1, 191, 3], [145.1, 173, 4], [0, 145, 5]], "팔굽혀펴기": [[40, 9999, 1], [35, 39, 2], [30, 34, 3], [25, 29, 4], [0, 24, 5]], "윗몸말아올리기": [[70, 9999, 1], [60, 69, 2], [50, 59, 3], [40, 49, 4], [0, 39, 5]], "악력": [[61, 9999, 1], [42.5, 60.9, 2], [35.5, 42.4, 3], [29, 35.4, 4], [0, 28.9, 5]], "50m 달리기": [[0, 7.9, 1], [8, 8.9, 2], [9, 9.9, 3], [10, 10.9, 4], [11, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[125, 9999, 1], [115, 124, 2], [105, 114, 3], [95, 104, 4], [0, 94, 5]], "던지기": [[600.1, 9999, 1], [550.1, 600, 2], [500.1, 550, 3], [450.1, 500, 4], [0, 450, 5]] },
        "고2": { "왕복오래달리기": [[70, 9999, 1], [56, 69, 2], [42, 55, 3], [26, 41, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[23.1, 9999, 1], [18.1, 23, 2], [13.1, 18, 3], [8.1, 13, 4], [0, 8, 5]], "제자리멀리뛰기": [[225.1, 9999, 1], [191.1, 225, 2], [173.1, 191, 3], [145.1, 173, 4], [0, 145, 5]], "팔굽혀펴기": [[40, 9999, 1], [35, 39, 2], [30, 34, 3], [25, 29, 4], [0, 24, 5]], "윗몸말아올리기": [[70, 9999, 1], [60, 69, 2], [50, 59, 3], [40, 49, 4], [0, 39, 5]], "악력": [[61, 9999, 1], [42.5, 60.9, 2], [35.5, 42.4, 3], [29, 35.4, 4], [0, 28.9, 5]], "50m 달리기": [[0, 7.9, 1], [8, 8.9, 2], [9, 9.9, 3], [10, 10.9, 4], [11, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[125, 9999, 1], [115, 124, 2], [105, 114, 3], [95, 104, 4], [0, 94, 5]], "던지기": [[600.1, 9999, 1], [550.1, 600, 2], [500.1, 550, 3], [450.1, 500, 4], [0, 450, 5]] },
        "고3": { "왕복오래달리기": [[70, 9999, 1], [56, 69, 2], [42, 55, 3], [26, 41, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[23.1, 9999, 1], [18.1, 23, 2], [13.1, 18, 3], [8.1, 13, 4], [0, 8, 5]], "제자리멀리뛰기": [[225.1, 9999, 1], [191.1, 225, 2], [173.1, 191, 3], [145.1, 173, 4], [0, 145, 5]], "팔굽혀펴기": [[40, 9999, 1], [35, 39, 2], [30, 34, 3], [25, 29, 4], [0, 24, 5]], "윗몸말아올리기": [[70, 9999, 1], [60, 69, 2], [50, 59, 3], [40, 49, 4], [0, 39, 5]], "악력": [[61, 9999, 1], [42.5, 60.9, 2], [35.5, 42.4, 3], [29, 35.4, 4], [0, 28.9, 5]], "50m 달리기": [[0, 7.9, 1], [8, 8.9, 2], [9, 9.9, 3], [10, 10.9, 4], [11, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[125, 9999, 1], [115, 124, 2], [105, 114, 3], [95, 104, 4], [0, 94, 5]], "던지기": [[600.1, 9999, 1], [550.1, 600, 2], [500.1, 550, 3], [450.1, 500, 4], [0, 450, 5]] }
    },
    "여자": {
        "초4": { "왕복오래달리기": [[50, 9999, 1], [40, 49, 2], [30, 39, 3], [20, 29, 4], [0, 19, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [7, 9.9, 2], [5, 6.9, 3], [1, 4.9, 4], [0, 0.9, 5]], "제자리멀리뛰기": [[170.1, 9999, 1], [139.1, 170, 2], [123.1, 139, 3], [100.1, 123, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [36, 59, 2], [23, 35, 3], [7, 22, 4], [0, 6, 5]], "악력": [[29, 9999, 1], [19, 28.9, 2], [15.5, 18.9, 3], [12, 15.4, 4], [0, 11.9, 5]], "50m 달리기": [[0, 8.9, 1], [9, 9.9, 2], [10, 10.7, 3], [10.8, 13.3, 4], [13.4, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[350.1, 9999, 1], [300.1, 350, 2], [250.1, 300, 3], [200.1, 250, 4], [0, 200, 5]] },
        "초5": { "왕복오래달리기": [[50, 9999, 1], [40, 49, 2], [30, 39, 3], [20, 29, 4], [0, 19, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [7, 9.9, 2], [5, 6.9, 3], [1, 4.9, 4], [0, 0.9, 5]], "제자리멀리뛰기": [[170.1, 9999, 1], [139.1, 170, 2], [123.1, 139, 3], [100.1, 123, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [36, 59, 2], [23, 35, 3], [7, 22, 4], [0, 6, 5]], "악력": [[29, 9999, 1], [19, 28.9, 2], [15.5, 18.9, 3], [12, 15.4, 4], [0, 11.9, 5]], "50m 달리기": [[0, 8.9, 1], [9, 9.9, 2], [10, 10.7, 3], [10.8, 13.3, 4], [13.4, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[350.1, 9999, 1], [300.1, 350, 2], [250.1, 300, 3], [200.1, 250, 4], [0, 200, 5]] },
        "초6": { "왕복오래달리기": [[60, 9999, 1], [50, 59, 2], [40, 49, 3], [30, 39, 4], [0, 29, 5]], "앉아윗몸앞으로굽히기": [[14, 9999, 1], [10, 13.9, 2], [5, 9.9, 3], [2, 4.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[175.1, 9999, 1], [144.1, 175, 2], [127.1, 144, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [43, 59, 2], [23, 42, 3], [7, 22, 4], [0, 6, 5]], "악력": [[33, 9999, 1], [22, 32.9, 2], [19, 21.9, 3], [14, 18.9, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.9, 1], [9, 9.8, 2], [9.9, 10.7, 3], [10.8, 12.9, 4], [13, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[400.1, 9999, 1], [350.1, 400, 2], [300.1, 350, 3], [250.1, 300, 4], [0, 250, 5]] },
        "중1": { "왕복오래달리기": [[35, 9999, 1], [25, 34, 2], [19, 24, 3], [14, 18, 4], [0, 13, 5]], "앉아윗몸앞으로굽히기": [[15, 9999, 1], [11, 14.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[175.1, 9999, 1], [144.1, 175, 2], [127.1, 144, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[45, 9999, 1], [24, 44, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[58, 9999, 1], [43, 57, 2], [22, 42, 3], [7, 21, 4], [0, 6, 5]], "악력": [[36, 9999, 1], [23, 35.9, 2], [19, 22.9, 3], [14, 18.9, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.8, 2], [9.9, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "중2": { "왕복오래달리기": [[40, 9999, 1], [29, 39, 2], [21, 28, 3], [15, 20, 4], [0, 14, 5]], "앉아윗몸앞으로굽히기": [[15, 9999, 1], [11, 14.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[183.1, 9999, 1], [145.1, 183, 2], [127.1, 145, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[58, 9999, 1], [39, 57, 2], [19, 38, 3], [7, 18, 4], [0, 6, 5]], "악력": [[36, 9999, 1], [25.5, 35.9, 2], [19.5, 25.4, 3], [14, 19.4, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.8, 2], [9.9, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "중3": { "왕복오래달리기": [[45, 9999, 1], [33, 44, 2], [23, 32, 3], [16, 22, 4], [0, 15, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[183.1, 9999, 1], [145.1, 183, 2], [127.1, 145, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[52, 9999, 1], [34, 51, 2], [17, 33, 3], [6, 16, 4], [0, 5, 5]], "악력": [[36, 9999, 1], [27.5, 35.9, 2], [19.5, 27.4, 3], [16, 19.4, 4], [0, 15.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.8, 2], [9.9, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "고1": { "왕복오래달리기": [[50, 9999, 1], [37, 49, 2], [25, 36, 3], [17, 24, 4], [0, 16, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[36, 9999, 1], [29, 35.9, 2], [23, 28.9, 3], [16.5, 22.9, 4], [0, 16.4, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.8, 2], [9.9, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "고2": { "왕복오래달리기": [[55, 9999, 1], [41, 54, 2], [27, 40, 3], [18, 26, 4], [0, 17, 5]], "앉아윗몸앞으로굽히기": [[17, 9999, 1], [12, 16.9, 2], [9, 11.9, 3], [5, 8.9, 4], [0, 4.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [30, 39, 2], [18, 29, 3], [9, 17, 4], [0, 8, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[37.5, 9999, 1], [29.5, 37.4, 2], [25, 29.4, 3], [18, 24.9, 4], [0, 17.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.5, 2], [9.6, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] },
        "고3": { "왕복오래달리기": [[55, 9999, 1], [41, 54, 2], [27, 40, 3], [18, 26, 4], [0, 17, 5]], "앉아윗몸앞으로굽히기": [[17, 9999, 1], [12, 16.9, 2], [9, 11.9, 3], [5, 8.9, 4], [0, 4.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [30, 39, 2], [18, 29, 3], [9, 17, 4], [0, 8, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[37.5, 9999, 1], [29.5, 37.4, 2], [25, 29.4, 3], [18, 24.9, 4], [0, 17.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.9, 9.5, 2], [9.6, 10.5, 3], [10.6, 12.2, 4], [12.3, 9999, 5]], "오래달리기걷기": [[0, 10, 1], [11, 15, 2], [16, 20, 3], [21, 25, 4], [26, 9999, 5]], "스텝검사": [[100, 9999, 1], [90, 99, 2], [80, 89, 3], [70, 79, 4], [0, 69, 5]], "던지기": [[500.1, 9999, 1], [450.1, 500, 2], [400.1, 450, 3], [350.1, 400, 4], [0, 350, 5]] }
    },
    "BMI": {
        "남자": {
            "초4": [[16.8, 24.6, "정상"], [24.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "초5": [[17.3, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "초6": [[17.8, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중1": [[16.8, 24.6, "정상"], [24.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중2": [[17.3, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중3": [[17.8, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고1": [[16.8, 24.6, "정상"], [24.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고2": [[17.3, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고3": [[17.8, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]]
        },
        "여자": {
            "초4": [[16.8, 23.6, "정상"], [23.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "초5": [[17.3, 23.8, "정상"], [23.9, 24.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "초6": [[17.7, 23.9, "정상"], [24, 24.9, "과체중"], [0, 17.6, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중1": [[16.8, 23.6, "정상"], [23.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중2": [[17.3, 23.8, "정상"], [23.9, 24.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중3": [[17.7, 23.9, "정상"], [24, 24.9, "과체중"], [0, 17.6, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고1": [[16.8, 23.6, "정상"], [23.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고2": [[17.3, 23.8, "정상"], [23.9, 24.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고3": [[17.7, 23.9, "정상"], [24, 24.9, "과체중"], [0, 17.6, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]]
        }
    }
};
export class PapsManager {
    constructor(papsData, dataManager, saveDataToFirestore) {
        this.papsData = papsData;
        this.dataManager = dataManager;
        this.saveDataToFirestore = saveDataToFirestore;
    }
    /**
     * PAPS UI를 렌더링합니다.
     */
    renderPapsUI() {
        console.log('PAPS UI 렌더링 시작');
        const container = document.getElementById('papsContainer');
        if (!container)
            return;
        container.innerHTML = `
            <div class="paps-header">
                <h2>PAPS 수업 관리</h2>
                <div class="paps-controls">
                    <button onclick="window.papsManager.createPapsClass()" class="btn btn-primary">새 반 만들기</button>
                </div>
            </div>
            <div class="paps-content">
                <div class="paps-sidebar">
                    <h3>PAPS 반 목록</h3>
                    <div id="papsClassList"></div>
                </div>
                <div class="paps-main">
                    <div id="papsDashboard"></div>
                </div>
            </div>
        `;
        this.renderPapsClassList();
        this.renderPapsDashboard();
    }
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList() {
        const classList = document.getElementById('papsClassList');
        if (!classList)
            return;
        classList.innerHTML = '';
        this.papsData.classes.forEach(cls => {
            const div = document.createElement('div');
            div.className = `paps-class-item ${cls.id === this.papsData.activeClassId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="class-info">
                    <h4>${cls.name}</h4>
                    <p>학년: ${cls.gradeLevel}</p>
                    <p>학생 수: ${cls.students.length}명</p>
                </div>
                <div class="class-actions">
                    <button onclick="window.papsManager.selectPapsClass(${cls.id})" class="btn btn-sm">선택</button>
                    <button onclick="window.papsManager.editPapsClass(${cls.id})" class="btn btn-sm">편집</button>
                    <button onclick="window.papsManager.deletePapsClass(${cls.id})" class="btn btn-sm btn-danger">삭제</button>
                </div>
            `;
            classList.appendChild(div);
        });
    }
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard() {
        const dashboard = document.getElementById('papsDashboard');
        if (!dashboard)
            return;
        if (!this.papsData.activeClassId) {
            dashboard.innerHTML = '<p>PAPS 반을 선택해주세요.</p>';
            return;
        }
        const cls = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!cls)
            return;
        this.buildPapsTable(cls);
    }
    /**
     * PAPS 테이블을 구성합니다.
     */
    buildPapsTable(cls) {
        const dashboard = document.getElementById('papsDashboard');
        if (!dashboard)
            return;
        dashboard.innerHTML = `
            <div class="paps-table-header">
                <h3>${cls.name} PAPS 설정</h3>
                <div class="table-controls">
                    <span>학년: ${cls.gradeLevel}</span>
                    <button onclick="window.papsManager.addPapsStudent()" class="btn btn-primary">학생 추가</button>
                    <button onclick="window.papsManager.deleteSelectedPapsStudents()" class="btn btn-danger">선택 삭제</button>
                </div>
            </div>
            <div class="paps-table-container">
                <table class="paps-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="selectAll"></th>
                            <th>번호</th>
                            <th>이름</th>
                            <th>성별</th>
                            <th colspan="2">왕복오래달리기</th>
                            <th colspan="2">앉아윗몸앞으로굽히기</th>
                            <th colspan="4">악력</th>
                            <th colspan="2">제자리멀리뛰기</th>
                            <th colspan="4">체지방</th>
                            <th>종합 등급</th>
                        </tr>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th>기록</th>
                            <th>등급</th>
                            <th>기록</th>
                            <th>등급</th>
                            <th>왼손(kg)</th>
                            <th>왼손등급</th>
                            <th>오른손(kg)</th>
                            <th>오른손등급</th>
                            <th>기록</th>
                            <th>등급</th>
                            <th>신장(cm)</th>
                            <th>체중(kg)</th>
                            <th>BMI</th>
                            <th>등급</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="papsTableBody"></tbody>
                </table>
            </div>
            <div class="paps-table-footer">
                <button onclick="window.papsManager.renderPapsCharts()" class="btn btn-primary">그래프로 보기</button>
            </div>
        `;
        const body = document.getElementById('papsTableBody');
        if (!body)
            return;
        body.innerHTML = '';
        cls.students.forEach(student => {
            const tr = document.createElement('tr');
            tr.dataset.sid = student.id.toString();
            tr.innerHTML = `
                <td><input type="checkbox" class="student-checkbox"></td>
                <td><input type="number" class="number" value="${student.number}" min="1"></td>
                <td><input type="text" class="name" value="${student.name}"></td>
                <td>
                    <select class="gender">
                        <option value="남자" ${student.gender === '남자' ? 'selected' : ''}>남</option>
                        <option value="여자" ${student.gender === '여자' ? 'selected' : ''}>여</option>
                    </select>
                </td>
                <td><input type="number" class="rec" data-id="endurance" value="${student.records.endurance || ''}" step="0.1"></td>
                <td class="grade-cell" data-id="endurance"></td>
                <td><input type="number" class="rec" data-id="flexibility" value="${student.records.flexibility || ''}" step="0.1"></td>
                <td class="grade-cell" data-id="flexibility"></td>
                <td><input type="number" class="rec" data-id="strength_left" value="${student.records.strength_left || ''}" step="0.1"></td>
                <td class="grade-cell" data-id="strength_left"></td>
                <td><input type="number" class="rec" data-id="strength_right" value="${student.records.strength_right || ''}" step="0.1"></td>
                <td class="grade-cell" data-id="strength_right"></td>
                <td><input type="number" class="rec" data-id="power" value="${student.records.power || ''}" step="0.1"></td>
                <td class="grade-cell" data-id="power"></td>
                <td><input type="number" class="height" value="${student.records.height || ''}" step="0.1"></td>
                <td><input type="number" class="weight" value="${student.records.weight || ''}" step="0.1"></td>
                <td class="bmi-cell"></td>
                <td class="grade-cell" data-id="bodyfat"></td>
                <td class="overall-grade-cell"></td>
            `;
            body.appendChild(tr);
            this.updatePapsRowGrades(tr, cls);
        });
        body.addEventListener('input', e => this.onPapsInput(e, cls));
        body.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !e.target.matches('input'))
                return;
            e.preventDefault();
            const cell = e.target.closest('td');
            const row = e.target.closest('tr');
            if (!cell || !row)
                return;
            const idx = Array.from(row.children).indexOf(cell);
            const next = row.nextElementSibling;
            if (next) {
                const ncell = next.children[idx];
                const ninp = ncell?.querySelector('input');
                if (ninp) {
                    ninp.focus();
                    ninp.select();
                }
            }
        });
    }
    /**
     * PAPS 입력을 처리합니다.
     */
    onPapsInput(e, cls) {
        const target = e.target;
        const tr = target.closest('tr');
        if (!tr)
            return;
        const sid = Number(tr.dataset.sid);
        const st = cls.students.find(s => s.id === sid);
        if (!st) {
            return;
        }
        st.records = st.records || {};
        if (target.classList.contains('rec')) {
            st.records[target.dataset.id] = Number(target.value);
        }
        else if (target.classList.contains('height')) {
            st.records.height = Number(target.value);
        }
        else if (target.classList.contains('weight')) {
            st.records.weight = Number(target.value);
        }
        else if (target.classList.contains('name')) {
            st.name = target.value;
        }
        else if (target.classList.contains('number')) {
            st.number = Number(target.value);
        }
        else if (target.classList.contains('gender')) {
            st.gender = target.value;
        }
        this.updatePapsRowGrades(tr, cls);
        this.saveDataToFirestore();
    }
    /**
     * PAPS 행 등급을 업데이트합니다.
     */
    updatePapsRowGrades(tr, cls) {
        // BMI
        const h = parseFloat(tr.querySelector('.height')?.value || '');
        const w = parseFloat(tr.querySelector('.weight')?.value || '');
        const bmiCell = tr.querySelector('.bmi-cell');
        let bmi = null;
        if (h > 0 && w > 0) {
            const m = h / 100;
            bmi = w / (m * m);
            bmiCell.textContent = bmi.toFixed(2);
        }
        else {
            bmiCell.textContent = '';
        }
        // Each category
        const studentGender = tr.querySelector('.gender')?.value || '남자';
        const gradeLevel = cls.gradeLevel || '';
        tr.querySelectorAll('.grade-cell').forEach(td => {
            td.textContent = '';
            td.className = 'grade-cell';
        });
        console.log(`[PAPS 등급 업데이트] 학생 성별: ${studentGender}, 학년: ${gradeLevel}`);
        Object.keys(PAPS_ITEMS).forEach(k => {
            const id = PAPS_ITEMS[k].id;
            const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
            console.log(`[PAPS 등급 업데이트] 카테고리: ${k}, ID: ${id}, 이벤트명: ${eventName}`);
            if (id === 'bodyfat') {
                const value = bmi;
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = value ? this.calcPapsGrade(id, value, studentGender, gradeLevel, cls) : '';
                if (td) {
                    td.textContent = gradeText || '';
                    if (gradeText) {
                        td.classList.add(`grade-${gradeText}`);
                    }
                }
            }
            else if (eventName === '악력') {
                // 악력은 왼손과 오른손 각각 처리
                const leftValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_left"]`)?.value || '');
                const rightValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_right"]`)?.value || '');
                if (!isNaN(leftValue)) {
                    const leftGrade = this.calcPapsGrade(`${id}_left`, leftValue, studentGender, gradeLevel, cls);
                    const leftTd = tr.querySelector(`.grade-cell[data-id="${id}_left"]`);
                    if (leftTd) {
                        leftTd.textContent = leftGrade || '';
                        if (leftGrade)
                            leftTd.classList.add(`grade-${leftGrade}`);
                    }
                }
                if (!isNaN(rightValue)) {
                    const rightGrade = this.calcPapsGrade(`${id}_right`, rightValue, studentGender, gradeLevel, cls);
                    const rightTd = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                    if (rightTd) {
                        rightTd.textContent = rightGrade || '';
                        if (rightGrade)
                            rightTd.classList.add(`grade-${rightGrade}`);
                    }
                }
            }
            else {
                const value = parseFloat(tr.querySelector(`.rec[data-id="${id}"]`)?.value || '');
                console.log(`[PAPS 등급 업데이트] ${k} - 입력값: ${value}, isNaN: ${isNaN(value)}`);
                if (!isNaN(value)) {
                    const grade = this.calcPapsGrade(id, value, studentGender, gradeLevel, cls);
                    const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                    console.log(`[PAPS 등급 업데이트] ${k} - 계산된 등급: ${grade}, TD 요소:`, td);
                    if (td) {
                        td.textContent = grade || '';
                        if (grade)
                            td.classList.add(`grade-${grade}`);
                        console.log(`[PAPS 등급 업데이트] ${k} - UI 적용 완료: ${td.textContent}`);
                    }
                }
            }
        });
        // 종합 등급 계산
        const overallGrade = this.calcOverallGrade(tr);
        const overallTd = tr.querySelector('.overall-grade-cell');
        if (overallTd) {
            overallTd.textContent = overallGrade || '';
            if (overallGrade)
                overallTd.classList.add(`grade-${overallGrade}`);
        }
    }
    /**
     * PAPS 등급을 계산합니다.
     */
    calcPapsGrade(categoryId, value, gender, gradeLevel, cls) {
        console.log(`[calcPapsGrade 호출] categoryId: ${categoryId}, value: ${value}, gender: ${gender}, gradeLevel: ${gradeLevel}`);
        if (value == null || isNaN(value) || !gender || !gradeLevel) {
            console.log(`[calcPapsGrade 조기 종료] value: ${value}, gender: ${gender}, gradeLevel: ${gradeLevel}`);
            return '';
        }
        let selectedTest = null;
        if (categoryId === 'bodyfat') {
            selectedTest = 'BMI';
        }
        else {
            const baseCategoryId = /_(left|right)$/.test(categoryId)
                ? categoryId.replace(/_(left|right)$/, '')
                : categoryId;
            const catKey = Object.keys(PAPS_ITEMS).find(k => PAPS_ITEMS[k].id === baseCategoryId);
            const itemDef = catKey ? PAPS_ITEMS[catKey] : undefined;
            selectedTest = (cls.eventSettings?.[baseCategoryId]) || (itemDef ? itemDef.options[0] : null);
            if (!selectedTest)
                return '';
            if (selectedTest === '팔굽혀펴기' && gender === '여자')
                selectedTest = '무릎대고팔굽혀펴기';
        }
        let ranges;
        if (selectedTest === 'BMI') {
            ranges = PAPS_CRITERIA_DATA?.BMI?.[gender]?.[gradeLevel];
        }
        else {
            ranges = PAPS_CRITERIA_DATA?.[gender]?.[gradeLevel]?.[selectedTest];
            if (!ranges) {
                const genderCriteria = PAPS_CRITERIA_DATA?.[gender] || {};
                for (const anyGrade of Object.keys(genderCriteria)) {
                    const candidate = genderCriteria[anyGrade]?.[selectedTest];
                    if (candidate) {
                        ranges = candidate;
                        break;
                    }
                }
            }
        }
        if (!ranges)
            return '';
        // 디버깅을 위한 로그 추가
        console.log(`[PAPS 등급 계산] 종목: ${selectedTest}, 성별: ${gender}, 학년: ${gradeLevel}, 값: ${value}`);
        console.log(`[PAPS 등급 계산] 기준표:`, ranges);
        // 범위를 역순으로 확인 (높은 값부터 확인하여 최고 등급부터 매칭)
        for (let i = ranges.length - 1; i >= 0; i--) {
            const [a, b, g] = ranges[i];
            const min = Math.min(a, b), max = Math.max(a, b);
            console.log(`[PAPS 등급 계산] 범위 확인: ${min} <= ${value} <= ${max} ? ${value >= min && value <= max} → ${g}등급`);
            if (value >= min && value <= max)
                return typeof g === 'number' ? `${g}등급` : String(g);
        }
        return '';
    }
    /**
     * 전체 등급을 계산합니다.
     */
    calcOverallGrade(tr) {
        const grades = Array.from(tr.querySelectorAll('.grade-cell')).map(td => td.textContent).filter(g => g && g !== '');
        if (grades.length === 0)
            return '';
        // 등급별 점수 계산 (1등급=5점, 2등급=4점, ..., 5등급=1점)
        const gradeScores = grades.map(grade => {
            if (grade === '1등급')
                return 5;
            if (grade === '2등급')
                return 4;
            if (grade === '3등급')
                return 3;
            if (grade === '4등급')
                return 2;
            if (grade === '5등급')
                return 1;
            if (grade === '정상')
                return 4; // BMI 정상은 2등급 수준
            if (grade === '과체중')
                return 3; // BMI 과체중은 3등급 수준
            if (grade === '비만')
                return 1; // BMI 비만은 5등급 수준
            return 0;
        });
        const totalScore = gradeScores.reduce((sum, score) => sum + score, 0);
        const averageScore = totalScore / gradeScores.length;
        if (averageScore >= 4.5)
            return '1등급';
        if (averageScore >= 3.5)
            return '2등급';
        if (averageScore >= 2.5)
            return '3등급';
        if (averageScore >= 1.5)
            return '4등급';
        return '5등급';
    }
    /**
     * PAPS 반을 생성합니다.
     */
    createPapsClass() {
        const name = prompt('반 이름을 입력하세요:');
        if (!name)
            return;
        const gradeLevel = prompt('학년을 선택하세요 (초4, 초5, 초6, 중1, 중2, 중3, 고1, 고2, 고3):');
        if (!gradeLevel)
            return;
        const newClass = {
            id: Date.now(),
            name,
            gradeLevel,
            students: [],
            eventSettings: {
                endurance: '왕복오래달리기',
                flexibility: '앉아윗몸앞으로굽히기',
                strength: '악력',
                power: '제자리멀리뛰기'
            }
        };
        this.papsData.classes.push(newClass);
        this.papsData.activeClassId = newClass.id;
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 반을 편집합니다.
     */
    editPapsClass(classId) {
        const cls = this.papsData.classes.find(c => c.id === classId);
        if (!cls)
            return;
        const newName = prompt('새 반 이름을 입력하세요:', cls.name);
        if (newName) {
            cls.name = newName;
            this.saveDataToFirestore();
            this.renderPapsUI();
        }
    }
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(classId) {
        if (!confirm('정말로 이 반을 삭제하시겠습니까?'))
            return;
        this.papsData.classes = this.papsData.classes.filter(c => c.id !== classId);
        if (this.papsData.activeClassId === classId) {
            this.papsData.activeClassId = null;
        }
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(classId) {
        this.papsData.activeClassId = classId;
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent() {
        if (!this.papsData.activeClassId)
            return;
        const cls = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!cls)
            return;
        const name = prompt('학생 이름을 입력하세요:');
        if (!name)
            return;
        const gender = confirm('남학생입니까? (확인: 남학생, 취소: 여학생)') ? '남자' : '여자';
        const newStudent = {
            id: Date.now(),
            number: cls.students.length + 1,
            name,
            gender,
            records: {}
        };
        cls.students.push(newStudent);
        this.saveDataToFirestore();
        this.renderPapsDashboard();
    }
    /**
     * 선택된 PAPS 학생들을 삭제합니다.
     */
    deleteSelectedPapsStudents() {
        if (!this.papsData.activeClassId)
            return;
        const cls = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!cls)
            return;
        const checkboxes = document.querySelectorAll('.student-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('삭제할 학생을 선택해주세요.');
            return;
        }
        if (!confirm(`선택된 ${checkboxes.length}명의 학생을 삭제하시겠습니까?`))
            return;
        const selectedIds = Array.from(checkboxes).map(cb => Number(cb.closest('tr')?.dataset.sid));
        cls.students = cls.students.filter(s => !selectedIds.includes(s.id));
        this.saveDataToFirestore();
        this.renderPapsDashboard();
    }
    /**
     * PAPS 템플릿을 다운로드합니다.
     */
    papsDownloadTemplate() {
        // 템플릿 다운로드 로직
        console.log('PAPS 템플릿 다운로드');
    }
    /**
     * PAPS 설정을 저장합니다.
     */
    savePapsSettings() {
        // 설정 저장 로직
        console.log('PAPS 설정 저장');
    }
    /**
     * PAPS 설정을 표시합니다.
     */
    showPapsSettings() {
        // 설정 표시 로직
        console.log('PAPS 설정 표시');
    }
    /**
     * PAPS 학생 업로드를 처리합니다.
     */
    handlePapsStudentUpload() {
        // 학생 업로드 처리 로직
        console.log('PAPS 학생 업로드 처리');
    }
    /**
     * PAPS를 엑셀로 내보냅니다.
     */
    exportPapsToExcel() {
        // 엑셀 내보내기 로직
        console.log('PAPS 엑셀 내보내기');
    }
    /**
     * 모든 PAPS를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel() {
        // 모든 PAPS 엑셀 내보내기 로직
        console.log('모든 PAPS 엑셀 내보내기');
    }
    /**
     * PAPS 기록 업로드를 처리합니다.
     */
    handlePapsRecordUpload() {
        // 기록 업로드 처리 로직
        console.log('PAPS 기록 업로드 처리');
    }
    /**
     * 모든 PAPS 엑셀 업로드를 처리합니다.
     */
    handleAllPapsExcelUpload() {
        // 모든 PAPS 엑셀 업로드 처리 로직
        console.log('모든 PAPS 엑셀 업로드 처리');
    }
    /**
     * PAPS 차트를 렌더링합니다.
     */
    renderPapsCharts() {
        // 차트 렌더링 로직
        console.log('PAPS 차트 렌더링');
    }
}
//# sourceMappingURL=papsManager_new.js.map