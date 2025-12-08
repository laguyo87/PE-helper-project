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
import { validateData, PapsClassSchema } from './validators.js';
import { showError, showSuccess } from './errorHandler.js';
import { showInfoToast } from './toast.js';
import { setInnerHTMLSafe } from './utils.js';
import { logger, logError } from './logger.js';
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
    constructor(papsData, $, saveDataToFirestore, cleanupSidebar // 사용하지 않지만 호환성을 위해 유지
    ) {
        this.selectedStudentForChart = null; // 그래프에서 선택된 학생
        this.currentRankingRecords = null; // 현재 랭킹 데이터 저장
        this.papsData = papsData;
        this.$ = $;
        this.saveDataToFirestore = saveDataToFirestore;
        // cleanupSidebar는 더 이상 사용하지 않음 (자체 메서드 사용)
        // 실시간 업데이트 관련 속성
        this.currentRankingData = null;
        this.updateInterval = null;
        this.currentRankingPage = 1;
    }
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머와 이벤트 리스너를 정리합니다.
     */
    cleanup() {
        // 실시간 업데이트 중지
        this.stopRealtimeUpdate();
        // updateInterval이 남아있으면 강제로 정리
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            logger.debug('PapsManager: 남아있던 updateInterval 정리 완료');
        }
        // 추가 리소스 정리가 필요한 경우 여기에 추가
        logger.debug('PapsManager 리소스 정리 완료');
    }
    /**
     * PAPS 데이터를 설정합니다.
     * @param data PAPS 데이터
     */
    setPapsData(data) {
        this.papsData = data;
    }
    /**
     * PAPS 데이터를 가져옵니다.
     * @returns PAPS 데이터
     */
    getPapsData() {
        return this.papsData;
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
        // Progress, League 모드 전용 엑셀 버튼 제거
        const progressExcelActions = document.querySelector('.progress-excel-actions');
        if (progressExcelActions) {
            progressExcelActions.remove();
        }
        const leagueExcelActions = document.querySelector('.league-excel-actions');
        if (leagueExcelActions) {
            leagueExcelActions.remove();
        }
        // sidebar-list-container가 Progress 모드에서 숨겨졌을 수 있으므로 다시 표시
        // CSS의 !important를 override하기 위해 setProperty 사용
        const sidebarListContainer = document.querySelector('#sidebar-list-container');
        if (sidebarListContainer) {
            // 즉시 표시
            sidebarListContainer.style.setProperty('display', 'flex', 'important');
            // 약간의 지연 후에도 다시 확인 (모드 전환 후 CSS가 재적용될 수 있음)
            setTimeout(() => {
                const el = document.querySelector('#sidebar-list-container');
                if (el && !document.body.classList.contains('progress-mode')) {
                    el.style.setProperty('display', 'flex', 'important');
                }
            }, 50);
        }
        this.renderPapsClassList();
        // PAPS Excel 버튼 추가 (sidebar-footer 앞)
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            // 기존 PAPS Excel 버튼이 있으면 제거
            const existingActions = document.querySelector('.paps-excel-actions');
            if (existingActions) {
                existingActions.remove();
            }
            // PAPS Excel 버튼 추가
            const papsExcelActions = document.createElement('div');
            papsExcelActions.className = 'paps-excel-actions';
            papsExcelActions.style.cssText = 'padding: 16px; border-top: 1px solid var(--line); margin-top: auto;';
            papsExcelActions.innerHTML = `
                <button class="btn" onclick="papsManager.exportAllPapsToExcel()" style="width: 100%; margin-bottom: 8px; justify-content: center; background:var(--win); color:white;" data-tooltip="모든 반의 PAPS 기록을 엑셀 파일로 내보냅니다.">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 8px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    모든 반 PAPS 기록 엑셀로 내보내기
                </button>
                <input type="file" id="paps-all-excel-upload" accept=".xlsx,.xls" style="display: none;" onchange="papsManager.handleAllPapsExcelUpload(event)">
                <button class="btn" onclick="document.getElementById('paps-all-excel-upload').click()" style="width: 100%; justify-content: center;" data-tooltip="엑셀 파일에서 모든 반의 PAPS 기록을 가져옵니다.">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 8px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    모든 반 PAPS 기록 엑셀에서 가져오기
                </button>
            `;
            sidebarFooter.parentNode?.insertBefore(papsExcelActions, sidebarFooter);
        }
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
    }
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList() {
        const sidebarList = this.$('#sidebar-list-container');
        if (sidebarList) {
            const html = this.papsData.classes.map(c => `
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
            setInnerHTMLSafe(sidebarList, html);
        }
    }
    /**
     * PAPS 반을 생성합니다.
     */
    createPapsClass() {
        const name = this.$('#papsClassName').value.trim();
        // 이름 유효성 검사
        if (!name) {
            showError(new Error('반 이름을 입력해주세요.'));
            return;
        }
        // 중복 검사
        if (this.papsData.classes.some(c => c.name === name)) {
            showError(new Error('이미 존재하는 반 이름입니다.'));
            return;
        }
        // 데이터 생성 및 검증
        const newClassData = {
            id: Date.now(),
            name,
            gradeLevel: '1학년',
            students: []
        };
        const validation = validateData(PapsClassSchema, newClassData);
        if (!validation.success) {
            if (validation.errors) {
                showError(validation.errors);
            }
            else if (validation.formattedErrors) {
                showError(new Error(validation.formattedErrors.join(', ')));
            }
            else {
                showError(new Error('데이터 검증에 실패했습니다.'));
            }
            return;
        }
        // 검증 통과 후 추가
        const newClass = validation.data;
        this.papsData.classes.push(newClass);
        this.$('#papsClassName').value = '';
        this.saveDataToFirestore();
        this.renderPapsUI();
        showSuccess('반이 생성되었습니다.');
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
                <div class="row" style="gap: 8px;">
                    <span class="paps-chip">학년: ${cls.gradeLevel || '미설정'}</span>
                    <button class="btn primary" id="generate-qr-codes-btn" style="padding: 8px 16px;">
                        📱 개인 기록 조회 QR 생성(공유)
                    </button>
                    <button class="btn" id="load-saved-qr-btn" style="padding: 8px 16px;">
                        📂 저장된 QR 불러오기
                    </button>
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
                    <h2 style="margin:0;">👑 우리 학교 PAPS 종목별 랭킹 🏆</h2>
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
                                <button id="print-ranking-btn" class="btn btn-sm" style="background-color: #007bff; color: white;">
                                    🖨️ 인쇄
                                </button>
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
                                <button id="close-ranking-btn" class="btn btn-sm" style="background-color: #dc3545; color: white; margin-left: 8px;">
                                    ✕ 닫기
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped" id="ranking-table">
                                <thead>
                                    <tr>
                                        <th style="width: 80px;">순위</th>
                                        <th style="width: 200px;">이름</th>
                                        <th style="width: 120px;">기록</th>
                                        <th style="width: 100px;">%</th>
                                    </tr>
                                </thead>
                                <tbody id="ranking-table-body">
                                </tbody>
                            </table>
                            <div style="margin-top: 12px; font-size: 12px; color: #666; text-align: center; font-style: italic;">
                                💡 이름을 클릭하면 그래프에서 학생의 위치를 볼 수 있습니다
                            </div>
                        </div>
                    </div>
                    <div class="ranking-chart-container">
                        <canvas id="ranking-distribution-chart" width="800" height="600"></canvas>
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
        // QR 코드 생성 버튼 이벤트 리스너
        const generateQRCodesBtn = this.$('#generate-qr-codes-btn');
        if (generateQRCodesBtn) {
            generateQRCodesBtn.addEventListener('click', async () => {
                // 유효 기간 입력 모달 표시
                const days = await this.showExpiresDaysModal();
                if (days !== null) {
                    await this.generateClassQRCodes(days);
                }
            });
        }
        // 저장된 QR 불러오기 버튼
        const loadSavedQRBtn = this.$('#load-saved-qr-btn');
        if (loadSavedQRBtn) {
            loadSavedQRBtn.addEventListener('click', () => {
                this.showSavedQRListModal();
            });
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
        if (!head || !body) {
            logger.error('[PAPS 테이블] 테이블 요소를 찾을 수 없음', { head: !!head, body: !!body });
            return;
        }
        logger.debug('[PAPS 테이블] 테이블 구성 시작', {
            className: cls.name,
            studentCount: cls.students?.length || 0
        });
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
        body.innerHTML = ''; // 빈 문자열은 안전
        const students = (cls.students || []).slice();
        if (students.length === 0) {
            logger.debug('[PAPS 테이블] 학생 데이터가 없음 - 빈 테이블 표시');
            // 빈 테이블 메시지 표시 (선택사항)
            // body.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 2rem; color: var(--ink-muted);">학생 데이터가 없습니다.</td></tr>';
            return;
        }
        // number가 없는 학생들에게 자동으로 번호 할당
        students.forEach((st, index) => {
            if (!st.number) {
                st.number = index + 1;
                logger.debug(`[PAPS 테이블] 학생 ${st.id}에게 번호 ${st.number} 할당`);
            }
        });
        students.sort((a, b) => (a.number || 0) - (b.number || 0));
        logger.debug('[PAPS 테이블] 학생 데이터:', students.map(s => ({
            id: s.id,
            number: s.number,
            name: s.name,
            records: s.records,
            recordsKeys: s.records ? Object.keys(s.records) : []
        })));
        students.forEach(st => {
            const tr = document.createElement('tr');
            tr.dataset.sid = st.id.toString();
            // 학생 레코드 데이터 확인
            const records = st.records || {};
            logger.debug(`[PAPS 테이블] 학생 ${st.id} 레코드:`, records);
            // 체크박스
            const tdCheckbox = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'paps-row-checkbox';
            tdCheckbox.appendChild(checkbox);
            tr.appendChild(tdCheckbox);
            // 번호
            const tdNumber = document.createElement('td');
            const inputNumber = document.createElement('input');
            inputNumber.type = 'number';
            inputNumber.className = 'paps-input number';
            inputNumber.value = String(st.number || '');
            inputNumber.onchange = (e) => this.onPapsInput(e, cls);
            tdNumber.appendChild(inputNumber);
            tr.appendChild(tdNumber);
            // 이름
            const tdName = document.createElement('td');
            const inputName = document.createElement('input');
            inputName.type = 'text';
            inputName.className = 'paps-input name';
            inputName.value = st.name || '';
            inputName.onchange = (e) => this.onPapsInput(e, cls);
            tdName.appendChild(inputName);
            tr.appendChild(tdName);
            // 성별
            const tdGender = document.createElement('td');
            const selectGender = document.createElement('select');
            selectGender.className = 'paps-input gender';
            selectGender.onchange = (e) => this.onPapsInput(e, cls);
            const optionMale = document.createElement('option');
            optionMale.value = '남자';
            optionMale.textContent = '남';
            if (st.gender === '남자')
                optionMale.selected = true;
            const optionFemale = document.createElement('option');
            optionFemale.value = '여자';
            optionFemale.textContent = '여';
            if (st.gender === '여자')
                optionFemale.selected = true;
            selectGender.appendChild(optionMale);
            selectGender.appendChild(optionFemale);
            tdGender.appendChild(selectGender);
            tr.appendChild(tdGender);
            // 각 종목별 입력 필드
            Object.keys(PAPS_ITEMS).filter(k => k !== "체지방").forEach(k => {
                const id = PAPS_ITEMS[k].id;
                const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
                // 악력 종목은 왼손/오른손으로 분리
                if (eventName === '악력') {
                    // 왼손 입력
                    const tdLeftInput = document.createElement('td');
                    const inputLeft = document.createElement('input');
                    inputLeft.type = 'number';
                    inputLeft.step = 'any';
                    inputLeft.className = 'paps-input rec';
                    inputLeft.dataset.id = `${id}_left`;
                    inputLeft.value = String(records[`${id}_left`] || '');
                    inputLeft.onchange = (e) => this.onPapsInput(e, cls);
                    tdLeftInput.appendChild(inputLeft);
                    tr.appendChild(tdLeftInput);
                    // 왼손 등급
                    const tdLeftGrade = document.createElement('td');
                    tdLeftGrade.className = 'grade-cell';
                    tdLeftGrade.dataset.id = `${id}_left`;
                    tr.appendChild(tdLeftGrade);
                    // 오른손 입력
                    const tdRightInput = document.createElement('td');
                    const inputRight = document.createElement('input');
                    inputRight.type = 'number';
                    inputRight.step = 'any';
                    inputRight.className = 'paps-input rec';
                    inputRight.dataset.id = `${id}_right`;
                    inputRight.value = String(records[`${id}_right`] || '');
                    inputRight.onchange = (e) => this.onPapsInput(e, cls);
                    tdRightInput.appendChild(inputRight);
                    tr.appendChild(tdRightInput);
                    // 오른손 등급
                    const tdRightGrade = document.createElement('td');
                    tdRightGrade.className = 'grade-cell';
                    tdRightGrade.dataset.id = `${id}_right`;
                    tr.appendChild(tdRightGrade);
                }
                else {
                    // 기록 입력
                    const tdInput = document.createElement('td');
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.step = 'any';
                    input.className = 'paps-input rec';
                    input.dataset.id = id;
                    input.value = String(records[id] || '');
                    input.onchange = (e) => this.onPapsInput(e, cls);
                    tdInput.appendChild(input);
                    tr.appendChild(tdInput);
                    // 등급
                    const tdGrade = document.createElement('td');
                    tdGrade.className = 'grade-cell';
                    tdGrade.dataset.id = id;
                    tr.appendChild(tdGrade);
                }
            });
            // 신장
            const tdHeight = document.createElement('td');
            const inputHeight = document.createElement('input');
            inputHeight.type = 'number';
            inputHeight.step = 'any';
            inputHeight.className = 'paps-input height';
            inputHeight.value = String(records.height || '');
            inputHeight.onchange = (e) => this.onPapsInput(e, cls);
            tdHeight.appendChild(inputHeight);
            tr.appendChild(tdHeight);
            // 체중
            const tdWeight = document.createElement('td');
            const inputWeight = document.createElement('input');
            inputWeight.type = 'number';
            inputWeight.step = 'any';
            inputWeight.className = 'paps-input weight';
            inputWeight.value = String(records.weight || '');
            inputWeight.onchange = (e) => this.onPapsInput(e, cls);
            tdWeight.appendChild(inputWeight);
            tr.appendChild(tdWeight);
            // BMI 셀
            const tdBMI = document.createElement('td');
            tdBMI.className = 'bmi-cell';
            tr.appendChild(tdBMI);
            // 체지방 등급
            const tdBodyfatGrade = document.createElement('td');
            tdBodyfatGrade.className = 'grade-cell';
            tdBodyfatGrade.dataset.id = 'bodyfat';
            tr.appendChild(tdBodyfatGrade);
            // 종합 등급
            const tdOverallGrade = document.createElement('td');
            tdOverallGrade.className = 'overall-grade-cell';
            tr.appendChild(tdOverallGrade);
            body.appendChild(tr);
            // DOM이 추가된 직후 바로 등급 업데이트
            this.updatePapsRowGrades(tr, cls);
        });
        // 모든 행이 추가된 후 등급 업데이트 (DOM이 완전히 준비된 후)
        // 두 번의 requestAnimationFrame을 사용하여 DOM이 완전히 렌더링된 후 실행
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const rows = body.querySelectorAll('tr[data-sid]');
                logger.debug('[PAPS 테이블] 등급 업데이트 시작 (2차)', { rowCount: rows.length });
                rows.forEach(row => {
                    if (row.dataset.sid) {
                        this.updatePapsRowGrades(row, cls);
                    }
                });
            });
        });
        logger.debug('[PAPS 테이블] 테이블 구성 완료', {
            rowCount: body.querySelectorAll('tr').length
        });
        // Enter 키 처리를 위한 keydown 리스너 (이벤트 위임)
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
            else {
                const first = body.querySelector('tr');
                if (first) {
                    const fcell = first.children[idx];
                    const finp = fcell?.querySelector('input');
                    if (finp) {
                        finp.focus();
                        finp.select();
                    }
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
        // 실시간 업데이트 트리거 (데이터가 변경되었을 때)
        if (this.currentRankingData) {
            this.updateRankingData(cls);
        }
        // 기록이 변경되면 해당 학생의 공유 데이터를 Firestore에 자동 업데이트
        // 비동기로 처리하여 UI 블로킹 방지
        this.updateStudentShareData(st, cls, tr).catch(error => {
            logError('학생 공유 데이터 자동 업데이트 실패:', error);
            // 에러가 발생해도 메인 플로우에는 영향 없음 (조용히 실패)
        });
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
        if (bmiCell) {
            if (h > 0 && w > 0) {
                const m = h / 100;
                bmi = w / (m * m);
                bmiCell.textContent = bmi.toFixed(2);
            }
            else {
                bmiCell.textContent = '';
            }
        }
        else {
            logger.warn('[PAPS 등급 업데이트] BMI 셀을 찾을 수 없음');
        }
        // Each category
        const studentGender = tr.querySelector('.gender')?.value || '남자';
        const gradeLevel = cls.gradeLevel || '';
        // grade-cell 요소들을 찾아서 초기화
        const gradeCells = tr.querySelectorAll('.grade-cell');
        if (gradeCells.length === 0) {
            logger.warn('[PAPS 등급 업데이트] grade-cell 요소를 찾을 수 없음', {
                rowId: tr.dataset.sid,
                hasRow: !!tr,
                rowChildrenCount: tr.children.length
            });
            return;
        }
        gradeCells.forEach(td => {
            td.textContent = '';
            td.className = 'grade-cell';
        });
        logger.debug(`[PAPS 등급 업데이트] 학생 성별: ${studentGender}, 학년: ${gradeLevel}`);
        Object.keys(PAPS_ITEMS).forEach(k => {
            const id = PAPS_ITEMS[k].id;
            const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
            logger.debug(`[PAPS 등급 업데이트] 카테고리: ${k}, ID: ${id}, 이벤트명: ${eventName}`);
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
                logger.debug(`[PAPS 등급 업데이트] ${k} - 입력값: ${value}, isNaN: ${isNaN(value)}`);
                if (!isNaN(value)) {
                    const grade = this.calcPapsGrade(id, value, studentGender, gradeLevel, cls);
                    const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                    logger.debug(`[PAPS 등급 업데이트] ${k} - 계산된 등급: ${grade}, TD 요소:`, td);
                    if (td) {
                        td.textContent = grade || '';
                        if (grade) {
                            // 기존 등급 클래스 제거
                            td.classList.remove('grade-1등급', 'grade-2등급', 'grade-3등급', 'grade-4등급', 'grade-5등급');
                            // 새로운 등급 클래스 추가 (숫자만 추출)
                            const gradeNumber = grade.replace('등급', '');
                            td.classList.add(`grade-${gradeNumber}`);
                        }
                        logger.debug(`[PAPS 등급 업데이트] ${k} - UI 적용 완료: ${td.textContent}`);
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
        logger.debug(`[calcPapsGrade 호출] categoryId: ${categoryId}, value: ${value}, gender: ${gender}, gradeLevel: ${gradeLevel}`);
        if (value == null || isNaN(value) || !gender || !gradeLevel) {
            logger.debug(`[calcPapsGrade 조기 종료] value: ${value}, gender: ${gender}, gradeLevel: ${gradeLevel}`);
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
        logger.debug(`[PAPS 등급 계산] 종목: ${selectedTest}, 성별: ${gender}, 학년: ${gradeLevel}, 값: ${value}`);
        logger.debug(`[PAPS 등급 계산] 기준표:`, ranges);
        // 범위를 역순으로 확인 (높은 값부터 확인하여 최고 등급부터 매칭)
        for (let i = ranges.length - 1; i >= 0; i--) {
            const [a, b, g] = ranges[i];
            const min = Math.min(a, b), max = Math.max(a, b);
            logger.debug(`[PAPS 등급 계산] 범위 확인: ${min} <= ${value} <= ${max} ? ${value >= min && value <= max} → ${g}등급`);
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
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = eventName;
                eventSelect.appendChild(option);
            });
        }
        // 랭킹 조회 버튼 이벤트 리스너
        const searchBtn = this.$('#ranking-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchRanking(cls));
        }
        // 닫기 버튼 이벤트 리스너
        const closeBtn = this.$('#close-ranking-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeRanking());
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
        logger.debug('수집된 기록 데이터:', recordsWithNames);
        // 통계 계산
        const records = recordsWithNames.map(item => item.record);
        records.sort((a, b) => b - a); // 내림차순 정렬 (높은 기록이 좋은 경우)
        // 디버깅: 정렬된 기록 확인
        logger.debug('정렬된 기록:', records);
        logger.debug('기록 합계:', records.reduce((sum, record) => sum + record, 0));
        logger.debug('기록 개수:', records.length);
        // 평균 기록 계산 (모든 기록의 합을 인원수로 나누기)
        const avgRecord = records.reduce((sum, record) => sum + record, 0) / records.length;
        // 디버깅: 평균 계산 결과 확인
        logger.debug('계산된 평균:', avgRecord);
        // 평균 기록을 순위표 제목에 표시
        const avgRecordDisplay = this.$('#avg-record-display');
        if (avgRecordDisplay) {
            avgRecordDisplay.textContent = `평균 기록: ${avgRecord.toFixed(2)}`;
        }
        // 개인 기록이 있는 경우 순위와 상위% 계산
        if (personalRecord !== null) {
            // 순위 계산을 위해 정렬된 배열 생성
            const sortedRecords = recordsWithNames.sort((a, b) => b.record - a.record);
            const rank = this.findRankForRecord(sortedRecords, personalRecord);
            // 상위% 계산: 작은 숫자가 좋은 경우 (낮은 순위가 좋음)
            const percentile = ((records.length - rank + 1) / records.length * 100).toFixed(1);
            this.$('#personal-rank').textContent = `${rank}위`;
            this.$('#personal-rank-card').style.display = 'block';
        }
        else {
            this.$('#personal-rank-card').style.display = 'none';
        }
        // 현재 랭킹 데이터 저장
        this.currentRankingRecords = recordsWithNames;
        this.selectedStudentForChart = null; // 초기화
        // 순위 테이블 생성
        this.renderRankingTable(recordsWithNames, studentName);
        // 결과 섹션 표시
        this.$('#ranking-results').style.display = 'block';
        // 실시간 업데이트 시작
        this.startRealtimeUpdate(eventId, grade, gender, studentName, cls);
    }
    /**
     * 같은 기록을 가진 경우 동일한 순위를 부여합니다.
     * @param sortedRecords 정렬된 기록 배열 (내림차순)
     * @returns 각 항목의 순위를 포함한 배열
     */
    calculateRanks(sortedRecords) {
        const ranks = [];
        for (let i = 0; i < sortedRecords.length; i++) {
            // 첫 번째 항목이거나 이전 기록과 다른 경우 새로운 순위 시작
            if (i === 0 || sortedRecords[i].record !== sortedRecords[i - 1].record) {
                // 현재 위치가 순위 (1부터 시작)
                ranks.push(i + 1);
            }
            else {
                // 이전 기록과 같은 경우 이전 순위와 동일
                ranks.push(ranks[i - 1]);
            }
        }
        return ranks;
    }
    /**
     * 특정 기록의 순위를 찾습니다.
     * @param sortedRecords 정렬된 기록 배열 (내림차순)
     * @param targetRecord 찾을 기록
     * @returns 순위 (1부터 시작)
     */
    findRankForRecord(sortedRecords, targetRecord) {
        const ranks = this.calculateRanks(sortedRecords);
        const index = sortedRecords.findIndex(item => item.record === targetRecord);
        return index >= 0 ? ranks[index] : 0;
    }
    /**
     * 순위 테이블을 렌더링합니다.
     * @param recordsWithNames 기록과 이름 배열
     * @param studentName 학생 이름 (선택사항)
     * @param resetPage 페이지를 1로 초기화할지 여부 (기본값: true)
     */
    renderRankingTable(recordsWithNames, studentName, resetPage = true) {
        // 기록을 내림차순으로 정렬
        const sortedRecords = recordsWithNames.sort((a, b) => b.record - a.record);
        // 순위 계산
        const ranks = this.calculateRanks(sortedRecords);
        // 페이지네이션 설정
        const itemsPerPage = 10;
        const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
        // 현재 페이지 초기화 (새로운 랭킹 조회 시만)
        if (resetPage) {
            this.currentRankingPage = 1;
        }
        // 현재 페이지가 총 페이지 수를 초과하는 경우 조정
        if (this.currentRankingPage > totalPages && totalPages > 0) {
            this.currentRankingPage = totalPages;
        }
        // 테이블 렌더링 함수
        const renderTable = (page) => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, sortedRecords.length);
            const pageRecords = sortedRecords.slice(startIndex, endIndex);
            const tbody = this.$('#ranking-table-body');
            if (!tbody)
                return;
            // 기존 내용 제거
            tbody.innerHTML = '';
            // DOM API를 사용하여 직접 행 생성
            pageRecords.forEach((item, index) => {
                const globalIndex = startIndex + index;
                const rank = ranks[globalIndex];
                const isPersonalRecord = studentName && item.name === studentName;
                const tr = document.createElement('tr');
                tr.dataset.rank = String(rank);
                if (isPersonalRecord) {
                    tr.className = 'table-warning';
                }
                // 순위 셀
                const tdRank = document.createElement('td');
                tdRank.style.textAlign = 'center';
                tdRank.style.fontWeight = 'bold';
                tdRank.style.color = '#007bff';
                tdRank.textContent = String(rank);
                tr.appendChild(tdRank);
                // 이름 셀 (클릭 가능)
                const tdName = document.createElement('td');
                tdName.style.textAlign = 'center';
                tdName.style.fontWeight = '500';
                tdName.style.cursor = 'pointer';
                tdName.style.color = this.selectedStudentForChart === item.name ? '#dc3545' : 'inherit';
                tdName.style.textDecoration = 'underline';
                tdName.textContent = item.name || '';
                tdName.addEventListener('click', () => {
                    // 선택된 학생 변경
                    this.selectedStudentForChart = this.selectedStudentForChart === item.name ? null : item.name;
                    // 그래프 다시 그리기
                    if (this.currentRankingRecords) {
                        this.drawStandardDeviationChart(this.currentRankingRecords, studentName);
                    }
                    // 테이블 다시 렌더링 (색상 업데이트)
                    renderTable(page);
                });
                tr.appendChild(tdName);
                // 기록 셀
                const tdRecord = document.createElement('td');
                tdRecord.style.textAlign = 'center';
                tdRecord.style.fontWeight = 'bold';
                tdRecord.style.color = '#28a745';
                tdRecord.textContent = String(item.record);
                tr.appendChild(tdRecord);
                // 퍼센트 계산: 낮은 순위일수록 높은 퍼센트 (1위 = 0%, 마지막 순위 = 100%에 가까움)
                const percentile = ((rank - 1) / sortedRecords.length * 100).toFixed(1);
                // 퍼센트 셀
                const tdPercent = document.createElement('td');
                tdPercent.style.textAlign = 'center';
                tdPercent.style.fontWeight = 'bold';
                tdPercent.style.color = '#6f42c1';
                tdPercent.textContent = `${percentile}%`;
                tr.appendChild(tdPercent);
                tbody.appendChild(tr);
            });
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
                if (this.currentRankingPage > 1) {
                    this.currentRankingPage--;
                    renderTable(this.currentRankingPage);
                }
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentRankingPage < totalPages) {
                    this.currentRankingPage++;
                    renderTable(this.currentRankingPage);
                }
            };
        }
        // 인쇄 버튼 이벤트 리스너 설정
        const printBtn = this.$('#print-ranking-btn');
        if (printBtn) {
            printBtn.onclick = () => {
                this.printRankingTable(sortedRecords, studentName);
            };
        }
        // 공유 기능 이벤트 리스너 설정
        this.setupShareControls(sortedRecords, studentName);
        // 표준편차 그래프 그리기
        this.drawStandardDeviationChart(sortedRecords, studentName);
        // 초기 테이블 렌더링
        renderTable(this.currentRankingPage);
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
            logError('실시간 공유 생성 실패:', error);
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
        const modalHtml = `
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
        setInnerHTMLSafe(modal, modalHtml);
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
     * 순위표를 인쇄합니다.
     */
    printRankingTable(sortedRecords, studentName) {
        // 순위 계산
        const ranks = this.calculateRanks(sortedRecords);
        // 인쇄용 임시 컨테이너 생성
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('팝업이 차단되어 인쇄할 수 없습니다. 브라우저 설정에서 팝업을 허용해주세요.');
            return;
        }
        const avgRecordDisplay = this.$('#avg-record-display');
        const avgText = avgRecordDisplay ? avgRecordDisplay.textContent : '평균 기록: -';
        // 인쇄용 HTML 생성
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PAPS 순위표</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        h1 {
            text-align: center;
            margin-bottom: 10px;
            font-size: 24px;
        }
        .avg-record {
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 auto;
        }
        th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: center;
            border: 1px solid #dee2e6;
            font-weight: bold;
        }
        td {
            padding: 10px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .personal-record {
            background-color: #fff3cd !important;
            font-weight: bold;
        }
        .rank {
            font-weight: bold;
            color: #007bff;
        }
        .record {
            font-weight: bold;
            color: #28a745;
        }
        .percent {
            font-weight: bold;
            color: #6f42c1;
        }
        @media print {
            body {
                margin: 0;
            }
            @page {
                margin: 1cm;
            }
        }
    </style>
</head>
<body>
    <h1>🏆 PAPS 순위표</h1>
    <div class="avg-record">${avgText}</div>
    <table>
        <thead>
            <tr>
                <th style="width: 80px;">순위</th>
                <th style="width: 200px;">이름</th>
                <th style="width: 120px;">기록</th>
                <th style="width: 100px;">상위%</th>
            </tr>
        </thead>
        <tbody>
`;
        sortedRecords.forEach((item, index) => {
            const rank = ranks[index];
            const percentile = ((rank - 1) / sortedRecords.length * 100).toFixed(1);
            const isPersonalRecord = studentName && item.name === studentName;
            const rowClass = isPersonalRecord ? 'personal-record' : '';
            html += `
            <tr class="${rowClass}">
                <td class="rank">${rank}위</td>
                <td>${item.name || ''}</td>
                <td class="record">${item.record}</td>
                <td class="percent">${percentile}%</td>
            </tr>
`;
        });
        html += `
        </tbody>
    </table>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        인쇄일시: ${new Date().toLocaleString('ko-KR')}
    </div>
</body>
</html>
`;
        printWindow.document.write(html);
        printWindow.document.close();
        // 인쇄 대화상자 표시
        setTimeout(() => {
            printWindow.print();
            // 인쇄 후 창 닫기 (선택사항)
            // printWindow.close();
        }, 250);
    }
    /**
     * 순위표를 텍스트로 복사합니다.
     */
    copyRankingAsText(sortedRecords, studentName) {
        const avgRecordDisplay = this.$('#avg-record-display');
        const avgText = avgRecordDisplay ? avgRecordDisplay.textContent : '평균 기록: -';
        // 순위 계산
        const ranks = this.calculateRanks(sortedRecords);
        let text = `🏆 PAPS 순위표\n`;
        text += `${avgText}\n\n`;
        text += `순위 | 이름 | 기록 | 상위%\n`;
        text += `-----|------|------|------\n`;
        sortedRecords.forEach((item, index) => {
            const rank = ranks[index];
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
        if (typeof window === 'undefined' || !window.XLSX) {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
            return;
        }
        try {
            const XLSX = window.XLSX;
            const wb = XLSX.utils.book_new();
            if (this.papsData.classes.length === 0) {
                alert('내보낼 반이 없습니다.');
                return;
            }
            // 각 반별로 시트 생성
            this.papsData.classes.forEach((cls) => {
                const data = [
                    ['반명', cls.name],
                    ['학년', cls.gradeLevel || '미설정'],
                    ['', ''], // 빈 줄
                ];
                // 이벤트 설정 정보
                if (cls.eventSettings && Object.keys(cls.eventSettings).length > 0) {
                    data.push(['항목 설정', '']);
                    Object.keys(PAPS_ITEMS).filter(k => k !== '체지방').forEach(category => {
                        const item = PAPS_ITEMS[category];
                        const eventName = cls.eventSettings?.[item.id] || item.options[0];
                        data.push([category, eventName]);
                    });
                    data.push(['', '']); // 빈 줄
                }
                // 헤더 생성
                const headers = ['번호', '이름', '성별', '키', '몸무게', 'BMI'];
                // PAPS 항목 헤더 추가
                Object.keys(PAPS_ITEMS).forEach(category => {
                    const item = PAPS_ITEMS[category];
                    const eventName = cls.eventSettings?.[item.id] || item.options[0];
                    if (item.id === 'bodyfat') {
                        headers.push('BMI');
                    }
                    else if (eventName === '악력') {
                        headers.push('악력(왼)', '악력(오)');
                    }
                    else {
                        headers.push(eventName);
                    }
                });
                // 등급 헤더 추가
                Object.keys(PAPS_ITEMS).forEach(category => {
                    const item = PAPS_ITEMS[category];
                    const eventName = cls.eventSettings?.[item.id] || item.options[0];
                    if (item.id === 'bodyfat') {
                        headers.push('BMI 등급');
                    }
                    else if (eventName === '악력') {
                        headers.push('악력(왼) 등급', '악력(오) 등급');
                    }
                    else {
                        headers.push(`${eventName} 등급`);
                    }
                });
                data.push(headers);
                // 학생 데이터
                if (cls.students && cls.students.length > 0) {
                    cls.students.forEach((student) => {
                        const row = [
                            student.number || '',
                            student.name || '',
                            student.gender || '',
                            student.records.height || '',
                            student.records.weight || '',
                            student.records.bmi || ''
                        ];
                        // PAPS 항목 데이터 추가
                        Object.keys(PAPS_ITEMS).forEach(category => {
                            const item = PAPS_ITEMS[category];
                            const eventName = cls.eventSettings?.[item.id] || item.options[0];
                            if (item.id === 'bodyfat') {
                                row.push(student.records.bmi || '');
                            }
                            else if (eventName === '악력') {
                                row.push(student.records[`${item.id}_left`] || '', student.records[`${item.id}_right`] || '');
                            }
                            else {
                                row.push(student.records[item.id] || '');
                            }
                        });
                        // 등급 데이터 추가
                        Object.keys(PAPS_ITEMS).forEach(category => {
                            const item = PAPS_ITEMS[category];
                            const eventName = cls.eventSettings?.[item.id] || item.options[0];
                            if (item.id === 'bodyfat') {
                                row.push(student.records[`${item.id}_grade`] || '');
                            }
                            else if (eventName === '악력') {
                                row.push(student.records[`${item.id}_left_grade`] || '', student.records[`${item.id}_right_grade`] || '');
                            }
                            else {
                                row.push(student.records[`${item.id}_grade`] || '');
                            }
                        });
                        data.push(row);
                    });
                }
                else {
                    data.push(['학생 데이터가 없습니다.', '', '', '', '', '']);
                }
                // 시트 생성
                const ws = XLSX.utils.aoa_to_sheet(data);
                // 컬럼 너비 설정
                const colWidths = headers.map(() => ({ wch: 15 }));
                ws['!cols'] = colWidths;
                // 시트 이름 (반 이름, 최대 31자)
                const sheetName = cls.name.length > 31 ? cls.name.substring(0, 31) : cls.name;
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            // 파일 저장
            const fileName = `PAPS_기록_전체_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showSuccess('모든 반의 PAPS 기록이 엑셀 파일로 내보내졌습니다.');
        }
        catch (error) {
            logError('엑셀 내보내기 오류:', error);
            showError(new Error('엑셀 파일 내보내기 중 오류가 발생했습니다.'));
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
        const input = event.target;
        if (!input.files || input.files.length === 0) {
            return;
        }
        const file = input.files[0];
        if (typeof window === 'undefined' || !window.XLSX) {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const XLSX = window.XLSX;
                const data = new Uint8Array(e.target?.result);
                const wb = XLSX.read(data, { type: 'array' });
                const importedClasses = [];
                // 각 시트를 순회하면서 데이터 파싱
                wb.SheetNames.forEach((sheetName) => {
                    const ws = wb.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    if (json.length < 5) {
                        return;
                    }
                    // 반 정보 파싱
                    let className = '';
                    let gradeLevel = '';
                    // 첫 번째 행: 반명
                    if (json[0] && json[0].length >= 2) {
                        className = String(json[0][1] || sheetName).trim();
                    }
                    else {
                        className = sheetName;
                    }
                    // 두 번째 행: 학년
                    if (json[1] && json[1].length >= 2) {
                        gradeLevel = String(json[1][1] || '').trim();
                    }
                    // 이벤트 설정 파싱 (항목 설정 섹션 찾기)
                    const eventSettings = {};
                    let headerRowIndex = -1;
                    // 항목 설정 섹션 찾기
                    for (let i = 0; i < json.length; i++) {
                        if (json[i] && json[i][0] === '항목 설정') {
                            // 항목 설정 섹션에서 이벤트 설정 추출
                            let j = i + 1;
                            while (j < json.length && json[j] && json[j][0] && json[j][0] !== '') {
                                const category = String(json[j][0] || '').trim();
                                const eventName = String(json[j][1] || '').trim();
                                if (category && eventName) {
                                    // 카테고리 이름으로 ID 찾기
                                    const categoryKey = Object.keys(PAPS_ITEMS).find(k => k === category);
                                    if (categoryKey) {
                                        eventSettings[PAPS_ITEMS[categoryKey].id] = eventName;
                                    }
                                }
                                j++;
                            }
                        }
                        // 헤더 행 찾기 (번호로 시작)
                        if (json[i] && json[i][0] === '번호') {
                            headerRowIndex = i;
                            break;
                        }
                    }
                    if (headerRowIndex === -1) {
                        return;
                    }
                    // 헤더 행에서 항목 정보 추출
                    const headers = json[headerRowIndex];
                    if (!headers || headers.length < 6) {
                        return;
                    }
                    // 학생 데이터 파싱
                    const students = [];
                    let studentIdCounter = 1;
                    for (let i = headerRowIndex + 1; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length < 3)
                            continue;
                        const number = row[0] ? parseInt(String(row[0]), 10) : studentIdCounter++;
                        const name = String(row[1] || '').trim();
                        const gender = (String(row[2] || '').trim() === '여자' || String(row[2] || '').trim() === '여') ? '여자' : '남자';
                        if (!name)
                            continue;
                        const records = {};
                        // 키, 몸무게, BMI
                        records.height = row[3] ? parseFloat(String(row[3])) : 0;
                        records.weight = row[4] ? parseFloat(String(row[4])) : 0;
                        records.bmi = row[5] ? parseFloat(String(row[5])) : 0;
                        // PAPS 항목 데이터 파싱 (헤더를 기반으로)
                        let colIndex = 6;
                        Object.keys(PAPS_ITEMS).forEach(category => {
                            const item = PAPS_ITEMS[category];
                            const eventName = eventSettings[item.id] || item.options[0];
                            if (item.id === 'bodyfat') {
                                if (colIndex < headers.length) {
                                    records[item.id] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                                // 등급
                                if (colIndex < headers.length && headers[colIndex] && String(headers[colIndex]).includes('등급')) {
                                    records[`${item.id}_grade`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                            }
                            else if (eventName === '악력') {
                                // 왼손
                                if (colIndex < headers.length) {
                                    records[`${item.id}_left`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                                // 오른손
                                if (colIndex < headers.length) {
                                    records[`${item.id}_right`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                                // 왼손 등급
                                if (colIndex < headers.length && headers[colIndex] && String(headers[colIndex]).includes('등급')) {
                                    records[`${item.id}_left_grade`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                                // 오른손 등급
                                if (colIndex < headers.length && headers[colIndex] && String(headers[colIndex]).includes('등급')) {
                                    records[`${item.id}_right_grade`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                            }
                            else {
                                // 일반 항목
                                if (colIndex < headers.length) {
                                    records[item.id] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                                // 등급
                                if (colIndex < headers.length && headers[colIndex] && String(headers[colIndex]).includes('등급')) {
                                    records[`${item.id}_grade`] = row[colIndex] ? parseFloat(String(row[colIndex])) : 0;
                                    colIndex++;
                                }
                            }
                        });
                        students.push({
                            id: Date.now() + Math.random() * 1000,
                            number: number,
                            name: name,
                            gender: gender,
                            records: records
                        });
                    }
                    // 반 생성
                    const classId = Date.now() + Math.random() * 1000;
                    const papsClass = {
                        id: classId,
                        name: className || sheetName,
                        gradeLevel: gradeLevel || '1학년',
                        students: students,
                        eventSettings: Object.keys(eventSettings).length > 0 ? eventSettings : undefined
                    };
                    importedClasses.push(papsClass);
                });
                if (importedClasses.length === 0) {
                    alert('엑셀 파일에서 데이터를 읽을 수 없습니다.');
                    return;
                }
                // 기존 데이터를 가져온 데이터로 교체
                this.papsData.classes = importedClasses;
                if (importedClasses.length > 0) {
                    this.papsData.activeClassId = importedClasses[0].id;
                }
                this.saveDataToFirestore();
                this.renderPapsUI();
                showSuccess(`${importedClasses.length}개 반의 PAPS 기록이 가져와졌습니다.`);
            }
            catch (error) {
                logError('엑셀 가져오기 오류:', error);
                showError(new Error('엑셀 파일을 읽는 중 오류가 발생했습니다.'));
            }
        };
        reader.readAsArrayBuffer(file);
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
     * 정규 분포 곡선과 표준편차를 표시하는 그래프를 그립니다.
     */
    drawStandardDeviationChart(sortedRecords, studentName) {
        const canvas = this.$('#ranking-distribution-chart');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // 캔버스 크기 설정
        canvas.width = 800;
        canvas.height = 600;
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
        const variance = records.reduce((sum, record) => sum + Math.pow(record - mean, 2), 0) / records.length;
        const stdDev = Math.sqrt(variance);
        const minRecord = Math.min(...records);
        const maxRecord = Math.max(...records);
        const recordRange = maxRecord - minRecord;
        // 정규 분포 함수 (확률 밀도 함수)
        const normalPDF = (x, mu, sigma) => {
            const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
            const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
            return coefficient * Math.exp(exponent);
        };
        // 그래프 범위 설정 (평균 ± 4σ 또는 min/max 중 더 넓은 범위)
        const graphMin = Math.min(minRecord, mean - 4 * stdDev);
        const graphMax = Math.max(maxRecord, mean + 4 * stdDev);
        const graphRange = graphMax - graphMin;
        // 정규 분포 곡선의 최대값 계산 (평균에서의 PDF 값)
        const maxPDF = normalPDF(mean, mean, stdDev);
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
        // 표준편차 구간 표시 (배경색)
        const sigmaColors = [
            { range: 1, color: 'rgba(255, 235, 59, 0.2)' }, // ±1σ
            { range: 2, color: 'rgba(255, 152, 0, 0.15)' }, // ±2σ
            { range: 3, color: 'rgba(255, 87, 34, 0.1)' } // ±3σ
        ];
        for (const { range, color } of sigmaColors) {
            const leftX = margin.left + ((mean - range * stdDev - graphMin) / graphRange) * chartWidth;
            const rightX = margin.left + ((mean + range * stdDev - graphMin) / graphRange) * chartWidth;
            const width = rightX - leftX;
            ctx.fillStyle = color;
            ctx.fillRect(leftX, margin.top, width, chartHeight);
        }
        // 표준편차 구간 수직선 표시
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        for (let sigma = -3; sigma <= 3; sigma++) {
            if (sigma === 0)
                continue; // 평균선은 나중에 따로 그리기
            const x = margin.left + ((mean + sigma * stdDev - graphMin) / graphRange) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + chartHeight);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        // 정규 분포 곡선 그리기
        const numPoints = 200;
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
            const x = graphMin + (graphRange * i) / numPoints;
            const pdfValue = normalPDF(x, mean, stdDev);
            const normalizedValue = pdfValue / maxPDF; // 0~1로 정규화
            const chartX = margin.left + ((x - graphMin) / graphRange) * chartWidth;
            const chartY = margin.top + chartHeight - (normalizedValue * chartHeight);
            if (i === 0) {
                ctx.moveTo(chartX, chartY);
            }
            else {
                ctx.lineTo(chartX, chartY);
            }
        }
        ctx.stroke();
        // 정규 분포 곡선 아래 영역 채우기
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.closePath();
        ctx.fill();
        // 평균선 그리기 (수직선)
        const meanX = margin.left + ((mean - graphMin) / graphRange) * chartWidth;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(meanX, margin.top);
        ctx.lineTo(meanX, margin.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        // 선택된 학생 기록 표시 (빨간색 점)
        if (this.selectedStudentForChart) {
            const selectedRecord = sortedRecords.find(item => item.name === this.selectedStudentForChart)?.record;
            if (selectedRecord !== undefined && selectedRecord >= graphMin && selectedRecord <= graphMax) {
                const selectedX = margin.left + ((selectedRecord - graphMin) / graphRange) * chartWidth;
                const selectedPDF = normalPDF(selectedRecord, mean, stdDev);
                const selectedNormalized = selectedPDF / maxPDF;
                const selectedY = margin.top + chartHeight - (selectedNormalized * chartHeight);
                // 수직 점선 (위에서 아래로)
                ctx.strokeStyle = '#dc3545';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(selectedX, margin.top);
                ctx.lineTo(selectedX, selectedY);
                ctx.stroke();
                ctx.setLineDash([]);
                // 빨간색 점
                ctx.fillStyle = '#dc3545';
                ctx.beginPath();
                ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
                ctx.fill();
                // 점 테두리
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                // 기록 값 표시
                ctx.fillStyle = '#dc3545';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${selectedRecord}`, selectedX, selectedY - 15);
                // 학생 이름 표시
                ctx.font = 'bold 12px Arial';
                ctx.fillText(this.selectedStudentForChart, selectedX, selectedY - 35);
            }
        }
        // 개인 기록 표시 (검색한 학생이 있는 경우)
        if (studentName && !this.selectedStudentForChart) {
            const personalRecord = sortedRecords.find(item => item.name === studentName)?.record;
            if (personalRecord !== undefined && personalRecord >= graphMin && personalRecord <= graphMax) {
                const personalX = margin.left + ((personalRecord - graphMin) / graphRange) * chartWidth;
                const personalPDF = normalPDF(personalRecord, mean, stdDev);
                const personalNormalized = personalPDF / maxPDF;
                const personalY = margin.top + chartHeight - (personalNormalized * chartHeight);
                // 수직 점선
                ctx.strokeStyle = '#dc3545';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(personalX, margin.top);
                ctx.lineTo(personalX, personalY);
                ctx.stroke();
                ctx.setLineDash([]);
                // 빨간색 점
                ctx.fillStyle = '#dc3545';
                ctx.beginPath();
                ctx.arc(personalX, personalY, 8, 0, Math.PI * 2);
                ctx.fill();
                // 점 테두리
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                // 기록 값 표시
                ctx.fillStyle = '#dc3545';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${personalRecord}`, personalX, personalY - 15);
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
        // Y축 레이블 (확률 밀도 - 정규화된 값)
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const normalizedValue = i / 5; // 0~1
            const pdfValue = normalizedValue * maxPDF;
            const y = margin.top + chartHeight - (normalizedValue * chartHeight);
            ctx.fillText(pdfValue.toFixed(3), margin.left - 20, y + 5);
        }
        // X축 레이블 (기록 값)
        ctx.textAlign = 'center';
        ctx.font = '11px Arial';
        const numXTicks = 8;
        for (let i = 0; i <= numXTicks; i++) {
            const value = graphMin + (graphRange * i) / numXTicks;
            const x = margin.left + ((value - graphMin) / graphRange) * chartWidth;
            // 표준편차 구간 표시
            const sigmaValue = (value - mean) / stdDev;
            let label = value.toFixed(1);
            if (Math.abs(sigmaValue) < 0.1) {
                label = `μ (${value.toFixed(1)})`;
            }
            else if (Math.abs(Math.abs(sigmaValue) - 1) < 0.1) {
                label = `μ${sigmaValue > 0 ? '+' : ''}σ (${value.toFixed(1)})`;
            }
            else if (Math.abs(Math.abs(sigmaValue) - 2) < 0.1) {
                label = `μ${sigmaValue > 0 ? '+' : ''}2σ (${value.toFixed(1)})`;
            }
            else if (Math.abs(Math.abs(sigmaValue) - 3) < 0.1) {
                label = `μ${sigmaValue > 0 ? '+' : ''}3σ (${value.toFixed(1)})`;
            }
            ctx.fillText(label, x, margin.top + chartHeight + 20);
        }
        // 제목
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('정규 분포 그래프 (표준편차)', canvas.width / 2, 30);
        // 축 제목
        ctx.font = 'bold 14px Arial';
        ctx.save();
        ctx.translate(25, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('확률 밀도', 0, 0);
        ctx.restore();
        ctx.textAlign = 'center';
        ctx.fillText('기록 값', canvas.width / 2, canvas.height - 20);
        // 통계 정보 표시 (오른쪽 상단)
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`평균(μ): ${mean.toFixed(1)}`, margin.left + chartWidth - 10, margin.top - 25);
        ctx.fillText(`표준편차(σ): ${stdDev.toFixed(2)}`, margin.left + chartWidth - 10, margin.top - 10);
        ctx.fillText(`최고: ${maxRecord}`, margin.left + chartWidth - 10, margin.top + 5);
        ctx.fillText(`최저: ${minRecord}`, margin.left + chartWidth - 10, margin.top + 20);
        // 범례 (왼쪽 상단)
        const legendY = margin.top + 20;
        const legendX = margin.left + 10;
        const legendHeight = this.selectedStudentForChart ? 100 : 85;
        // 범례 배경
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(legendX, legendY, 150, legendHeight);
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, 150, legendHeight);
        // 범례 항목들
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        let legendItemY = legendY + 15;
        // 정규 분포 곡선 범례
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(legendX + 10, legendItemY);
        ctx.lineTo(legendX + 25, legendItemY);
        ctx.stroke();
        ctx.fillStyle = '#495057';
        ctx.fillText('정규 분포 곡선', legendX + 30, legendItemY + 4);
        legendItemY += 20;
        // 평균선 범례
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(legendX + 10, legendItemY);
        ctx.lineTo(legendX + 25, legendItemY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#495057';
        ctx.fillText('평균(μ)', legendX + 30, legendItemY + 4);
        legendItemY += 20;
        // 표준편차 구간 범례
        ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
        ctx.fillRect(legendX + 10, legendItemY - 5, 15, 10);
        ctx.fillStyle = '#495057';
        ctx.fillText('±1σ, ±2σ, ±3σ 구간', legendX + 30, legendItemY + 4);
        legendItemY += 20;
        // 선택된 학생 범례
        if (this.selectedStudentForChart) {
            ctx.fillStyle = '#dc3545';
            ctx.beginPath();
            ctx.arc(legendX + 17, legendItemY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#495057';
            ctx.fillText(`선택: ${this.selectedStudentForChart}`, legendX + 30, legendItemY + 4);
        }
        else if (studentName) {
            // 개인 기록 범례
            ctx.fillStyle = '#dc3545';
            ctx.beginPath();
            ctx.arc(legendX + 17, legendItemY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#495057';
            ctx.fillText('나의 기록', legendX + 30, legendItemY + 4);
        }
    }
    /**
     * 실시간 업데이트를 시작합니다.
     */
    startRealtimeUpdate(eventId, grade, gender, studentName, cls) {
        // 기존 업데이트 중지
        this.stopRealtimeUpdate();
        // 기존 타이머가 있으면 먼저 정리
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            logger.debug('기존 실시간 업데이트 타이머 정리');
        }
        // 현재 랭킹 데이터 저장
        this.currentRankingData = { event: eventId, grade, gender, studentName };
        // 5초마다 업데이트
        this.updateInterval = setInterval(() => {
            this.updateRankingData(cls);
        }, 5000);
        logger.debug('실시간 업데이트 시작:', this.currentRankingData);
    }
    /**
     * 실시간 업데이트를 중지합니다.
     */
    stopRealtimeUpdate() {
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            logger.debug('실시간 업데이트 중지: updateInterval 정리 완료');
        }
        this.currentRankingData = null;
    }
    /**
     * 랭킹 데이터를 업데이트합니다.
     */
    updateRankingData(cls) {
        if (!this.currentRankingData)
            return;
        const { event: eventId, grade, gender, studentName } = this.currentRankingData;
        // 해당 조건에 맞는 학생들의 기록 수집 (이름과 함께)
        const recordsWithNames = [];
        let personalRecord = null;
        this.papsData.classes.forEach(classItem => {
            if (classItem.gradeLevel === grade) {
                classItem.students.forEach(student => {
                    if (student.gender === gender) {
                        let record;
                        if (eventId === 'bodyfat') {
                            // BMI 계산
                            const height = student.records?.height;
                            const weight = student.records?.weight;
                            if (height && weight && height > 0 && weight > 0) {
                                record = weight / Math.pow(height / 100, 2);
                            }
                        }
                        else {
                            record = student.records?.[eventId];
                        }
                        if (record !== undefined && record !== null &&
                            typeof record === 'number' && !isNaN(record) &&
                            isFinite(record) && record > 0) {
                            recordsWithNames.push({ record, name: student.name });
                            if (studentName && student.name === studentName) {
                                personalRecord = record;
                            }
                        }
                    }
                });
            }
        });
        if (recordsWithNames.length === 0) {
            logger.debug('업데이트할 데이터가 없습니다.');
            return;
        }
        // 기록 정렬 (내림차순)
        const sortedRecords = recordsWithNames.sort((a, b) => b.record - a.record);
        const records = sortedRecords.map(item => item.record);
        // 평균 기록 계산
        const avgRecord = records.reduce((sum, record) => sum + record, 0) / records.length;
        // 평균 기록을 순위표 제목에 표시
        const avgRecordDisplay = this.$('#avg-record-display');
        if (avgRecordDisplay) {
            avgRecordDisplay.textContent = `평균 기록: ${avgRecord.toFixed(2)}`;
        }
        // 개인 기록이 있는 경우 순위와 상위% 계산
        if (personalRecord !== null) {
            const rank = this.findRankForRecord(sortedRecords, personalRecord);
            this.$('#personal-rank').textContent = `${rank}위`;
            this.$('#personal-rank-card').style.display = 'block';
        }
        else {
            this.$('#personal-rank-card').style.display = 'none';
        }
        // 현재 랭킹 데이터 업데이트
        this.currentRankingRecords = recordsWithNames;
        // 순위 테이블 업데이트 (현재 페이지 유지)
        this.renderRankingTable(recordsWithNames, studentName, false);
        const personalRank = personalRecord ? this.findRankForRecord(sortedRecords, personalRecord) : null;
        logger.debug('랭킹 데이터 업데이트 완료:', {
            totalRecords: records.length,
            avgRecord: avgRecord.toFixed(2),
            personalRank: personalRank
        });
    }
    /**
     * 랭킹을 닫습니다.
     */
    closeRanking() {
        // 실시간 업데이트 중지
        this.stopRealtimeUpdate();
        // 결과 섹션 숨기기
        this.$('#ranking-results').style.display = 'none';
        logger.debug('랭킹 닫기 완료');
    }
    /**
     * 사이드바를 정리합니다.
     * sidebar-list-container는 renderPapsClassList()에서 관리하므로 여기서 비우지 않습니다.
     */
    cleanupSidebar() {
        // sidebar-form-container만 비우고, sidebar-list-container는 renderPapsClassList에서 관리
        const formContainer = this.$('#sidebar-form-container');
        if (formContainer) {
            formContainer.innerHTML = '';
        }
        // sidebar-list-container는 renderPapsClassList()에서 다시 채우므로 여기서 비우지 않음
    }
    /**
     * 유효 기간 입력 모달을 표시합니다.
     * @returns Promise<number | null> 입력된 일수 또는 null (취소 시)
     */
    async showExpiresDaysModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.id = 'paps-expires-modal';
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
                <div style="background: white; padding: 32px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="margin: 0 0 8px 0; text-align: center; color: #333;">📅 QR 코드 유효 기간 설정</h2>
                    <p style="margin: 0 0 24px 0; text-align: center; color: #666;">QR 코드가 유효한 기간을 설정하세요</p>
                    
                    <form id="expires-form" style="margin-bottom: 16px;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">유효 기간 (일)</label>
                            <input 
                                type="number" 
                                id="expires-days-input" 
                                required 
                                min="1"
                                max="3650"
                                value="365"
                                style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;"
                                placeholder="예: 365"
                            />
                            <div style="margin-top: 8px; font-size: 12px; color: #666;">
                                권장: 365일 (1년)
                            </div>
                        </div>
                        <div id="expires-error" style="color: #dc3545; margin-bottom: 16px; text-align: center; display: none;"></div>
                        <button 
                            type="submit" 
                            style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;"
                        >
                            생성하기
                        </button>
                    </form>
                    <button 
                        id="close-expires-modal" 
                        style="width: 100%; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 8px;"
                    >
                        취소
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
            const form = modal.querySelector('#expires-form');
            const daysInput = modal.querySelector('#expires-days-input');
            const errorDiv = modal.querySelector('#expires-error');
            const closeBtn = modal.querySelector('#close-expires-modal');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const days = parseInt(daysInput.value);
                if (isNaN(days) || days < 1 || days > 3650) {
                    errorDiv.textContent = '1일 이상 3650일 이하로 입력해주세요.';
                    errorDiv.style.display = 'block';
                    return;
                }
                document.body.removeChild(modal);
                resolve(days);
            });
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
        });
    }
    /**
     * QR 코드를 로컬 스토리지에서 불러옵니다.
     * @param shareId 공유 ID
     * @returns QR 코드 URL 또는 null
     */
    loadQRCodeFromStorage(shareId) {
        try {
            const storageKey = `paps_qr_${shareId}`;
            const stored = localStorage.getItem(storageKey);
            if (!stored) {
                return null;
            }
            const data = JSON.parse(stored);
            const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
            // 만료 시간 확인
            if (expiresAt && new Date() > expiresAt) {
                localStorage.removeItem(storageKey);
                return null;
            }
            return data.qrCodeUrl || null;
        }
        catch (error) {
            logError('QR 코드 불러오기 실패:', error);
            return null;
        }
    }
    /**
     * QR 코드를 Firebase Storage에서 불러옵니다.
     * @deprecated Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화됨
     * @param shareId 공유 ID
     * @returns 항상 null (Firebase Storage 미사용)
     */
    async loadQRCodeFromFirebaseStorage(shareId) {
        // Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화
        return null;
    }
    /**
     * QR 코드를 로컬 스토리지에 저장합니다.
     * @param shareId 공유 ID
     * @param qrCodeUrl QR 코드 URL
     * @param shareUrl 공유 URL (검증용)
     * @param expiresAt 만료 시간 (선택사항, 기본값: 1년)
     */
    async saveQRCodeToStorage(shareId, qrCodeUrl, shareUrl, expiresAt) {
        try {
            // QR 코드 이미지를 base64로 변환하여 저장
            // CSP 위반 시 이미지 태그를 사용하여 우회
            let blob;
            try {
                const response = await fetch(qrCodeUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                blob = await response.blob();
            }
            catch (fetchError) {
                // CSP 위반 시 이미지 태그를 사용하여 우회
                if (fetchError?.message?.includes('CSP') ||
                    fetchError?.message?.includes('blocked') ||
                    fetchError?.message?.includes('Failed to fetch')) {
                    // 이미지 태그를 사용하여 base64로 변환
                    const base64 = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    reject(new Error('Canvas context를 가져올 수 없습니다.'));
                                    return;
                                }
                                ctx.drawImage(img, 0, 0);
                                const dataUrl = canvas.toDataURL('image/png');
                                resolve(dataUrl);
                            }
                            catch (err) {
                                reject(err);
                            }
                        };
                        img.onerror = () => reject(new Error('이미지 로드 실패'));
                        img.src = qrCodeUrl;
                    });
                    // 만료 시간 설정 (기본값: 1년)
                    const expirationDate = expiresAt || (() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 1);
                        return date;
                    })();
                    const storageKey = `paps_qr_${shareId}`;
                    const data = {
                        qrCodeUrl: base64, // base64로 저장
                        shareUrl,
                        expiresAt: expirationDate.toISOString(),
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    logger.debug(`로컬 스토리지에 QR 코드 저장 완료 (이미지 태그 사용): ${shareId}`);
                    return;
                }
                throw fetchError;
            }
            // Blob을 base64로 변환
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result;
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            // 만료 시간 설정 (기본값: 1년)
            const expirationDate = expiresAt || (() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                return date;
            })();
            const storageKey = `paps_qr_${shareId}`;
            const data = {
                qrCodeUrl: base64, // base64로 저장
                shareUrl,
                expiresAt: expirationDate.toISOString(),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
            logger.debug(`로컬 스토리지에 QR 코드 저장 완료: ${shareId}`);
        }
        catch (error) {
            // 저장 실패해도 조용히 처리 (에러 로그만)
            logger.debug(`로컬 스토리지 QR 코드 저장 실패: ${shareId}`, error);
            // 저장 실패해도 계속 진행
        }
    }
    /**
     * QR 코드를 Firebase Storage에 저장합니다.
     * @deprecated Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화됨
     * @param shareId 공유 ID
     * @param qrCodeUrl QR 코드 URL
     * @param expiresAt 만료 시간 (선택사항)
     */
    async saveQRCodeToFirebaseStorage(shareId, qrCodeUrl, expiresAt) {
        // Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화
        // 아무 작업도 수행하지 않음
    }
    /**
     * 학생의 공유 데이터를 Firestore에 자동 업데이트합니다.
     * 기록이 변경될 때마다 호출됩니다.
     * @param student 학생 객체
     * @param cls 반 객체
     * @param tr 테이블 행 요소
     */
    async updateStudentShareData(student, cls, tr) {
        try {
            // Firebase 초기화 확인
            if (!window.firebase) {
                // Firebase가 아직 초기화되지 않았으면 건너뜀
                return;
            }
            // ShareManager 인스턴스 생성
            const { createShareManager } = await import('./shareManager.js');
            const shareManager = createShareManager({
                firebaseDb: typeof window !== 'undefined' ? window.firebase?.db : undefined,
                $: (selector) => document.querySelector(selector)
            });
            // 기존 shareId 찾기
            let shareId;
            const existingShare = await shareManager.findExistingPapsStudentShare(cls.id, student.id);
            if (existingShare && existingShare.shareId) {
                // 기존 QR 코드 재사용
                shareId = existingShare.shareId;
            }
            else {
                // 기존 QR 코드가 없으면 자동으로 새로 생성
                shareId = shareManager.generateShareId(16);
                logger.debug(`새 shareId 자동 생성: ${student.name} (${shareId})`);
            }
            // 학생의 등급 정보 수집
            const grades = {};
            const gradeCells = tr.querySelectorAll('.grade-cell');
            gradeCells.forEach(cell => {
                const dataId = cell.dataset.id;
                const grade = cell.textContent?.trim() || '';
                if (dataId && grade) {
                    grades[dataId] = grade;
                }
            });
            // 종합 등급 계산
            const overallGradeCell = tr?.querySelector('.overall-grade-cell');
            const overallGrade = overallGradeCell?.textContent?.trim() || '';
            // 종목명 수집 (eventSettings에서)
            const eventNames = {};
            Object.keys(PAPS_ITEMS).forEach(category => {
                const item = PAPS_ITEMS[category];
                const eventName = cls.eventSettings?.[item.id] || item.options[0];
                // 성별에 따라 팔굽혀펴기 종목명 변경
                if (eventName === '팔굽혀펴기' && student.gender === '여자') {
                    eventNames[item.id] = '무릎대고팔굽혀펴기';
                }
                else {
                    eventNames[item.id] = eventName;
                }
            });
            // 체지방은 BMI로 고정
            eventNames['bodyfat'] = 'BMI';
            // 유효 기간은 기존 것 유지 (또는 기본값 365일)
            const expiresAt = existingShare?.expiresAt
                ? new Date(existingShare.expiresAt)
                : (() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 365);
                    return date;
                })();
            // 공유 데이터 업데이트
            await shareManager.saveSharedPapsStudent({
                shareId,
                classId: cls.id,
                className: cls.name,
                studentId: student.id,
                studentName: student.name,
                studentNumber: student.number,
                studentGender: student.gender,
                gradeLevel: cls.gradeLevel || '',
                records: student.records || {},
                grades,
                eventNames,
                overallGrade,
                expiresAt
            });
            logger.debug(`학생 공유 데이터 자동 업데이트 완료: ${student.name} (${shareId})`);
        }
        catch (error) {
            // 에러는 상위에서 처리하므로 여기서는 로그만 남김
            logError('학생 공유 데이터 자동 업데이트 중 오류:', error);
            throw error;
        }
    }
    /**
     * 반별 모든 학생의 QR 코드를 생성합니다.
     * @param expiresInDays 유효 기간 (일 단위, 기본값: 365일)
     */
    async generateClassQRCodes(expiresInDays = 365) {
        const cls = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!cls) {
            showError('반을 선택해주세요.');
            return;
        }
        if (cls.students.length === 0) {
            showError('학생이 없습니다.');
            return;
        }
        // QR 생성 중 오버레이 표시
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'paps-qr-loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loadingOverlay.innerHTML = `
            <div style="background: white; padding: 20px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-align: center; font-size: 16px; color: #333; min-width: 240px;">
                <div style="margin-bottom: 10px; font-weight: 600;">QR을 생성중입니다</div>
                <div style="font-size: 13px; color: #666;">잠시만 기다려주세요...</div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
        try {
            // Firebase 초기화 대기
            if (!window.firebase) {
                await new Promise((resolve) => {
                    if (window.firebase) {
                        resolve();
                        return;
                    }
                    const handler = () => {
                        window.removeEventListener('firebaseReady', handler);
                        resolve();
                    };
                    window.addEventListener('firebaseReady', handler, { once: true });
                    setTimeout(() => {
                        window.removeEventListener('firebaseReady', handler);
                        resolve();
                    }, 10000); // 최대 10초 대기
                });
            }
            const { createShareManager } = await import('./shareManager.js');
            const shareManager = createShareManager({
                firebaseDb: typeof window !== 'undefined' ? window.firebase?.db : undefined,
                $: (selector) => document.querySelector(selector)
            });
            const studentQRCodes = [];
            // 유효 기간 계산
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
            // 각 학생별로 QR 코드 생성 또는 재사용
            for (const student of cls.students) {
                const tr = document.querySelector(`tr[data-sid="${student.id}"]`);
                // 학생의 등급 계산
                const grades = {};
                if (tr) {
                    const gradeCells = tr.querySelectorAll('.grade-cell');
                    gradeCells.forEach(cell => {
                        const dataId = cell.dataset.id;
                        const grade = cell.textContent?.trim() || '';
                        if (dataId && grade) {
                            grades[dataId] = grade;
                        }
                    });
                }
                // 종합 등급 계산
                const overallGradeCell = tr?.querySelector('.overall-grade-cell');
                const overallGrade = overallGradeCell?.textContent?.trim() || '';
                // 종목명 수집 (eventSettings에서)
                const eventNames = {};
                Object.keys(PAPS_ITEMS).forEach(category => {
                    const item = PAPS_ITEMS[category];
                    const eventName = cls.eventSettings?.[item.id] || item.options[0];
                    // 성별에 따라 팔굽혀펴기 종목명 변경
                    if (eventName === '팔굽혀펴기' && student.gender === '여자') {
                        eventNames[item.id] = '무릎대고팔굽혀펴기';
                    }
                    else {
                        eventNames[item.id] = eventName;
                    }
                });
                // 체지방은 BMI로 고정
                eventNames['bodyfat'] = 'BMI';
                // 기존 QR 코드 확인
                let shareId;
                const existingShare = await shareManager.findExistingPapsStudentShare(cls.id, student.id);
                if (existingShare && existingShare.shareId) {
                    // 기존 QR 코드 재사용
                    shareId = existingShare.shareId;
                    logger.debug(`기존 QR 코드 재사용: ${student.name} (${shareId})`);
                }
                else {
                    // 새로운 QR 코드 생성
                    shareId = shareManager.generateShareId(16);
                    logger.debug(`새 QR 코드 생성: ${student.name} (${shareId})`);
                }
                // 공유 데이터 저장 (기존 것이면 업데이트, 새 것이면 생성)
                await shareManager.saveSharedPapsStudent({
                    shareId,
                    classId: cls.id,
                    className: cls.name,
                    studentId: student.id,
                    studentName: student.name,
                    studentNumber: student.number,
                    studentGender: student.gender,
                    gradeLevel: cls.gradeLevel || '',
                    records: student.records || {},
                    grades,
                    eventNames,
                    overallGrade,
                    expiresAt
                });
                // 공유 링크 생성
                const shareUrl = shareManager.generatePapsShareUrl(shareId);
                // 로컬 스토리지 → API 생성 방식 (Firebase Storage 제거)
                let qrCodeUrl = this.loadQRCodeFromStorage(shareId);
                if (!qrCodeUrl) {
                    // 로컬에 없으면 API로 생성
                    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
                    // 생성된 QR 코드를 로컬 스토리지에 저장 (비동기)
                    this.saveQRCodeToStorage(shareId, qrCodeUrl, shareUrl, expiresAt).catch(error => {
                        logError('QR 코드 저장 실패:', error);
                    });
                }
                studentQRCodes.push({
                    studentId: student.id,
                    studentName: student.name,
                    studentNumber: student.number,
                    shareId,
                    shareUrl,
                    qrCodeUrl
                });
            }
            // QR 코드 출력 모달 표시
            this.showQRPrintModal(cls.name, studentQRCodes, expiresAt);
        }
        catch (error) {
            logError('QR 코드 생성 실패:', error);
            showError('QR 코드 생성에 실패했습니다.');
        }
        finally {
            // 로딩 오버레이 제거
            if (document.body.contains(loadingOverlay)) {
                document.body.removeChild(loadingOverlay);
            }
        }
    }
    /**
     * QR 코드 출력 모달을 표시합니다.
     * @param className 반 이름
     * @param studentQRCodes 학생 QR 코드 목록
     * @param expiresAt 만료일
     */
    showQRPrintModal(className, studentQRCodes, expiresAt) {
        const modal = document.createElement('div');
        modal.id = 'paps-qr-print-modal';
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
            padding: 20px;
            box-sizing: border-box;
        `;
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 1200px; width: 100%; max-height: calc(100vh - 40px); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; overflow: hidden;">
                <!-- 헤더 영역 (고정) -->
                <div style="padding: 24px 32px; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
                    <h2 style="margin: 0 0 8px 0; text-align: center; color: #333; font-size: 24px;">📱 QR 코드 생성 완료</h2>
                    <p style="margin: 0; text-align: center; color: #666; font-size: 16px;">${className} - ${studentQRCodes.length}명</p>
                    <p style="margin: 8px 0 0 0; text-align: center; color: #999; font-size: 13px;">💡 QR을 클릭하면 큰 이미지를 볼 수 있습니다</p>
                </div>
                
                <!-- 컨트롤 영역 (고정) -->
                <div style="padding: 16px 32px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
                    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 16px;">
                        <div style="font-size: 14px;">
                            <strong>유효 기간:</strong> ${expiresAt.toLocaleDateString()}까지
                        </div>
                        <div style="flex: 1;"></div>
                        <button id="save-qr-codes-btn" class="btn" style="padding: 8px 16px; font-size: 14px; background: #28a745; color: white;">💾 QR 저장하기</button>
                        <button id="print-all-btn" class="btn primary" style="padding: 8px 16px; font-size: 14px;">전체 인쇄</button>
                        <button id="close-qr-modal-btn" class="btn" style="padding: 8px 16px; font-size: 14px;">닫기</button>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">인쇄 옵션:</label>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="radio" name="print-option" value="6" checked>
                                <span>한 페이지에 6명</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="radio" name="print-option" value="12">
                                <span>한 페이지에 12명</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="radio" name="print-option" value="16">
                                <span>한 페이지에 16명</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer%;">
                                <input type="radio" name="print-option" value="20">
                                <span>한 페이지에 20명</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- QR 코드 목록 영역 (스크롤 가능, 2단 컬럼) -->
                <div id="qr-preview-container" style="flex: 1; overflow-y: auto; padding: 16px 32px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                    ${studentQRCodes.map((item, index) => `
                        <div class="qr-card" data-student-id="${item.studentId}" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; background: #fff;">
                            <div style="flex-shrink: 0;">
                                <img src="${item.qrCodeUrl}" alt="QR Code" class="qr-preview-image" style="width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 4px; display: block; cursor: pointer;">
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #333;">${item.studentName}</div>
                                <div style="color: #666; margin-bottom: 6px; font-size: 14px;">번호: ${item.studentNumber}</div>
                                <div style="font-size: 11px; color: #999; word-break: break-all; line-height: 1.4;">${item.shareUrl}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // 인쇄 기능 및 이벤트 바인딩
        const printAllBtn = modal.querySelector('#print-all-btn');
        const closeBtn = modal.querySelector('#close-qr-modal-btn');
        const saveBtn = modal.querySelector('#save-qr-codes-btn');
        const qrImages = modal.querySelectorAll('.qr-preview-image');
        // 저장하기 버튼 이벤트
        if (saveBtn) {
            const saveButton = saveBtn;
            saveButton.addEventListener('click', async () => {
                saveButton.disabled = true;
                saveButton.textContent = '💾 저장 중...';
                try {
                    let savedCount = 0;
                    for (const item of studentQRCodes) {
                        await this.saveQRCodeToStorage(item.shareId, item.qrCodeUrl, item.shareUrl, expiresAt);
                        savedCount++;
                    }
                    // 반별 QR 코드 목록도 저장
                    const cls = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
                    if (cls) {
                        const classStorageKey = `paps_qr_class_${cls.id}`;
                        const classData = {
                            classId: cls.id,
                            className: cls.name,
                            studentQRCodes: studentQRCodes,
                            expiresAt: expiresAt.toISOString(),
                            savedAt: new Date().toISOString()
                        };
                        localStorage.setItem(classStorageKey, JSON.stringify(classData));
                    }
                    showSuccess(`${savedCount}개의 QR 코드가 로컬 스토리지에 저장되었습니다.`);
                    saveButton.textContent = '💾 저장 완료';
                    setTimeout(() => {
                        saveButton.textContent = '💾 QR 저장하기';
                        saveButton.disabled = false;
                    }, 2000);
                }
                catch (error) {
                    logError('QR 코드 저장 실패:', error);
                    showError('QR 코드 저장에 실패했습니다.');
                    saveButton.textContent = '💾 QR 저장하기';
                    saveButton.disabled = false;
                }
            });
        }
        // QR 이미지 클릭 시 확대 표시
        qrImages.forEach((img) => {
            img.addEventListener('click', () => {
                const src = img.src;
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 11000;
                `;
                overlay.innerHTML = `
                    <div style="position: relative; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        <img src="${src}" alt="QR Code" style="width: 320px; height: 320px; display: block;">
                        <button id="qr-zoom-close-btn" style="position: absolute; top: 4px; right: 4px; background: #333; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 16px; line-height: 1;">×</button>
                    </div>
                `;
                document.body.appendChild(overlay);
                const removeOverlay = () => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                };
                const closeBtnEl = overlay.querySelector('#qr-zoom-close-btn');
                if (closeBtnEl) {
                    closeBtnEl.addEventListener('click', removeOverlay);
                }
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        removeOverlay();
                    }
                });
            });
        });
        printAllBtn.addEventListener('click', () => {
            const selectedOption = modal.querySelector('input[name="print-option"]:checked')?.value || '6';
            this.printQRCodes(studentQRCodes, className, parseInt(selectedOption, 10));
        });
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    /**
     * QR 코드를 인쇄합니다.
     * @param studentQRCodes 학생 QR 코드 목록
     * @param className 반 이름
     * @param perPage 페이지당 학생 수
     */
    printQRCodes(studentQRCodes, className, perPage) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
            return;
        }
        // 그리드 설정 (6 / 12 / 16 / 20 각각 최적 배치)
        let gridCols;
        let gridRows;
        // A4 용지 크기: 210mm x 297mm, 여백 감안 실제 영역 약 200mm x 287mm
        let qrSize;
        let nameFontSize;
        let numberFontSize;
        let itemPadding;
        let gapSize;
        let pageWidth;
        let pageHeight;
        pageWidth = '200mm';
        pageHeight = '287mm';
        if (perPage === 6) {
            // 2열 x 3행 : 이름·번호를 크게, 여유 있게
            gridCols = 2;
            gridRows = 3;
            qrSize = '70mm';
            nameFontSize = '13pt';
            numberFontSize = '10pt';
            itemPadding = '3mm';
            gapSize = '2mm';
        }
        else if (perPage === 12) {
            // 3열 x 4행 : 반 전체를 1~2장에 나누기 좋은 기본값
            gridCols = 3;
            gridRows = 4;
            qrSize = '45mm';
            nameFontSize = '11pt';
            numberFontSize = '8pt';
            itemPadding = '2mm';
            gapSize = '1.5mm';
        }
        else if (perPage === 16) {
            // 4열 x 4행 : 16명 꽉 차게, 하지만 QR과 글씨가 너무 작지 않게 조정
            gridCols = 4;
            gridRows = 4;
            qrSize = '38mm';
            nameFontSize = '9.5pt';
            numberFontSize = '7.5pt';
            itemPadding = '1.8mm';
            gapSize = '1.5mm';
        }
        else {
            // 20명 (기본) : 4열 x 5행
            gridCols = 4;
            gridRows = 5;
            qrSize = '32mm';
            nameFontSize = '9pt';
            numberFontSize = '7pt';
            itemPadding = '1.5mm';
            gapSize = '1mm';
        }
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>PAPS QR 코드 - ${className}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    @page {
                        size: A4;
                        margin: 8mm;
                    }
                    @media print {
                        html, body {
                            margin: 0;
                            padding: 0;
                            width: 100%;
                        }
                        .page {
                            width: 100%;
                            min-height: calc(100vh - 16mm);
                            max-height: calc(100vh - 16mm);
                            page-break-after: always;
                            page-break-inside: avoid;
                            break-inside: avoid;
                            overflow: hidden;
                        }
                        .page:last-child {
                            page-break-after: auto;
                        }
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    .page {
                        width: 194mm;
                        min-height: 281mm;
                        max-height: 281mm;
                        margin: 0 auto;
                        padding: 3mm;
                        display: grid;
                        grid-template-columns: repeat(${gridCols}, 1fr);
                        grid-template-rows: repeat(${gridRows}, 1fr);
                        gap: ${gapSize};
                        box-sizing: border-box;
                    }
                    .qr-item {
                        border: 1px solid #ddd;
                        border-radius: 3px;
                        padding: ${itemPadding};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        overflow: hidden;
                        box-sizing: border-box;
                        min-height: 0;
                        min-width: 0;
                    }
                    .qr-item img {
                        width: ${qrSize};
                        height: ${qrSize};
                        max-width: 100%;
                        max-height: 100%;
                        margin-bottom: 1mm;
                        object-fit: contain;
                        flex-shrink: 1;
                    }
                    .qr-item .name {
                        font-size: ${nameFontSize};
                        font-weight: bold;
                        margin-bottom: 0.5mm;
                        line-height: 1.1;
                        word-break: keep-all;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 100%;
                        flex-shrink: 0;
                    }
                    .qr-item .number {
                        font-size: ${numberFontSize};
                        color: #666;
                        line-height: 1.1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 100%;
                        flex-shrink: 0;
                    }
                </style>
            </head>
            <body>
        `;
        // 페이지별로 나누기
        for (let i = 0; i < studentQRCodes.length; i += perPage) {
            html += '<div class="page">';
            const pageItems = studentQRCodes.slice(i, i + perPage);
            pageItems.forEach(item => {
                html += `
                    <div class="qr-item">
                        <img src="${item.qrCodeUrl}" alt="QR Code">
                        <div class="name">${item.studentName}</div>
                        <div class="number">${className} · ${item.studentNumber}번</div>
                    </div>
                `;
            });
            // 빈 칸 채우기
            for (let j = pageItems.length; j < perPage; j++) {
                html += '<div class="qr-item"></div>';
            }
            html += '</div>';
        }
        html += `
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        // 인쇄 대화상자 열기
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    /**
     * 저장된 반 목록을 가져옵니다.
     * @returns 저장된 반 목록
     */
    getSavedQRClasses() {
        const savedClasses = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('paps_qr_class_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.classId && data.className && data.studentQRCodes) {
                        // 만료 시간 확인
                        if (data.expiresAt) {
                            const expiresAt = new Date(data.expiresAt);
                            if (new Date() > expiresAt) {
                                continue; // 만료된 것은 제외
                            }
                        }
                        savedClasses.push({
                            classId: data.classId,
                            className: data.className,
                            savedAt: data.savedAt || ''
                        });
                    }
                }
                catch (error) {
                    logger.debug('저장된 QR 코드 목록 파싱 실패:', key, error);
                }
            }
        }
        // 저장 날짜 기준으로 정렬 (최신순)
        savedClasses.sort((a, b) => {
            const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
            const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
            return dateB - dateA;
        });
        return savedClasses;
    }
    /**
     * 저장된 QR 코드 목록을 보여주는 모달을 표시합니다.
     */
    showSavedQRListModal() {
        const savedClasses = this.getSavedQRClasses();
        if (savedClasses.length === 0) {
            showInfoToast('저장된 QR 코드가 없습니다. 먼저 QR 코드를 생성하고 저장해주세요.');
            return;
        }
        // 저장된 반이 하나면 바로 불러오기
        if (savedClasses.length === 1) {
            this.loadSavedQRClass(savedClasses[0].classId);
            return;
        }
        // 여러 개면 선택 모달 표시
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
            <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
                    <h2 style="margin: 0; text-align: center; color: #333; font-size: 20px;">📂 저장된 QR 코드 선택</h2>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${savedClasses.map(classData => {
            const savedDate = classData.savedAt ? new Date(classData.savedAt).toLocaleDateString() : '';
            return `
                                <button class="saved-qr-class-btn" data-class-id="${classData.classId}" style="
                                    padding: 12px 16px;
                                    background: #f8f9fa;
                                    border: 1px solid #ddd;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    text-align: left;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                ">
                                    <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${classData.className}</div>
                                    ${savedDate ? `<div style="font-size: 12px; color: #666;">저장일: ${savedDate}</div>` : ''}
                                </button>
                            `;
        }).join('')}
                    </div>
                </div>
                <div style="padding: 16px; border-top: 1px solid #e0e0e0; flex-shrink: 0; text-align: center;">
                    <button id="close-saved-qr-modal-btn" style="padding: 8px 24px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // 반 선택 버튼 이벤트
        const classButtons = modal.querySelectorAll('.saved-qr-class-btn');
        classButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const classId = btn.dataset.classId;
                if (classId) {
                    document.body.removeChild(modal);
                    await this.loadSavedQRClass(classId);
                }
            });
            // 호버 효과
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#e9ecef';
                btn.style.borderColor = '#007bff';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = '#f8f9fa';
                btn.style.borderColor = '#ddd';
            });
        });
        // 닫기 버튼 이벤트
        const closeBtn = modal.querySelector('#close-saved-qr-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        // 배경 클릭 시 모달 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    /**
     * 저장된 반의 QR 코드를 불러와서 화면에 표시합니다.
     * @param classId 반 ID
     */
    async loadSavedQRClass(classId) {
        try {
            const storageKey = `paps_qr_class_${classId}`;
            const stored = localStorage.getItem(storageKey);
            if (!stored) {
                showError('저장된 QR 코드를 찾을 수 없습니다.');
                return;
            }
            const data = JSON.parse(stored);
            // 만료 시간 확인
            if (data.expiresAt) {
                const expiresAt = new Date(data.expiresAt);
                if (new Date() > expiresAt) {
                    showError('저장된 QR 코드가 만료되었습니다.');
                    localStorage.removeItem(storageKey);
                    return;
                }
            }
            const studentQRCodes = data.studentQRCodes || [];
            if (studentQRCodes.length === 0) {
                showError('저장된 QR 코드가 없습니다.');
                return;
            }
            const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date();
            // QR 코드 화면 표시
            this.showQRPrintModal(data.className, studentQRCodes, expiresAt);
        }
        catch (error) {
            logError('저장된 QR 코드 불러오기 실패:', error);
            showError('저장된 QR 코드를 불러오는데 실패했습니다.');
        }
    }
}
//# sourceMappingURL=papsManager.js.map