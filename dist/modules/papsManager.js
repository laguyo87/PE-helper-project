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
// PAPS 평가 기준 데이터 (원본: main.js 의 papsCriteriaData 전체 이관)
const PAPS_CRITERIA_DATA = {
    "남자": {
        "초4": { "왕복오래달리기": [[96, 9999, 1], [69, 95, 2], [45, 68, 3], [26, 44, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "제자리멀리뛰기": [[170.1, 9999, 1], [149.1, 170, 2], [130.1, 149, 3], [100.1, 130, 4], [0, 100, 5]], "팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[80, 9999, 1], [40, 79, 2], [22, 39, 3], [7, 21, 4], [0, 6, 5]], "악력": [[31, 9999, 1], [18.5, 30.9, 2], [15, 18.4, 3], [11.5, 14.9, 4], [0, 11.4, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.7, 2], [9.71, 10.5, 3], [10.51, 13.2, 4], [13.21, 9999, 5]], "오래달리기걷기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[25, 9999, 1], [22, 24.9, 2], [19, 21.9, 3], [16, 18.9, 4], [0, 15.9, 5]] },
        "초5": { "왕복오래달리기": [[100, 9999, 1], [73, 99, 2], [50, 72, 3], [29, 49, 4], [0, 28, 5]], "앉아윗몸앞으로굽히기": [[8, 9999, 1], [5, 7.9, 2], [1, 4.9, 3], [-4, 0.9, 4], [-999, -4.1, 5]], "제자리멀리뛰기": [[180.1, 9999, 1], [159.1, 180, 2], [141.1, 159, 3], [111.1, 141, 4], [0, 111, 5]], "팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[80, 9999, 1], [40, 79, 2], [22, 39, 3], [10, 21, 4], [0, 9, 5]], "악력": [[31, 9999, 1], [23, 30.9, 2], [17, 22.9, 3], [12.5, 16.9, 4], [0, 12.4, 5]], "50m 달리기": [[0, 8.5, 1], [8.51, 9.4, 2], [9.41, 10.2, 3], [10.21, 13.2, 4], [13.21, 9999, 5]], "오래달리기걷기": [[0, 281, 1], [282, 324, 2], [325, 409, 3], [410, 479, 4], [480, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[28, 9999, 1], [25, 27.9, 2], [22, 24.9, 3], [19, 21.9, 4], [0, 18.9, 5]] },
        "초6": { "왕복오래달리기": [[104, 9999, 1], [78, 103, 2], [54, 77, 3], [32, 53, 4], [0, 31, 5]], "앉아윗몸앞으로굽히기": [[8, 9999, 1], [5, 7.9, 2], [1, 4.9, 3], [-4, 0.9, 4], [-999, -4.1, 5]], "제자리멀리뛰기": [[200.1, 9999, 1], [167.1, 200, 2], [148.1, 167, 3], [122.1, 148, 4], [0, 122, 5]], "팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[80, 9999, 1], [40, 79, 2], [22, 39, 3], [10, 21, 4], [0, 9, 5]], "악력": [[35, 9999, 1], [26.5, 34.9, 2], [19, 26.4, 3], [15, 18.9, 4], [0, 14.9, 5]], "50m 달리기": [[0, 8.1, 1], [8.11, 9.1, 2], [9.11, 10, 3], [10.01, 12.5, 4], [12.51, 9999, 5]], "오래달리기걷기": [[0, 250, 1], [251, 314, 2], [315, 379, 3], [380, 449, 4], [450, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[31, 9999, 1], [28, 30.9, 2], [25, 27.9, 3], [22, 24.9, 4], [0, 21.9, 5]] },
        "중1": { "왕복오래달리기": [[64, 9999, 1], [50, 63, 2], [36, 49, 3], [20, 35, 4], [0, 19, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [6, 9.9, 2], [2, 5.9, 3], [-4, 1.9, 4], [-999, -4.1, 5]], "제자리멀리뛰기": [[211.1, 9999, 1], [177.1, 211, 2], [159.1, 177, 3], [131.1, 159, 4], [0, 131, 5]], "팔굽혀펴기": [[34, 9999, 1], [25, 33, 2], [12, 24, 3], [4, 11, 4], [0, 3, 5]], "윗몸말아올리기": [[90, 9999, 1], [55, 89, 2], [33, 54, 3], [14, 32, 4], [0, 13, 5]], "악력": [[42, 9999, 1], [30, 41.9, 2], [22.5, 29.9, 3], [16.5, 22.4, 4], [0, 16.4, 5]], "50m 달리기": [[0, 7.5, 1], [7.51, 8.4, 2], [8.41, 9.3, 3], [9.31, 11.5, 4], [11.51, 9999, 5]], "오래달리기걷기": [[0, 425, 1], [426, 502, 2], [503, 599, 3], [600, 699, 4], [700, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[34, 9999, 1], [31, 33.9, 2], [28, 30.9, 3], [25, 27.9, 4], [0, 24.9, 5]] },
        "중2": { "왕복오래달리기": [[66, 9999, 1], [52, 65, 2], [38, 51, 3], [22, 37, 4], [0, 21, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [7, 9.9, 2], [2, 6.9, 3], [-4, 1.9, 4], [-999, -4.1, 5]], "제자리멀리뛰기": [[218.1, 9999, 1], [187.1, 218, 2], [169.1, 187, 3], [136.1, 169, 4], [0, 136, 5]], "팔굽혀펴기": [[34, 9999, 1], [25, 33, 2], [12, 24, 3], [4, 11, 4], [0, 3, 5]], "윗몸말아올리기": [[90, 9999, 1], [55, 89, 2], [33, 54, 3], [14, 32, 4], [0, 13, 5]], "악력": [[44.5, 9999, 1], [37, 44.4, 2], [28.5, 36.9, 3], [22, 28.4, 4], [0, 21.9, 5]], "50m 달리기": [[0, 7.3, 1], [7.31, 8.2, 2], [8.21, 9, 3], [9.01, 11.5, 4], [11.51, 9999, 5]], "오래달리기걷기": [[0, 416, 1], [417, 487, 2], [488, 583, 3], [584, 679, 4], [680, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[37, 9999, 1], [34, 36.9, 2], [31, 33.9, 3], [28, 30.9, 4], [0, 27.9, 5]] },
        "중3": { "왕복오래달리기": [[68, 9999, 1], [54, 67, 2], [40, 53, 3], [24, 39, 4], [0, 23, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [7, 9.9, 2], [2.6, 6.9, 3], [-3, 2.5, 4], [-999, -3.1, 5]], "제자리멀리뛰기": [[238.1, 9999, 1], [201.1, 238, 2], [180.1, 201, 3], [145.1, 180, 4], [0, 145, 5]], "팔굽혀펴기": [[34, 9999, 1], [25, 33, 2], [14, 24, 3], [4, 13, 4], [0, 3, 5]], "윗몸말아올리기": [[90, 9999, 1], [55, 89, 2], [33, 54, 3], [14, 32, 4], [0, 13, 5]], "악력": [[48.5, 9999, 1], [40.5, 48.4, 2], [33, 40.4, 3], [25, 32.9, 4], [0, 24.9, 5]], "50m 달리기": [[0, 7, 1], [7.01, 7.8, 2], [7.81, 8.5, 3], [8.51, 11, 4], [11.01, 9999, 5]], "오래달리기걷기": [[0, 407, 1], [408, 472, 2], [473, 567, 3], [568, 659, 4], [660, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[40, 9999, 1], [37, 39.9, 2], [34, 36.9, 3], [31, 33.9, 4], [0, 30.9, 5]] },
        "고1": { "왕복오래달리기": [[70, 9999, 1], [56, 69, 2], [42, 55, 3], [26, 41, 4], [0, 25, 5]], "앉아윗몸앞으로굽히기": [[13, 9999, 1], [9, 12.9, 2], [4, 8.9, 3], [-2, 3.9, 4], [-999, -2.1, 5]], "제자리멀리뛰기": [[255.1, 9999, 1], [216.1, 255, 2], [195.1, 216, 3], [160.1, 195, 4], [0, 160, 5]], "팔굽혀펴기": [[46, 9999, 1], [30, 45, 2], [16, 29, 3], [7, 15, 4], [0, 6, 5]], "윗몸말아올리기": [[90, 9999, 1], [60, 89, 2], [35, 59, 3], [15, 34, 4], [0, 14, 5]], "악력": [[61, 9999, 1], [42.5, 60.9, 2], [35.5, 42.4, 3], [29, 35.4, 4], [0, 28.9, 5]], "50m 달리기": [[0, 7, 1], [7.01, 7.6, 2], [7.61, 8.1, 3], [8.11, 10, 4], [10.01, 9999, 5]], "오래달리기걷기": [[0, 398, 1], [399, 457, 2], [458, 551, 3], [552, 639, 4], [640, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[43, 9999, 1], [40, 42.9, 2], [37, 39.9, 3], [34, 36.9, 4], [0, 33.9, 5]] },
        "고2": { "왕복오래달리기": [[72, 9999, 1], [58, 71, 2], [44, 57, 3], [28, 43, 4], [0, 27, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [5, 10.9, 3], [0.1, 4.9, 4], [0, 0, 5]], "제자리멀리뛰기": [[258.1, 9999, 1], [228.1, 258, 2], [212.1, 228, 3], [177.1, 212, 4], [0, 177, 5]], "팔굽혀펴기": [[50, 9999, 1], [42, 49, 2], [25, 41, 3], [11, 24, 4], [0, 10, 5]], "윗몸말아올리기": [[90, 9999, 1], [60, 89, 2], [35, 59, 3], [17, 34, 4], [0, 16, 5]], "악력": [[61, 9999, 1], [46, 60.9, 2], [39, 45.9, 3], [31, 38.9, 4], [0, 30.9, 5]], "50m 달리기": [[0, 6.7, 1], [6.71, 7.5, 2], [7.51, 7.9, 3], [7.91, 9.5, 4], [9.51, 9999, 5]], "오래달리기걷기": [[0, 389, 1], [390, 442, 2], [443, 535, 3], [536, 619, 4], [620, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[46, 9999, 1], [43, 45.9, 2], [40, 42.9, 3], [37, 39.9, 4], [0, 36.9, 5]] },
        "고3": { "왕복오래달리기": [[74, 9999, 1], [60, 73, 2], [46, 59, 3], [30, 45, 4], [0, 29, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [6, 10.9, 3], [0.1, 5.9, 4], [0, 0, 5]], "제자리멀리뛰기": [[264.1, 9999, 1], [243.1, 264, 2], [221.1, 243, 3], [185.1, 221, 4], [0, 185, 5]], "팔굽혀펴기": [[56, 9999, 1], [46, 55, 2], [30, 45, 3], [17, 29, 4], [0, 16, 5]], "윗몸말아올리기": [[90, 9999, 1], [60, 89, 2], [35, 59, 3], [17, 34, 4], [0, 16, 5]], "악력": [[63.5, 9999, 1], [46, 63.4, 2], [39, 45.9, 3], [31, 38.9, 4], [0, 30.9, 5]], "50m 달리기": [[0, 6.7, 1], [6.71, 7.5, 2], [7.51, 7.9, 3], [7.91, 8.7, 4], [8.71, 9999, 5]], "오래달리기걷기": [[0, 380, 1], [381, 427, 2], [428, 519, 3], [520, 599, 4], [600, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[49, 9999, 1], [46, 48.9, 2], [43, 45.9, 3], [40, 42.9, 4], [0, 39.9, 5]] }
    },
    "여자": {
        "초4": { "왕복오래달리기": [[77, 9999, 1], [57, 76, 2], [40, 56, 3], [21, 39, 4], [0, 20, 5]], "앉아윗몸앞으로굽히기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "제자리멀리뛰기": [[161.1, 9999, 1], [135.1, 161, 2], [119.1, 135, 3], [97.1, 119, 4], [0, 97, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [29, 59, 2], [18, 28, 3], [6, 17, 4], [0, 5, 5]], "악력": [[29, 9999, 1], [18, 28.9, 2], [13.5, 17.9, 3], [10.5, 13.4, 4], [0, 10.4, 5]], "50m 달리기": [[0, 9.4, 1], [9.41, 10.4, 2], [10.41, 11, 3], [11.01, 13.3, 4], [13.31, 9999, 5]], "오래달리기걷기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[20, 9999, 1], [17, 19.9, 2], [14, 16.9, 3], [11, 13.9, 4], [0, 10.9, 5]] },
        "초5": { "왕복오래달리기": [[85, 9999, 1], [63, 84, 2], [45, 62, 3], [23, 44, 4], [0, 22, 5]], "앉아윗몸앞으로굽히기": [[10, 9999, 1], [7, 9.9, 2], [5, 6.9, 3], [1, 4.9, 4], [0, 0.9, 5]], "제자리멀리뛰기": [[170.1, 9999, 1], [139.1, 170, 2], [123.1, 139, 3], [100.1, 123, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [36, 59, 2], [23, 35, 3], [7, 22, 4], [0, 6, 5]], "악력": [[29, 9999, 1], [19, 28.9, 2], [15.5, 18.9, 3], [12, 15.4, 4], [0, 11.9, 5]], "50m 달리기": [[0, 8.9, 1], [8.91, 9.9, 2], [9.91, 10.7, 3], [10.71, 13.3, 4], [13.31, 9999, 5]], "오래달리기걷기": [[0, 299, 1], [300, 359, 2], [360, 441, 3], [442, 501, 4], [502, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[23, 9999, 1], [20, 22.9, 2], [17, 19.9, 3], [14, 16.9, 4], [0, 13.9, 5]] },
        "초6": { "왕복오래달리기": [[93, 9999, 1], [69, 92, 2], [50, 68, 3], [25, 49, 4], [0, 24, 5]], "앉아윗몸앞으로굽히기": [[14, 9999, 1], [10, 13.9, 2], [5, 9.9, 3], [2, 4.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[175.1, 9999, 1], [144.1, 175, 2], [127.1, 144, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]], "윗몸말아올리기": [[60, 9999, 1], [43, 59, 2], [23, 42, 3], [7, 22, 4], [0, 6, 5]], "악력": [[33, 9999, 1], [22, 32.9, 2], [19, 21.9, 3], [14, 18.9, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.9, 1], [8.91, 9.8, 2], [9.81, 10.7, 3], [10.71, 12.9, 4], [12.91, 9999, 5]], "오래달리기걷기": [[0, 299, 1], [300, 353, 2], [354, 429, 3], [430, 479, 4], [480, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[26, 9999, 1], [23, 25.9, 2], [20, 22.9, 3], [17, 19.9, 4], [0, 16.9, 5]] },
        "중1": { "왕복오래달리기": [[35, 9999, 1], [25, 34, 2], [19, 24, 3], [14, 18, 4], [0, 13, 5]], "앉아윗몸앞으로굽히기": [[15, 9999, 1], [11, 14.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[175.1, 9999, 1], [144.1, 175, 2], [127.1, 144, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[45, 9999, 1], [24, 44, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[58, 9999, 1], [43, 57, 2], [22, 42, 3], [7, 21, 4], [0, 6, 5]], "악력": [[36, 9999, 1], [23, 35.9, 2], [19, 22.9, 3], [14, 18.9, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.8, 2], [9.81, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[29, 9999, 1], [26, 28.9, 2], [23, 25.9, 3], [20, 22.9, 4], [0, 19.9, 5]] },
        "중2": { "왕복오래달리기": [[40, 9999, 1], [29, 39, 2], [21, 28, 3], [15, 20, 4], [0, 14, 5]], "앉아윗몸앞으로굽히기": [[15, 9999, 1], [11, 14.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[183.1, 9999, 1], [145.1, 183, 2], [127.1, 145, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[58, 9999, 1], [39, 57, 2], [19, 38, 3], [7, 18, 4], [0, 6, 5]], "악력": [[36, 9999, 1], [25.5, 35.9, 2], [19.5, 25.4, 3], [14, 19.4, 4], [0, 13.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.8, 2], [9.81, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[32, 9999, 1], [29, 31.9, 2], [26, 28.9, 3], [23, 25.9, 4], [0, 22.9, 5]] },
        "중3": { "왕복오래달리기": [[45, 9999, 1], [33, 44, 2], [23, 32, 3], [16, 22, 4], [0, 15, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[183.1, 9999, 1], [145.1, 183, 2], [127.1, 145, 3], [100.1, 127, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[52, 9999, 1], [34, 51, 2], [17, 33, 3], [6, 16, 4], [0, 5, 5]], "악력": [[36, 9999, 1], [27.5, 35.9, 2], [19.5, 27.4, 3], [16, 19.4, 4], [0, 15.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.8, 2], [9.81, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[35, 9999, 1], [32, 34.9, 2], [29, 31.9, 3], [26, 28.9, 4], [0, 25.9, 5]] },
        "고1": { "왕복오래달리기": [[50, 9999, 1], [37, 49, 2], [25, 36, 3], [17, 24, 4], [0, 16, 5]], "앉아윗몸앞으로굽히기": [[16, 9999, 1], [11, 15.9, 2], [8, 10.9, 3], [2, 7.9, 4], [0, 1.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [24, 39, 2], [14, 23, 3], [6, 13, 4], [0, 5, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[36, 9999, 1], [29, 35.9, 2], [23, 28.9, 3], [16.5, 22.9, 4], [0, 16.4, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.8, 2], [9.81, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[38, 9999, 1], [35, 37.9, 2], [32, 34.9, 3], [29, 31.9, 4], [0, 28.9, 5]] },
        "고2": { "왕복오래달리기": [[55, 9999, 1], [41, 54, 2], [27, 40, 3], [18, 26, 4], [0, 17, 5]], "앉아윗몸앞으로굽히기": [[17, 9999, 1], [12, 16.9, 2], [9, 11.9, 3], [5, 8.9, 4], [0, 4.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [30, 39, 2], [18, 29, 3], [9, 17, 4], [0, 8, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[37.5, 9999, 1], [29.5, 37.4, 2], [25, 29.4, 3], [18, 24.9, 4], [0, 17.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.5, 2], [9.51, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[41, 9999, 1], [38, 40.9, 2], [35, 37.9, 3], [32, 34.9, 4], [0, 31.9, 5]] },
        "고3": { "왕복오래달리기": [[55, 9999, 1], [41, 54, 2], [27, 40, 3], [18, 26, 4], [0, 17, 5]], "앉아윗몸앞으로굽히기": [[17, 9999, 1], [12, 16.9, 2], [9, 11.9, 3], [5, 8.9, 4], [0, 4.9, 5]], "제자리멀리뛰기": [[186.1, 9999, 1], [159.1, 186, 2], [139.1, 159, 3], [100.1, 139, 4], [0, 100, 5]], "무릎대고팔굽혀펴기": [[40, 9999, 1], [30, 39, 2], [18, 29, 3], [9, 17, 4], [0, 8, 5]], "윗몸말아올리기": [[40, 9999, 1], [30, 39, 2], [13, 29, 3], [4, 12, 4], [0, 3, 5]], "악력": [[37.5, 9999, 1], [29.5, 37.4, 2], [25, 29.4, 3], [18, 24.9, 4], [0, 17.9, 5]], "50m 달리기": [[0, 8.8, 1], [8.81, 9.5, 2], [9.51, 10.5, 3], [10.51, 12.2, 4], [12.21, 9999, 5]], "오래달리기걷기": [[0, 379, 1], [380, 442, 2], [443, 517, 3], [518, 608, 4], [609, 9999, 5]], "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]], "던지기": [[44, 9999, 1], [41, 43.9, 2], [38, 40.9, 3], [35, 37.9, 4], [0, 34.9, 5]] }
    },
    "BMI": {
        "남자": {
            "초4": [[14.1, 20.1, "정상"], [20.2, 22.3, "과체중"], [0, 14, "마름"], [22.4, 24.7, "경도비만"], [24.8, 9999, "고도비만"]],
            "초5": [[14.4, 20.9, "정상"], [21, 23.2, "과체중"], [0, 14.3, "마름"], [23.3, 25.8, "경도비만"], [25.9, 9999, "고도비만"]],
            "초6": [[15, 21.7, "정상"], [21.8, 24, "과체중"], [0, 14.9, "마름"], [24.1, 26.8, "경도비만"], [26.9, 9999, "고도비만"]],
            "중1": [[15.4, 23.2, "정상"], [23.3, 24.9, "과체중"], [0, 15.3, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중2": [[15.8, 23.8, "정상"], [23.9, 24.9, "과체중"], [0, 15.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중3": [[16.3, 24.3, "정상"], [24.4, 24.9, "과체중"], [0, 16.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고1": [[16.8, 24.6, "정상"], [24.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고2": [[17.3, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고3": [[17.8, 24.9, "정상"], [25, 29.9, "과체중"], [0, 17.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]]
        },
        "여자": {
            "초4": [[13.9, 19.9, "정상"], [20, 22.1, "과체중"], [0, 13.8, "마름"], [22.2, 24.7, "경도비만"], [24.8, 9999, "고도비만"]],
            "초5": [[14.2, 20.8, "정상"], [20.9, 23.2, "과체중"], [0, 14.1, "마름"], [23.3, 25.8, "경도비만"], [25.9, 9999, "고도비만"]],
            "초6": [[14.8, 21.8, "정상"], [21.9, 24.2, "과체중"], [0, 14.7, "마름"], [24.3, 26.8, "경도비만"], [26.9, 9999, "고도비만"]],
            "중1": [[15.2, 22.1, "정상"], [22.2, 24.7, "과체중"], [0, 15.1, "마름"], [24.8, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중2": [[15.7, 22.7, "정상"], [22.8, 24.9, "과체중"], [0, 15.6, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "중3": [[16.3, 23.2, "정상"], [23.3, 24.9, "과체중"], [0, 16.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고1": [[16.8, 23.6, "정상"], [23.7, 24.9, "과체중"], [0, 16.7, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고2": [[17.3, 23.8, "정상"], [23.9, 24.9, "과체중"], [0, 17.2, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]],
            "고3": [[17.7, 23.9, "정상"], [24, 24.9, "과체중"], [0, 17.6, "마름"], [25, 29.9, "경도비만"], [30, 9999, "고도비만"]]
        }
    }
};
export class PapsManager {
    constructor(papsData, $, saveDataToFirestore, cleanupSidebar) {
        this.papsData = papsData;
        this.$ = $;
        this.saveDataToFirestore = saveDataToFirestore;
        this.cleanupSidebar = cleanupSidebar;
    }
    /**
     * PAPS UI를 렌더링합니다.
     */
    renderPapsUI() {
        // 기존 요소들 정리
        this.cleanupSidebar();
        this.$('#sidebarTitle').textContent = 'PAPS 반 목록';
        const formHtml = `
            <div class="sidebar-form-group">
                <input id="papsClassName" type="text" placeholder="새로운 반 이름">
                <button onclick="papsManager.createPapsClass()" class="btn primary" data-tooltip="새로운 반을 추가합니다.">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>`;
        this.$('#sidebar-form-container').innerHTML = formHtml;
        this.renderPapsClassList();
        const selected = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!selected) {
            this.$('#content-wrapper').innerHTML = `
                <div class="placeholder-view"><div class="placeholder-content">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/></svg>
                    <h3>PAPS 반을 선택하거나 추가하세요</h3>
                    <p>왼쪽에서 반을 선택하거나 생성해주세요.</p>
                </div></div>`;
        }
        else {
            this.renderPapsDashboard(selected);
        }
        // PAPS 엑셀 버튼 이벤트 리스너 (중복 방지)
        const exportBtn = this.$('#exportAllPapsBtn');
        if (exportBtn && !exportBtn.dataset.listenerAdded) {
            exportBtn.addEventListener('click', () => this.exportAllPapsToExcel());
            exportBtn.dataset.listenerAdded = 'true';
        }
        const importInput = this.$('#importAllPapsExcel');
        if (importInput && !importInput.dataset.listenerAdded) {
            importInput.addEventListener('change', (e) => this.handleAllPapsExcelUpload(e));
            importInput.dataset.listenerAdded = 'true';
        }
    }
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList() {
        this.$('#sidebar-list-container').innerHTML = this.papsData.classes.map(c => `
            <div class="list-card ${c.id === this.papsData.activeClassId ? 'active' : ''}" onclick="papsManager.selectPapsClass(${c.id})">
                <div style="flex-grow:1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${(c.students || []).length}명 · ${c.gradeLevel || '학년 미설정'}</div>
                </div>
                <div class="action-buttons row">
                    <button onclick="event.stopPropagation(); papsManager.showPapsSettings()" data-tooltip="설정 수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); papsManager.editPapsClass(${c.id})" data-tooltip="반 편집"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); papsManager.deletePapsClass(${c.id})" data-tooltip="반 삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg></button>
                </div>
            </div>
        `).join('');
    }
    /**
     * PAPS 반을 생성합니다.
     */
    createPapsClass() {
        const name = this.$('#papsClassName').value.trim();
        if (!name)
            return;
        const id = Date.now();
        this.papsData.classes.push({
            id,
            name,
            gradeLevel: '1학년',
            students: []
        });
        this.$('#papsClassName').value = '';
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 반을 편집합니다.
     */
    editPapsClass(id) {
        const cls = this.papsData.classes.find(c => c.id === id);
        if (!cls)
            return;
        const newName = prompt('반 이름을 입력하세요:', cls.name);
        if (newName && newName.trim() && newName.trim() !== cls.name) {
            cls.name = newName.trim();
            this.saveDataToFirestore();
            this.renderPapsUI();
        }
    }
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(id) {
        if (!confirm('정말로 이 반을 삭제하시겠습니까?'))
            return;
        this.papsData.classes = this.papsData.classes.filter(c => c.id !== id);
        if (this.papsData.activeClassId === id) {
            this.papsData.activeClassId = null;
        }
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(id) {
        this.papsData.activeClassId = id;
        this.saveDataToFirestore();
        this.renderPapsUI();
    }
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard(cls) {
        // 설정이 완료되었는지 확인 (학년과 이벤트 설정이 모두 있는지)
        const hasSettings = cls.gradeLevel && cls.eventSettings &&
            Object.keys(cls.eventSettings).length > 0;
        // 설정 컨테이너를 항상 표시하도록 수정 (설정이 완료된 경우에는 숨김)
        let settingsCardHtml = `
            <div class="card" style="margin-bottom: 2rem; ${hasSettings ? 'display: none;' : ''}">
                <div class="card-header">
                    <div class="paps-toolbar" style="justify-content: space-between;">
                        <h3 style="margin: 0;">PAPS 설정</h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn primary" id="paps-save-settings-btn">설정 저장</button>
                            <button class="btn" id="paps-download-template-btn">학생 명렬표 양식</button>
                            <input type="file" id="paps-student-upload" class="hidden" accept=".xlsx,.xls,.csv"/>
                            <button class="btn primary" id="paps-load-list-btn">명렬표 불러오기</button>
                    </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="paps-grid">
                        <div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">학년 설정</label>
                            <select id="paps-grade-select">
                                <option value="">학년 선택</option>
                                <option value="초4">초4</option><option value="초5">초5</option><option value="초6">초6</option>
                                <option value="중1">중1</option><option value="중2">중2</option><option value="중3">중3</option>
                                <option value="고1">고1</option><option value="고2">고2</option><option value="고3">고3</option>
                            </select>
                        </div>
                        ${Object.keys(PAPS_ITEMS).filter(k => k !== "체지방").map(category => {
            const item = PAPS_ITEMS[category];
            const current = cls.eventSettings?.[item.id] || item.options[0];
            return `<div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">${category}</label><select data-paps-category="${item.id}">${item.options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
        }).join('')}
                            </div>
                        </div>
            </div>`;
        this.$('#content-wrapper').innerHTML = `
            <div class="paps-toolbar">
                <h2 style="margin:0;">${cls.name} PAPS 설정</h2>
                <div class="row">
                    <span class="paps-chip">학년: ${cls.gradeLevel || '미설정'}</span>
                        </div>
                    </div>
            ${settingsCardHtml}
            <section class="section-box">
                <div class="paps-toolbar">
                    <h2 style="margin:0;">기록 입력</h2>
                    <div class="row">
                        <button class="btn" id="paps-add-student-btn">학생 추가</button>
                        <button class="btn danger" id="paps-delete-selected-btn">선택 삭제</button>
                </div>
                        </div>
                <div class="paps-table-wrap">
                    <table id="paps-record-table" class="styled-table">
                            <thead id="paps-record-head"></thead>
                            <tbody id="paps-record-body"></tbody>
                        </table>
                    </div>
            </section>
            
            <!-- 나의 기록 랭킹 섹션 -->
            <section class="section-box">
                <div class="paps-toolbar">
                    <h2 style="margin:0;">우리 학교에서 나의 랭킹 기록</h2>
                </div>
                <div class="ranking-controls" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                    <div class="form-group">
                        <label>종목</label>
                        <select id="ranking-event-select">
                            <option value="">종목 선택</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>학년</label>
                        <select id="ranking-grade-select">
                            <option value="">학년 선택</option>
                            <option value="초4">초4</option>
                            <option value="초5">초5</option>
                            <option value="초6">초6</option>
                            <option value="중1">중1</option>
                            <option value="중2">중2</option>
                            <option value="중3">중3</option>
                            <option value="고1">고1</option>
                            <option value="고2">고2</option>
                            <option value="고3">고3</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>성별</label>
                        <select id="ranking-gender-select">
                            <option value="">성별 선택</option>
                            <option value="남자">남자</option>
                            <option value="여자">여자</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>이름 (선택사항)</label>
                        <input type="text" id="ranking-name-input" placeholder="학생 이름 입력">
                    </div>
                    <div class="form-group" style="align-self: end;">
                        <button class="btn primary" id="ranking-search-btn">랭킹 조회</button>
                    </div>
                </div>
            <div id="ranking-results" style="display: none;">
                <div class="ranking-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div class="stat-card" id="personal-rank-card" style="display: none;">
                        <div class="stat-label">나의 순위</div>
                        <div class="stat-value" id="personal-rank">-</div>
                    </div>
                    <div class="stat-card" id="personal-percentile-card" style="display: none;">
                        <div class="stat-label">상위 %</div>
                        <div class="stat-value" id="personal-percentile">-</div>
                    </div>
                </div>
                <div class="ranking-content-container">
                    <div class="ranking-table-container">
                        <div class="ranking-table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <h3 style="margin: 0;">순위표</h3>
                                <span id="avg-record-display" style="font-size: 14px; color: #666; font-weight: 500;">평균 기록: -</span>
                            </div>
                            <div class="pagination-controls" style="display: flex; gap: 8px; align-items: center;">
                                <button id="prev-page" class="btn btn-sm" style="display: none;">이전</button>
                                <span id="page-info" style="font-size: 14px; color: #666;"></span>
                                <button id="next-page" class="btn btn-sm" style="display: none;">다음</button>
                                <div class="dropdown" style="margin-left: 8px;">
                                    <button id="share-btn" class="btn btn-sm" style="background-color: #28a745; color: white;">
                                        📤 공유
                                    </button>
                                    <div id="share-menu" class="dropdown-menu" style="display: none; position: absolute; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px;">
                                        <button id="realtime-share-btn" class="dropdown-item" style="display: block; width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; cursor: pointer;">🔗 실시간 공유</button>
                                        <div style="border-top: 1px solid #eee; margin: 4px 0;"></div>
                                        <button id="copy-text-btn" class="dropdown-item" style="display: block; width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; cursor: pointer;">📋 텍스트 복사</button>
                                        <button id="copy-image-btn" class="dropdown-item" style="display: block; width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; cursor: pointer;">🖼️ 이미지 저장</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped" id="ranking-table">
                                <thead>
                                    <tr>
                                        <th style="width: 80px;">순위</th>
                                        <th style="width: 200px;">이름</th>
                                        <th style="width: 120px;">기록</th>
                                        <th style="width: 100px;">상위%</th>
                                    </tr>
                                </thead>
                                <tbody id="ranking-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="ranking-chart-container">
                        <canvas id="ranking-distribution-chart" width="500" height="500"></canvas>
                    </div>
                </div>
            </div>
            </section>
        `;
        // Wire up selectors and actions
        // 설정 관련 이벤트 리스너 항상 추가
        this.$('#paps-grade-select').value = cls.gradeLevel || '';
        this.$('#content-wrapper').querySelectorAll('select[data-paps-category]').forEach(sel => {
            sel.addEventListener('change', e => {
                const target = e.target;
                if (!cls.eventSettings)
                    cls.eventSettings = {};
                cls.eventSettings[target.dataset.papsCategory] = target.value;
                this.saveDataToFirestore();
                this.buildPapsTable(cls);
            });
        });
        this.$('#paps-grade-select').addEventListener('change', e => {
            const target = e.target;
            cls.gradeLevel = target.value;
            this.saveDataToFirestore();
            this.buildPapsTable(cls);
            // 좌측 사이드바의 반 카드도 실시간으로 업데이트
            this.renderPapsClassList();
        });
        this.$('#paps-download-template-btn').addEventListener('click', () => this.papsDownloadTemplate());
        this.$('#paps-load-list-btn').addEventListener('click', () => this.$('#paps-student-upload').click());
        this.$('#paps-student-upload').addEventListener('change', e => this.handlePapsStudentUpload(e, cls));
        // 설정 저장 버튼 이벤트 리스너
        const saveSettingsBtn = this.$('#paps-save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.savePapsSettings());
        }
        this.$('#paps-add-student-btn').addEventListener('click', () => {
            this.addPapsStudent(cls);
            this.buildPapsTable(cls);
            this.saveDataToFirestore();
        });
        this.$('#paps-delete-selected-btn').addEventListener('click', () => this.deleteSelectedPapsStudents(cls));
        // 랭킹 조회 기능 이벤트 리스너
        this.setupRankingControls(cls);
        this.buildPapsTable(cls);
    }
    /**
     * PAPS 테이블을 구성합니다.
     */
    buildPapsTable(cls) {
        const head = this.$('#paps-record-head');
        const body = this.$('#paps-record-body');
        // Header build
        let header1 = '<tr><th rowspan="2"><input type="checkbox" id="paps-select-all"></th><th rowspan="2">번호</th><th rowspan="2">이름</th><th rowspan="2">성별</th>';
        let header2 = '<tr>';
        Object.keys(PAPS_ITEMS).filter(k => k !== "체지방").forEach(category => {
            const item = PAPS_ITEMS[category];
            let eventName = cls.eventSettings?.[item.id] || item.options[0];
            // 성별에 따라 팔굽혀펴기 종목명 변경
            if (eventName === '팔굽혀펴기') {
                eventName = '팔굽혀펴기/무릎대고 팔굽혀펴기';
            }
            // 악력 종목은 왼손/오른손으로 분리
            if (eventName === '악력') {
                header1 += `<th colspan="4">${eventName}</th>`;
                header2 += '<th>왼손(kg)</th><th>왼손등급</th><th>오른손(kg)</th><th>오른손등급</th>';
            }
            else {
                header1 += `<th colspan="2">${eventName}</th>`;
                header2 += '<th>기록</th><th>등급</th>';
            }
        });
        header1 += '<th colspan="4">체지방</th>';
        header2 += '<th>신장(cm)</th><th>체중(kg)</th><th>BMI</th><th>등급</th>';
        header1 += '<th rowspan="2">종합 등급</th></tr>';
        header2 += '</tr>';
        head.innerHTML = header1 + header2;
        this.$('#paps-select-all').addEventListener('change', function () {
            body.querySelectorAll('.paps-row-checkbox').forEach(cb => cb.checked = this.checked);
        });
        // Body
        body.innerHTML = '';
        const students = (cls.students || []).slice();
        // number가 없는 학생들에게 자동으로 번호 할당
        students.forEach((st, index) => {
            if (!st.number) {
                st.number = index + 1;
                console.log(`[PAPS 테이블] 학생 ${st.id}에게 번호 ${st.number} 할당`);
            }
        });
        students.sort((a, b) => (a.number || 0) - (b.number || 0));
        console.log('[PAPS 테이블] 학생 데이터:', students.map(s => ({ id: s.id, number: s.number, name: s.name })));
        students.forEach(st => {
            const tr = document.createElement('tr');
            tr.dataset.sid = st.id.toString();
            console.log(`[PAPS 테이블] 학생 ${st.id}: number=${st.number}, name=${st.name}`);
            tr.innerHTML = `
                <td><input type="checkbox" class="paps-row-checkbox"></td>
                <td><input type="number" class="paps-input number" value="${st.number || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td><input type="text" class="paps-input name" value="${st.name || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td><select class="paps-input gender" onchange="window.papsManager.onPapsInput(event, ${cls.id})"><option value="남자" ${st.gender === '남자' ? 'selected' : ''}>남</option><option value="여자" ${st.gender === '여자' ? 'selected' : ''}>여</option></select></td>
                ${Object.keys(PAPS_ITEMS).filter(k => k !== "체지방").map(k => {
                const id = PAPS_ITEMS[k].id;
                const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
                // 악력 종목은 왼손/오른손으로 분리
                if (eventName === '악력') {
                    const leftVal = (st.records || {})[`${id}_left`] || '';
                    const rightVal = (st.records || {})[`${id}_right`] || '';
                    return `<td><input type="number" step="any" class="paps-input rec" data-id="${id}_left" value="${leftVal}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td><td class="grade-cell" data-id="${id}_left"></td><td><input type="number" step="any" class="paps-input rec" data-id="${id}_right" value="${rightVal}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td><td class="grade-cell" data-id="${id}_right"></td>`;
                }
                else {
                    const val = (st.records || {})[id] || '';
                    return `<td><input type="number" step="any" class="paps-input rec" data-id="${id}" value="${val}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td><td class="grade-cell" data-id="${id}"></td>`;
                }
            }).join('')}
                <td><input type="number" step="any" class="paps-input height" value="${(st.records || {}).height || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td><input type="number" step="any" class="paps-input weight" value="${(st.records || {}).weight || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
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
                        if (leftGrade) {
                            // 기존 등급 클래스 제거
                            leftTd.classList.remove('grade-1등급', 'grade-2등급', 'grade-3등급', 'grade-4등급', 'grade-5등급');
                            // 새로운 등급 클래스 추가 (숫자만 추출)
                            const gradeNumber = leftGrade.replace('등급', '');
                            leftTd.classList.add(`grade-${gradeNumber}`);
                        }
                    }
                }
                if (!isNaN(rightValue)) {
                    const rightGrade = this.calcPapsGrade(`${id}_right`, rightValue, studentGender, gradeLevel, cls);
                    const rightTd = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                    if (rightTd) {
                        rightTd.textContent = rightGrade || '';
                        if (rightGrade) {
                            // 기존 등급 클래스 제거
                            rightTd.classList.remove('grade-1등급', 'grade-2등급', 'grade-3등급', 'grade-4등급', 'grade-5등급');
                            // 새로운 등급 클래스 추가 (숫자만 추출)
                            const gradeNumber = rightGrade.replace('등급', '');
                            rightTd.classList.add(`grade-${gradeNumber}`);
                        }
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
                        if (grade) {
                            // 기존 등급 클래스 제거
                            td.classList.remove('grade-1등급', 'grade-2등급', 'grade-3등급', 'grade-4등급', 'grade-5등급');
                            // 새로운 등급 클래스 추가 (숫자만 추출)
                            const gradeNumber = grade.replace('등급', '');
                            td.classList.add(`grade-${gradeNumber}`);
                        }
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
            if (overallGrade) {
                // 기존 등급 클래스 제거
                overallTd.classList.remove('grade-1등급', 'grade-2등급', 'grade-3등급', 'grade-4등급', 'grade-5등급');
                // 새로운 등급 클래스 추가 (숫자만 추출)
                const gradeNumber = overallGrade.replace('등급', '');
                overallTd.classList.add(`grade-${gradeNumber}`);
            }
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
        const averageScore = gradeScores.reduce((sum, score) => sum + score, 0) / gradeScores.length;
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
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent(cls) {
        const id = Date.now();
        cls.students.push({
            id,
            number: (cls.students?.length || 0) + 1,
            name: '',
            gender: '남자',
            records: {}
        });
    }
    /**
     * 선택된 PAPS 학생을 삭제합니다.
     */
    deleteSelectedPapsStudents(cls) {
        const rows = Array.from(this.$('#paps-record-body').querySelectorAll('tr'));
        const keep = [];
        rows.forEach(r => {
            const checked = r.querySelector('.paps-row-checkbox')?.checked;
            const sid = Number(r.dataset.sid);
            if (!checked)
                keep.push(sid);
        });
        cls.students = (cls.students || []).filter(s => keep.includes(s.id));
        this.buildPapsTable(cls);
        this.saveDataToFirestore();
    }
    /**
     * PAPS 템플릿을 다운로드합니다.
     */
    papsDownloadTemplate() {
        // XLSX 라이브러리가 필요합니다
        if (typeof window !== 'undefined' && window.XLSX) {
            const wb = window.XLSX.utils.book_new();
            const ws = window.XLSX.utils.aoa_to_sheet([
                ["번호", "이름", "성별"],
                [1, '김체육', '남자'],
                [2, '박건강', '여자']
            ]);
            ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 8 }];
            window.XLSX.utils.book_append_sheet(wb, ws, '학생 명렬표');
            window.XLSX.writeFile(wb, 'PAPS_학생명렬표_양식.xlsx');
        }
        else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }
    /**
     * PAPS 설정을 저장합니다.
     */
    savePapsSettings() {
        // 설정이 이미 저장되어 있으므로 추가 작업 불필요
        alert('설정이 저장되었습니다.');
        // 설정 저장 후 설정 컨테이너 숨기기
        const settingsCard = this.$('#content-wrapper').querySelector('.card');
        if (settingsCard) {
            settingsCard.style.display = 'none';
        }
    }
    /**
     * PAPS 설정을 표시합니다.
     */
    showPapsSettings() {
        // 설정 컨테이너 다시 표시
        const settingsCard = this.$('#content-wrapper').querySelector('.card');
        if (settingsCard) {
            settingsCard.style.display = 'block';
        }
    }
    /**
     * 랭킹 조회 컨트롤을 설정합니다.
     */
    setupRankingControls(cls) {
        // 종목 선택 옵션 채우기
        const eventSelect = this.$('#ranking-event-select');
        if (eventSelect) {
            Object.keys(PAPS_ITEMS).forEach(category => {
                const item = PAPS_ITEMS[category];
                const eventName = cls.eventSettings?.[item.id] || item.options[0];
                eventSelect.innerHTML += `<option value="${item.id}">${eventName}</option>`;
            });
        }
        // 랭킹 조회 버튼 이벤트 리스너
        const searchBtn = this.$('#ranking-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchRanking(cls));
        }
    }
    /**
     * 랭킹을 조회합니다.
     */
    searchRanking(cls) {
        const eventId = this.$('#ranking-event-select').value;
        const grade = this.$('#ranking-grade-select').value;
        const gender = this.$('#ranking-gender-select').value;
        const studentName = this.$('#ranking-name-input').value.trim();
        if (!eventId || !grade || !gender) {
            alert('종목, 학년, 성별을 모두 선택해주세요.');
            return;
        }
        // 해당 조건에 맞는 학생들의 기록 수집 (이름과 함께)
        const recordsWithNames = [];
        let personalRecord = null;
        this.papsData.classes.forEach(c => {
            if (c.gradeLevel === grade) {
                c.students.forEach(student => {
                    if (student.gender === gender) {
                        const record = student.records?.[eventId];
                        // 유효한 숫자인지 더 엄격하게 검증
                        if (record !== undefined && record !== null &&
                            typeof record === 'number' && !isNaN(record) &&
                            isFinite(record) && record > 0) {
                            recordsWithNames.push({ record, name: student.name });
                            // 개인 기록이 있는 경우
                            if (studentName && student.name === studentName) {
                                personalRecord = record;
                            }
                        }
                    }
                });
            }
        });
        if (recordsWithNames.length === 0) {
            alert('해당 조건에 맞는 기록이 없습니다.');
            return;
        }
        // 디버깅: 수집된 데이터 확인
        console.log('수집된 기록 데이터:', recordsWithNames);
        // 통계 계산
        const records = recordsWithNames.map(item => item.record);
        records.sort((a, b) => b - a); // 내림차순 정렬 (높은 기록이 좋은 경우)
        // 디버깅: 정렬된 기록 확인
        console.log('정렬된 기록:', records);
        console.log('기록 합계:', records.reduce((sum, record) => sum + record, 0));
        console.log('기록 개수:', records.length);
        // 평균 기록 계산 (모든 기록의 합을 인원수로 나누기)
        const avgRecord = records.reduce((sum, record) => sum + record, 0) / records.length;
        // 디버깅: 평균 계산 결과 확인
        console.log('계산된 평균:', avgRecord);
        // 평균 기록을 순위표 제목에 표시
        const avgRecordDisplay = this.$('#avg-record-display');
        if (avgRecordDisplay) {
            avgRecordDisplay.textContent = `평균 기록: ${avgRecord.toFixed(2)}`;
        }
        // 개인 기록이 있는 경우 순위와 상위% 계산
        if (personalRecord !== null) {
            const rank = records.findIndex(record => record === personalRecord) + 1;
            // 상위% 계산: 작은 숫자가 좋은 경우 (낮은 순위가 좋음)
            const percentile = ((records.length - rank + 1) / records.length * 100).toFixed(1);
            this.$('#personal-rank').textContent = `${rank}위`;
            this.$('#personal-percentile').textContent = `상위 ${percentile}%`;
            this.$('#personal-rank-card').style.display = 'block';
            this.$('#personal-percentile-card').style.display = 'block';
        }
        else {
            this.$('#personal-rank-card').style.display = 'none';
            this.$('#personal-percentile-card').style.display = 'none';
        }
        // 순위 테이블 생성
        this.renderRankingTable(recordsWithNames, studentName);
        // 결과 섹션 표시
        this.$('#ranking-results').style.display = 'block';
    }
    /**
     * 순위 테이블을 렌더링합니다.
     */
    renderRankingTable(recordsWithNames, studentName) {
        // 기록을 내림차순으로 정렬
        const sortedRecords = recordsWithNames.sort((a, b) => b.record - a.record);
        // 페이지네이션 설정
        const itemsPerPage = 10;
        const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
        // 현재 페이지를 1로 초기화
        let currentPage = 1;
        // 테이블 렌더링 함수
        const renderTable = (page) => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, sortedRecords.length);
            const pageRecords = sortedRecords.slice(startIndex, endIndex);
            const tbody = this.$('#ranking-table-body');
            if (!tbody)
                return;
            tbody.innerHTML = pageRecords.map((item, index) => {
                const rank = startIndex + index + 1;
                const isPersonalRecord = studentName && item.name === studentName;
                const rowClass = isPersonalRecord ? 'table-warning' : '';
                // 상위% 계산: 낮은 순위일수록 낮은 퍼센트 (1위 = 0%, 마지막 순위 = 100%에 가까움)
                const percentile = ((rank - 1) / sortedRecords.length * 100).toFixed(1);
                return `
                    <tr class="${rowClass}" data-rank="${rank}">
                        <td style="text-align: center; font-weight: bold; color: #007bff;">${rank}</td>
                        <td style="text-align: center; font-weight: 500;">${item.name}</td>
                        <td style="text-align: center; font-weight: bold; color: #28a745;">${item.record}</td>
                        <td style="text-align: center; font-weight: bold; color: #6f42c1;">${percentile}%</td>
                    </tr>
                `;
            }).join('');
            // 페이지 정보 업데이트
            const pageInfo = this.$('#page-info');
            if (pageInfo) {
                pageInfo.textContent = `${page} / ${totalPages} 페이지 (총 ${sortedRecords.length}명)`;
            }
            // 페이지네이션 버튼 상태 업데이트
            const prevBtn = this.$('#prev-page');
            const nextBtn = this.$('#next-page');
            if (prevBtn) {
                prevBtn.style.display = page > 1 ? 'block' : 'none';
            }
            if (nextBtn) {
                nextBtn.style.display = page < totalPages ? 'block' : 'none';
            }
        };
        // 페이지네이션 이벤트 리스너 설정
        const prevBtn = this.$('#prev-page');
        const nextBtn = this.$('#next-page');
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable(currentPage);
                }
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable(currentPage);
                }
            };
        }
        // 공유 기능 이벤트 리스너 설정
        this.setupShareControls(sortedRecords, studentName);
        // 표준편차 그래프 그리기
        this.drawStandardDeviationChart(sortedRecords, studentName);
        // 초기 테이블 렌더링
        renderTable(currentPage);
    }
    /**
     * 공유 기능 컨트롤을 설정합니다.
     */
    setupShareControls(sortedRecords, studentName) {
        const shareBtn = this.$('#share-btn');
        const shareMenu = this.$('#share-menu');
        const realtimeShareBtn = this.$('#realtime-share-btn');
        const copyTextBtn = this.$('#copy-text-btn');
        const copyImageBtn = this.$('#copy-image-btn');
        if (!shareBtn || !shareMenu || !realtimeShareBtn || !copyTextBtn || !copyImageBtn)
            return;
        // 공유 버튼 클릭 시 메뉴 토글
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareMenu.style.display = shareMenu.style.display === 'none' ? 'block' : 'none';
        });
        // 메뉴 외부 클릭 시 메뉴 숨기기
        document.addEventListener('click', () => {
            shareMenu.style.display = 'none';
        });
        // 실시간 공유 기능
        realtimeShareBtn.addEventListener('click', () => {
            this.createRealtimeShare(sortedRecords, studentName);
            shareMenu.style.display = 'none';
        });
        // 텍스트 복사 기능
        copyTextBtn.addEventListener('click', () => {
            this.copyRankingAsText(sortedRecords, studentName);
            shareMenu.style.display = 'none';
        });
        // 이미지 저장 기능
        copyImageBtn.addEventListener('click', () => {
            this.saveRankingAsImage(sortedRecords, studentName);
            shareMenu.style.display = 'none';
        });
    }
    /**
     * 실시간 공유를 생성합니다.
     */
    async createRealtimeShare(sortedRecords, studentName) {
        try {
            // 공유 ID 생성
            const shareId = this.generateShareId();
            // 공유 데이터 구성
            const avgRecordDisplay = this.$('#avg-record-display');
            const avgText = avgRecordDisplay ? avgRecordDisplay.textContent : '평균 기록: -';
            const shareData = {
                id: shareId,
                title: 'PAPS 순위표',
                avgRecord: avgText,
                records: sortedRecords,
                personalName: studentName,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            // Firebase에 공유 데이터 저장 (window.firebase 사용)
            const { db, setDoc, doc } = window.firebase;
            // Firebase에 데이터 저장
            await setDoc(doc(db, 'sharedRankings', shareId), {
                ...shareData,
                createdAt: new Date(),
                lastUpdated: new Date()
            });
            // 공유 링크 생성
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
            // 클립보드에 링크 복사
            await navigator.clipboard.writeText(shareUrl);
            // 성공 메시지 표시
            this.showShareSuccessModal(shareUrl, shareId);
        }
        catch (error) {
            console.error('실시간 공유 생성 실패:', error);
            alert('실시간 공유 생성에 실패했습니다.');
        }
    }
    /**
     * 공유 ID를 생성합니다.
     */
    generateShareId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * 공유 성공 모달을 표시합니다.
     */
    showShareSuccessModal(shareUrl, shareId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;">
                <h3 style="margin: 0 0 16px 0; color: #28a745;">✅ 실시간 공유 생성 완료!</h3>
                <p style="margin: 0 0 16px 0; color: #666;">공유 링크가 클립보드에 복사되었습니다.</p>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin: 16px 0;">
                    <strong>공유 링크:</strong><br>
                    <span style="word-break: break-all; font-family: monospace; font-size: 12px;">${shareUrl}</span>
                </div>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin: 16px 0;">
                    <strong>공유 ID:</strong> ${shareId}<br>
                    <small style="color: #666;">이 ID로 언제든지 접근할 수 있습니다.</small>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="close-modal" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">확인</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // 모달 닫기
        const closeBtn = modal.querySelector('#close-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        // 배경 클릭 시 모달 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    /**
     * 순위표를 텍스트로 복사합니다.
     */
    copyRankingAsText(sortedRecords, studentName) {
        const avgRecordDisplay = this.$('#avg-record-display');
        const avgText = avgRecordDisplay ? avgRecordDisplay.textContent : '평균 기록: -';
        let text = `🏆 PAPS 순위표\n`;
        text += `${avgText}\n\n`;
        text += `순위 | 이름 | 기록 | 상위%\n`;
        text += `-----|------|------|------\n`;
        sortedRecords.forEach((item, index) => {
            const rank = index + 1;
            const percentile = ((rank - 1) / sortedRecords.length * 100).toFixed(1);
            const highlight = studentName && item.name === studentName ? '⭐ ' : '';
            text += `${highlight}${rank}위 | ${item.name} | ${item.record} | ${percentile}%\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
            alert('순위표가 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('클립보드 복사에 실패했습니다.');
        });
    }
    /**
     * 순위표를 이미지로 저장합니다.
     */
    saveRankingAsImage(sortedRecords, studentName) {
        const table = this.$('#ranking-table');
        if (!table)
            return;
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // 테이블 크기 계산
        const rect = table.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height + 100; // 제목 공간 추가
        // 배경 그리기
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 제목 그리기
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 PAPS 순위표', canvas.width / 2, 30);
        // 평균 기록 그리기
        const avgRecordDisplay = this.$('#avg-record-display');
        if (avgRecordDisplay) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText(avgRecordDisplay.textContent || '', canvas.width / 2, 55);
        }
        // 테이블 그리기 (간단한 텍스트 형태)
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#333333';
        let y = 80;
        const rowHeight = 20;
        // 헤더
        ctx.fillText('순위', 20, y);
        ctx.fillText('이름', 80, y);
        ctx.fillText('기록', 200, y);
        ctx.fillText('상위%', 280, y);
        y += rowHeight;
        // 구분선
        ctx.strokeStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
        y += 10;
        // 데이터 행 (최대 10개)
        const displayRecords = sortedRecords.slice(0, 10);
        displayRecords.forEach((item, index) => {
            const rank = index + 1;
            const percentile = ((rank - 1) / sortedRecords.length * 100).toFixed(1);
            const highlight = studentName && item.name === studentName;
            if (highlight) {
                ctx.fillStyle = '#fff3cd';
                ctx.fillRect(15, y - 15, canvas.width - 30, rowHeight);
            }
            ctx.fillStyle = highlight ? '#856404' : '#333333';
            ctx.fillText(`${rank}위`, 20, y);
            ctx.fillText(item.name, 80, y);
            ctx.fillText(item.record.toString(), 200, y);
            ctx.fillText(`${percentile}%`, 280, y);
            y += rowHeight;
        });
        // 이미지 다운로드
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PAPS_순위표_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('순위표 이미지가 저장되었습니다!');
            }
        });
    }
    /**
     * PAPS 학생 업로드를 처리합니다.
     */
    handlePapsStudentUpload(event, cls) {
        const target = event.target;
        const file = target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                if (typeof window !== 'undefined' && window.XLSX) {
                    const data = new Uint8Array(e.target?.result);
                    const wb = window.XLSX.read(data, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const json = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
                    const newStudents = [];
                    for (let i = 1; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length === 0)
                            continue;
                        const num = row[0];
                        const name = row[1];
                        let gender = row[2] || '남자';
                        if (typeof gender === 'string') {
                            if (gender.includes('여'))
                                gender = '여자';
                            else
                                gender = '남자';
                        }
                        else
                            gender = '남자';
                        newStudents.push({
                            id: Date.now() + i,
                            number: num,
                            name,
                            gender: gender,
                            records: {}
                        });
                    }
                    cls.students = newStudents;
                    this.buildPapsTable(cls);
                    this.saveDataToFirestore();
                    alert('학생 명렬표를 불러왔습니다.');
                }
                else {
                    alert('엑셀 라이브러리가 로드되지 않았습니다.');
                }
            }
            catch (err) {
                alert('파일 처리 중 오류가 발생했습니다.');
            }
            finally {
                target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }
    /**
     * PAPS를 엑셀로 내보냅니다.
     */
    exportPapsToExcel(cls) {
        if (!cls || !cls.students || cls.students.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        if (typeof window !== 'undefined' && window.XLSX) {
            // 엑셀 내보내기 로직 구현
            alert('엑셀 내보내기 기능은 개발 중입니다.');
        }
        else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }
    /**
     * 모든 PAPS를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel() {
        if (typeof window !== 'undefined' && window.XLSX) {
            // 모든 PAPS 엑셀 내보내기 로직 구현
            alert('전체 엑셀 내보내기 기능은 개발 중입니다.');
        }
        else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }
    /**
     * PAPS 기록 업로드를 처리합니다.
     */
    handlePapsRecordUpload(event, cls) {
        // PAPS 기록 업로드 로직 구현
        alert('PAPS 기록 업로드 기능은 개발 중입니다.');
    }
    /**
     * 모든 PAPS 엑셀 업로드를 처리합니다.
     */
    handleAllPapsExcelUpload(event) {
        // 모든 PAPS 엑셀 업로드 로직 구현
        alert('전체 PAPS 엑셀 업로드 기능은 개발 중입니다.');
    }
    /**
     * PAPS 차트를 렌더링합니다.
     */
    renderPapsCharts(cls) {
        // PAPS 차트 렌더링 로직 구현
        const chartsContainer = this.$('#paps-charts');
        chartsContainer.innerHTML = '<p>차트 기능은 개발 중입니다.</p>';
    }
    /**
     * 이해하기 쉬운 기록 분포 그래프를 그립니다.
     */
    drawStandardDeviationChart(sortedRecords, studentName) {
        const canvas = this.$('#ranking-distribution-chart');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // 캔버스 크기 설정
        canvas.width = 500;
        canvas.height = 500;
        // 배경 그리기
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 차트 영역 설정
        const margin = { top: 60, right: 40, bottom: 90, left: 70 };
        const chartWidth = canvas.width - margin.left - margin.right;
        const chartHeight = canvas.height - margin.top - margin.bottom;
        const records = sortedRecords.map(item => item.record);
        if (records.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('데이터 없음', canvas.width / 2, canvas.height / 2);
            return;
        }
        // 통계 계산
        const mean = records.reduce((sum, record) => sum + record, 0) / records.length;
        const minRecord = Math.min(...records);
        const maxRecord = Math.max(...records);
        const recordRange = maxRecord - minRecord;
        // 기록 구간 설정 (실제 기록 값으로)
        const numBins = Math.min(10, Math.max(5, Math.ceil(recordRange / 5))); // 5-10개 구간
        const binSize = recordRange / numBins;
        // 각 구간별 빈도 계산
        const bins = new Array(numBins).fill(0);
        const binLabels = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = minRecord + (i * binSize);
            const binEnd = minRecord + ((i + 1) * binSize);
            binLabels.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`);
        }
        records.forEach(record => {
            const binIndex = Math.min(Math.floor((record - minRecord) / binSize), numBins - 1);
            if (binIndex >= 0 && binIndex < numBins) {
                bins[binIndex]++;
            }
        });
        const maxFrequency = Math.max(...bins);
        // 그리드 라인 그리기
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        // 수평 그리드 라인
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + chartWidth, y);
            ctx.stroke();
        }
        // 수직 그리드 라인
        for (let i = 0; i <= numBins; i++) {
            const x = margin.left + (chartWidth / numBins) * i;
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + chartHeight);
            ctx.stroke();
        }
        // 막대 그래프 그리기
        const barWidth = chartWidth / numBins;
        bins.forEach((frequency, index) => {
            if (frequency > 0) {
                const x = margin.left + index * barWidth;
                const barHeight = (frequency / maxFrequency) * chartHeight;
                const y = margin.top + chartHeight - barHeight;
                // 막대 그리기 (그라데이션)
                const gradient = ctx.createLinearGradient(0, y, 0, margin.top + chartHeight);
                gradient.addColorStop(0, '#007bff');
                gradient.addColorStop(1, '#0056b3');
                ctx.fillStyle = gradient;
                ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
                // 빈도 텍스트 표시
                ctx.fillStyle = '#495057';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(frequency.toString(), x + barWidth / 2, y - 8);
            }
        });
        // 평균선 그리기 (수평선)
        const avgY = margin.top + chartHeight - ((mean - minRecord) / recordRange) * chartHeight;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(margin.left, avgY);
        ctx.lineTo(margin.left + chartWidth, avgY);
        ctx.stroke();
        ctx.setLineDash([]);
        // 개인 기록 표시
        if (studentName) {
            const personalRecord = sortedRecords.find(item => item.name === studentName)?.record;
            if (personalRecord !== undefined) {
                const personalX = margin.left + ((personalRecord - minRecord) / recordRange) * chartWidth;
                // 개인 기록 점선 (수직)
                ctx.strokeStyle = '#dc3545';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(personalX, margin.top);
                ctx.lineTo(personalX, margin.top + chartHeight);
                ctx.stroke();
                ctx.setLineDash([]);
                // 개인 기록 포인트 (상단에 원)
                ctx.fillStyle = '#dc3545';
                ctx.beginPath();
                ctx.arc(personalX, margin.top + 10, 6, 0, Math.PI * 2);
                ctx.fill();
                // 개인 기록 포인트 테두리
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 개인 기록 값 표시
                ctx.fillStyle = '#dc3545';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${personalRecord}`, personalX, margin.top - 5);
            }
        }
        // 축 그리기
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        // Y축 레이블 (빈도)
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxFrequency * i) / 5);
            const y = margin.top + chartHeight - (chartHeight * i / 5);
            ctx.fillText(value.toString(), margin.left - 20, y + 5);
        }
        // X축 레이블 (기록 구간)
        ctx.textAlign = 'center';
        ctx.font = '11px Arial';
        for (let i = 0; i < numBins; i++) {
            const x = margin.left + (i + 0.5) * barWidth;
            ctx.fillText(binLabels[i], x, margin.top + chartHeight + 20);
        }
        // 제목
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('기록 분포 그래프', canvas.width / 2, 30);
        // 축 제목
        ctx.font = 'bold 14px Arial';
        ctx.save();
        ctx.translate(25, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('학생 수', 0, 0);
        ctx.restore();
        ctx.textAlign = 'center';
        ctx.fillText('기록 범위', canvas.width / 2, canvas.height - 20);
        // 통계 정보 표시
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`평균 기록: ${mean.toFixed(1)}`, margin.left, margin.top - 25);
        ctx.fillText(`최고 기록: ${maxRecord}`, margin.left, margin.top - 10);
        ctx.fillText(`최저 기록: ${minRecord}`, margin.left, margin.top + 5);
        // 범례
        const legendY = margin.top + 20;
        const legendX = margin.left + chartWidth - 140;
        // 범례 배경
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(legendX, legendY, 130, 70);
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, 130, 70);
        // 범례 항목들
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        // 평균선 범례
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(legendX + 10, legendY + 15);
        ctx.lineTo(legendX + 25, legendY + 15);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#495057';
        ctx.fillText('평균 기록', legendX + 30, legendY + 20);
        // 개인 기록 범례
        if (studentName) {
            ctx.fillStyle = '#dc3545';
            ctx.beginPath();
            ctx.arc(legendX + 17, legendY + 35, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#495057';
            ctx.fillText('나의 기록', legendX + 30, legendY + 40);
        }
        // 전체 분포 범례
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(legendX + 17, legendY + 55, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#495057';
        ctx.fillText('전체 분포', legendX + 30, legendY + 60);
    }
}
//# sourceMappingURL=papsManager.js.map