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
export declare const LeagueClassSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    note: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const LeagueStudentSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    classId: z.ZodNumber;
    note: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const LeagueGameSchema: z.ZodObject<{
    id: z.ZodNumber;
    classId: z.ZodNumber;
    player1Id: z.ZodNumber;
    player2Id: z.ZodNumber;
    player1Score: z.ZodNullable<z.ZodNumber>;
    player2Score: z.ZodNullable<z.ZodNumber>;
    isCompleted: z.ZodBoolean;
    completedAt: z.ZodNullable<z.ZodNumber>;
    note: z.ZodDefault<z.ZodString>;
    isHighlighted: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const LeagueDataSchema: z.ZodObject<{
    classes: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        note: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    students: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        classId: z.ZodNumber;
        note: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    games: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        classId: z.ZodNumber;
        player1Id: z.ZodNumber;
        player2Id: z.ZodNumber;
        player1Score: z.ZodNullable<z.ZodNumber>;
        player2Score: z.ZodNullable<z.ZodNumber>;
        isCompleted: z.ZodBoolean;
        completedAt: z.ZodNullable<z.ZodNumber>;
        note: z.ZodDefault<z.ZodString>;
        isHighlighted: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    selectedClassId: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const TournamentMatchSchema: z.ZodObject<{
    id: z.ZodString;
    roundIdx: z.ZodNumber;
    slotIdx: z.ZodNumber;
    teamA: z.ZodNullable<z.ZodString>;
    teamB: z.ZodNullable<z.ZodString>;
    scoreA: z.ZodNullable<z.ZodNumber>;
    scoreB: z.ZodNullable<z.ZodNumber>;
    winner: z.ZodNullable<z.ZodString>;
    parentId: z.ZodNullable<z.ZodString>;
    isBye: z.ZodDefault<z.ZodBoolean>;
    matchNumber: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const TournamentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    teams: z.ZodArray<z.ZodString>;
    rounds: z.ZodArray<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        roundIdx: z.ZodNumber;
        slotIdx: z.ZodNumber;
        teamA: z.ZodNullable<z.ZodString>;
        teamB: z.ZodNullable<z.ZodString>;
        scoreA: z.ZodNullable<z.ZodNumber>;
        scoreB: z.ZodNullable<z.ZodNumber>;
        winner: z.ZodNullable<z.ZodString>;
        parentId: z.ZodNullable<z.ZodString>;
        isBye: z.ZodDefault<z.ZodBoolean>;
        matchNumber: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>>>;
    sport: z.ZodDefault<z.ZodString>;
    format: z.ZodDefault<z.ZodEnum<{
        single: "single";
        double: "double";
    }>>;
    seeding: z.ZodDefault<z.ZodEnum<{
        input: "input";
        random: "random";
    }>>;
}, z.core.$strip>;
export declare const TournamentDataSchema: z.ZodObject<{
    tournaments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        teams: z.ZodArray<z.ZodString>;
        rounds: z.ZodArray<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            roundIdx: z.ZodNumber;
            slotIdx: z.ZodNumber;
            teamA: z.ZodNullable<z.ZodString>;
            teamB: z.ZodNullable<z.ZodString>;
            scoreA: z.ZodNullable<z.ZodNumber>;
            scoreB: z.ZodNullable<z.ZodNumber>;
            winner: z.ZodNullable<z.ZodString>;
            parentId: z.ZodNullable<z.ZodString>;
            isBye: z.ZodDefault<z.ZodBoolean>;
            matchNumber: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>>;
        sport: z.ZodDefault<z.ZodString>;
        format: z.ZodDefault<z.ZodEnum<{
            single: "single";
            double: "double";
        }>>;
        seeding: z.ZodDefault<z.ZodEnum<{
            input: "input";
            random: "random";
        }>>;
    }, z.core.$strip>>;
    activeTournamentId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const PapsStudentSchema: z.ZodObject<{
    id: z.ZodNumber;
    number: z.ZodNumber;
    name: z.ZodString;
    gender: z.ZodEnum<{
        남자: "남자";
        여자: "여자";
    }>;
    records: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.core.$strip>;
export declare const PapsSettingsSchema: z.ZodObject<{
    gradeLevel: z.ZodString;
    customCategories: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const PapsClassSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    gradeLevel: z.ZodString;
    students: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        number: z.ZodNumber;
        name: z.ZodString;
        gender: z.ZodEnum<{
            남자: "남자";
            여자: "여자";
        }>;
        records: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, z.core.$strip>>;
    settings: z.ZodOptional<z.ZodObject<{
        gradeLevel: z.ZodString;
        customCategories: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>>;
    eventSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const PapsDataSchema: z.ZodObject<{
    classes: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        gradeLevel: z.ZodString;
        students: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            number: z.ZodNumber;
            name: z.ZodString;
            gender: z.ZodEnum<{
                남자: "남자";
                여자: "여자";
            }>;
            records: z.ZodRecord<z.ZodString, z.ZodNumber>;
        }, z.core.$strip>>;
        settings: z.ZodOptional<z.ZodObject<{
            gradeLevel: z.ZodString;
            customCategories: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, z.core.$strip>>;
        eventSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    activeClassId: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const ProgressSessionSchema: z.ZodObject<{
    weekNumber: z.ZodNumber;
    sessionNumber: z.ZodNumber;
    date: z.ZodOptional<z.ZodString>;
    content: z.ZodDefault<z.ZodString>;
    completed: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const ProgressClassSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    teacherName: z.ZodOptional<z.ZodString>;
    unitContent: z.ZodOptional<z.ZodString>;
    weeklyHours: z.ZodOptional<z.ZodNumber>;
    schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
        weekNumber: z.ZodNumber;
        sessionNumber: z.ZodNumber;
        date: z.ZodOptional<z.ZodString>;
        content: z.ZodDefault<z.ZodString>;
        completed: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
export declare const ProgressDataSchema: z.ZodObject<{
    classes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        teacherName: z.ZodOptional<z.ZodString>;
        unitContent: z.ZodOptional<z.ZodString>;
        weeklyHours: z.ZodOptional<z.ZodNumber>;
        schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
            weekNumber: z.ZodNumber;
            sessionNumber: z.ZodNumber;
            date: z.ZodOptional<z.ZodString>;
            content: z.ZodDefault<z.ZodString>;
            completed: z.ZodDefault<z.ZodBoolean>;
            notes: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>>;
        createdAt: z.ZodNumber;
        updatedAt: z.ZodNumber;
    }, z.core.$strip>>;
    selectedClassId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const AppDataSchema: z.ZodObject<{
    leagues: z.ZodObject<{
        classes: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            name: z.ZodString;
            note: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        students: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            name: z.ZodString;
            classId: z.ZodNumber;
            note: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        games: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            classId: z.ZodNumber;
            player1Id: z.ZodNumber;
            player2Id: z.ZodNumber;
            player1Score: z.ZodNullable<z.ZodNumber>;
            player2Score: z.ZodNullable<z.ZodNumber>;
            isCompleted: z.ZodBoolean;
            completedAt: z.ZodNullable<z.ZodNumber>;
            note: z.ZodDefault<z.ZodString>;
            isHighlighted: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        selectedClassId: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
    tournaments: z.ZodObject<{
        tournaments: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            teams: z.ZodArray<z.ZodString>;
            rounds: z.ZodArray<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                roundIdx: z.ZodNumber;
                slotIdx: z.ZodNumber;
                teamA: z.ZodNullable<z.ZodString>;
                teamB: z.ZodNullable<z.ZodString>;
                scoreA: z.ZodNullable<z.ZodNumber>;
                scoreB: z.ZodNullable<z.ZodNumber>;
                winner: z.ZodNullable<z.ZodString>;
                parentId: z.ZodNullable<z.ZodString>;
                isBye: z.ZodDefault<z.ZodBoolean>;
                matchNumber: z.ZodNullable<z.ZodNumber>;
            }, z.core.$strip>>>;
            sport: z.ZodDefault<z.ZodString>;
            format: z.ZodDefault<z.ZodEnum<{
                single: "single";
                double: "double";
            }>>;
            seeding: z.ZodDefault<z.ZodEnum<{
                input: "input";
                random: "random";
            }>>;
        }, z.core.$strip>>;
        activeTournamentId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    paps: z.ZodObject<{
        classes: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            name: z.ZodString;
            gradeLevel: z.ZodString;
            students: z.ZodArray<z.ZodObject<{
                id: z.ZodNumber;
                number: z.ZodNumber;
                name: z.ZodString;
                gender: z.ZodEnum<{
                    남자: "남자";
                    여자: "여자";
                }>;
                records: z.ZodRecord<z.ZodString, z.ZodNumber>;
            }, z.core.$strip>>;
            settings: z.ZodOptional<z.ZodObject<{
                gradeLevel: z.ZodString;
                customCategories: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, z.core.$strip>>;
            eventSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        activeClassId: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
    progress: z.ZodObject<{
        classes: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            teacherName: z.ZodOptional<z.ZodString>;
            unitContent: z.ZodOptional<z.ZodString>;
            weeklyHours: z.ZodOptional<z.ZodNumber>;
            schedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
                weekNumber: z.ZodNumber;
                sessionNumber: z.ZodNumber;
                date: z.ZodOptional<z.ZodString>;
                content: z.ZodDefault<z.ZodString>;
                completed: z.ZodDefault<z.ZodBoolean>;
                notes: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>>>;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
        selectedClassId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    lastUpdated: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
    formattedErrors?: string[];
}
/**
 * 데이터를 검증하고 결과를 반환합니다.
 * @param schema Zod 스키마
 * @param data 검증할 데이터
 * @returns 검증 결과
 */
export declare function validateData<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T>;
/**
 * 데이터를 검증하고 안전하게 변환합니다.
 * 검증 실패 시 기본값을 반환합니다.
 * @param schema Zod 스키마
 * @param data 검증할 데이터
 * @param defaultValue 검증 실패 시 반환할 기본값
 * @returns 검증된 데이터 또는 기본값
 */
export declare function validateWithDefaults<T>(schema: z.ZodType<T>, data: unknown, defaultValue: T): T;
/**
 * 사용자 친화적인 에러 메시지를 생성합니다.
 * @param errors Zod 에러 객체
 * @returns 사용자 친화적인 에러 메시지 배열
 */
export declare function formatValidationErrors(errors: z.ZodError): string[];
/**
 * 부분 검증 (partial validation)
 * 필수 필드만 검증하고 선택 필드는 무시합니다.
 */
export declare function validatePartial<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<Partial<T>>;
//# sourceMappingURL=validators.d.ts.map