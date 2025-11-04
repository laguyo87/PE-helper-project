/**
 * 데이터 검증 모듈
 *
 * Zod를 사용하여 모든 Manager의 데이터 타입에 대한 스키마를 정의하고,
 * 데이터 저장/로드 시 검증을 수행합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { z } from 'zod';
// ========================================
// 리그전 데이터 스키마
// ========================================
export const LeagueClassSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1, '반 이름은 1자 이상이어야 합니다.').max(50, '반 이름은 50자를 초과할 수 없습니다.'),
    note: z.string().default('')
});
export const LeagueStudentSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1, '학생 이름은 1자 이상이어야 합니다.').max(50, '학생 이름은 50자를 초과할 수 없습니다.'),
    classId: z.number().int().positive(),
    note: z.string().default('')
});
export const LeagueGameSchema = z.object({
    id: z.number().int().positive(),
    classId: z.number().int().positive(),
    player1Id: z.number().int(),
    player2Id: z.number().int(),
    player1Score: z.number().nullable(),
    player2Score: z.number().nullable(),
    isCompleted: z.boolean(),
    completedAt: z.number().nullable(),
    note: z.string().default(''),
    isHighlighted: z.boolean().default(false)
});
export const LeagueDataSchema = z.object({
    classes: z.array(LeagueClassSchema),
    students: z.array(LeagueStudentSchema),
    games: z.array(LeagueGameSchema),
    selectedClassId: z.number().int().nullable()
});
// ========================================
// 토너먼트 데이터 스키마
// ========================================
export const TournamentMatchSchema = z.object({
    id: z.string().min(1),
    roundIdx: z.number().int().nonnegative(),
    slotIdx: z.number().int().nonnegative(),
    teamA: z.string().nullable(),
    teamB: z.string().nullable(),
    scoreA: z.number().nullable(),
    scoreB: z.number().nullable(),
    winner: z.string().nullable(),
    parentId: z.string().nullable(),
    isBye: z.boolean().default(false),
    matchNumber: z.number().int().nullable()
});
export const TournamentSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, '토너먼트 이름은 1자 이상이어야 합니다.').max(100, '토너먼트 이름은 100자를 초과할 수 없습니다.'),
    teams: z.array(z.string().min(1)).min(0, '팀은 0개 이상이어야 합니다.').max(32, '최대 32개 팀까지 지원합니다.'),
    rounds: z.array(z.array(TournamentMatchSchema)),
    sport: z.string().default(''),
    format: z.enum(['single', 'double']).default('single'),
    seeding: z.enum(['input', 'random']).default('input')
});
export const TournamentDataSchema = z.object({
    tournaments: z.array(TournamentSchema),
    activeTournamentId: z.string().nullable()
});
// ========================================
// PAPS 데이터 스키마
// ========================================
export const PapsStudentSchema = z.object({
    id: z.number().int().positive(),
    number: z.number().int().positive(),
    name: z.string().min(1, '학생 이름은 1자 이상이어야 합니다.').max(50, '학생 이름은 50자를 초과할 수 없습니다.'),
    gender: z.enum(['남자', '여자']),
    records: z.record(z.string(), z.number())
});
export const PapsSettingsSchema = z.object({
    gradeLevel: z.string(),
    customCategories: z.record(z.string(), z.any()).optional()
});
export const PapsClassSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1, '반 이름은 1자 이상이어야 합니다.').max(50, '반 이름은 50자를 초과할 수 없습니다.'),
    gradeLevel: z.string(),
    students: z.array(PapsStudentSchema),
    settings: PapsSettingsSchema.optional(),
    eventSettings: z.record(z.string(), z.string()).optional()
});
export const PapsDataSchema = z.object({
    classes: z.array(PapsClassSchema),
    activeClassId: z.number().int().nullable()
});
// ========================================
// 진도표 데이터 스키마
// ========================================
export const ProgressSessionSchema = z.object({
    weekNumber: z.number().int().positive(),
    sessionNumber: z.number().int().positive(),
    date: z.string().optional(),
    content: z.string().default(''),
    completed: z.boolean().default(false),
    notes: z.string().default('')
});
export const ProgressClassSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, '반 이름은 1자 이상이어야 합니다.').max(50, '반 이름은 50자를 초과할 수 없습니다.'),
    teacherName: z.string().optional(),
    unitContent: z.string().optional(),
    weeklyHours: z.number().int().positive().optional(),
    schedule: z.array(ProgressSessionSchema).optional(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});
export const ProgressDataSchema = z.object({
    classes: z.array(ProgressClassSchema),
    selectedClassId: z.string().nullable()
});
// ========================================
// 앱 전체 데이터 스키마
// ========================================
export const AppDataSchema = z.object({
    leagues: LeagueDataSchema,
    tournaments: TournamentDataSchema,
    paps: PapsDataSchema,
    progress: ProgressDataSchema,
    lastUpdated: z.number().int().nonnegative().optional()
});
// ========================================
// 검증 유틸리티 함수
// ========================================
/**
 * 데이터를 검증하고 결과를 반환합니다.
 * @param schema Zod 스키마
 * @param data 검증할 데이터
 * @returns 검증 결과
 */
export function validateData(schema, data) {
    try {
        const validatedData = schema.parse(data);
        return {
            success: true,
            data: validatedData
        };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.issues.map((err) => {
                const path = err.path.join('.');
                return `${path}: ${err.message}`;
            });
            return {
                success: false,
                errors: error,
                formattedErrors
            };
        }
        // ZodError가 아닌 경우
        return {
            success: false,
            formattedErrors: [`검증 중 예상치 못한 오류가 발생했습니다: ${String(error)}`]
        };
    }
}
/**
 * 데이터를 검증하고 안전하게 변환합니다.
 * 검증 실패 시 기본값을 반환합니다.
 * @param schema Zod 스키마
 * @param data 검증할 데이터
 * @param defaultValue 검증 실패 시 반환할 기본값
 * @returns 검증된 데이터 또는 기본값
 */
export function validateWithDefaults(schema, data, defaultValue) {
    const result = validateData(schema, data);
    if (result.success && result.data !== undefined) {
        return result.data;
    }
    // 검증 실패 시 기본값 반환
    console.warn('데이터 검증 실패, 기본값 사용:', result.formattedErrors);
    return defaultValue;
}
/**
 * 사용자 친화적인 에러 메시지를 생성합니다.
 * @param errors Zod 에러 객체
 * @returns 사용자 친화적인 에러 메시지 배열
 */
export function formatValidationErrors(errors) {
    return errors.issues.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : '데이터';
        let message = err.message;
        // 특정 에러 메시지 커스터마이징
        if (err.code === 'too_small') {
            const minimum = err.minimum;
            const type = err.type;
            if (type === 'string') {
                message = `최소 ${minimum}자 이상 입력해주세요.`;
            }
            else if (type === 'number') {
                message = `최소 ${minimum} 이상의 값을 입력해주세요.`;
            }
        }
        else if (err.code === 'too_big') {
            const maximum = err.maximum;
            const type = err.type;
            if (type === 'string') {
                message = `최대 ${maximum}자까지 입력 가능합니다.`;
            }
            else if (type === 'number') {
                message = `최대 ${maximum} 이하의 값을 입력해주세요.`;
            }
        }
        else if (err.code === 'invalid_type') {
            const expected = err.expected;
            const received = err.received;
            message = `올바른 형식이 아닙니다. (기대: ${expected}, 실제: ${received})`;
        }
        return `${path}: ${message}`;
    });
}
/**
 * 부분 검증 (partial validation)
 * 필수 필드만 검증하고 선택 필드는 무시합니다.
 */
export function validatePartial(schema, data) {
    try {
        // 부분 검증: optional() 대신 객체 스키마인 경우만 partial 적용
        if (schema instanceof z.ZodObject) {
            const partialSchema = schema.partial();
            const validatedData = partialSchema.parse(data);
            return {
                success: true,
                data: validatedData
            };
        }
        else {
            // 객체가 아닌 경우 원본 스키마로 검증
            return validateData(schema, data);
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.issues.map((err) => {
                const path = err.path.join('.');
                return `${path}: ${err.message}`;
            });
            return {
                success: false,
                errors: error,
                formattedErrors
            };
        }
        return {
            success: false,
            formattedErrors: [`검증 중 예상치 못한 오류가 발생했습니다: ${String(error)}`]
        };
    }
}
//# sourceMappingURL=validators.js.map