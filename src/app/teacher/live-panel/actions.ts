"use server";

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { nowUTC } from '@/lib/date-utils';

export interface LiveStudentData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  deviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  evaluationTitle: string;
  attemptId: number;
  uniqueCode: string;
  startTime: Date;
  endTime: Date;
  answersCount: number;
  totalQuestions: number;
  progress: number;
  status: 'active' | 'submitted' | 'inactive';
  lastActivity: Date;
}

export interface LiveEvaluationSummary {
  id: number;
  title: string;
  uniqueCode: string;
  startTime: Date;
  endTime: Date;
  totalStudents: number;
  activeStudents: number;
  submittedStudents: number;
  totalQuestions: number;
  isActive: boolean;
}

/**
 * Obtiene todas las evaluaciones activas del profesor con estudiantes en tiempo real
 */
export async function getLiveEvaluations(): Promise<LiveEvaluationSummary[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('No autorizado');
    }

    const now = nowUTC();

    // Obtener evaluaciones del profesor que tienen intentos activos
    const evaluations = await prisma.evaluation.findMany({
      where: {
        authorId: parseInt(session.user.id),
        attempts: {
          some: {
            startTime: { lte: now },
            endTime: { gte: now }
          }
        }
      },
      include: {
        attempts: {
          where: {
            startTime: { lte: now },
            endTime: { gte: now }
          },
          include: {
            submissions: {
              include: {
                _count: {
                  select: {
                    answersList: true
                  }
                }
              }
            }
          }
        },
        questions: {
          select: {
            id: true
          }
        }
      }
    });

    return evaluations.map(evaluation => {
      const attempt = evaluation.attempts[0]; // Solo debería haber uno activo
      if (!attempt) return null;

      const totalStudents = attempt.submissions.length;
      const submittedStudents = attempt.submissions.filter(s => s.submittedAt !== null).length;
      const activeStudents = totalStudents - submittedStudents;

      return {
        id: evaluation.id,
        title: evaluation.title,
        uniqueCode: attempt.uniqueCode,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        totalStudents,
        activeStudents,
        submittedStudents,
        totalQuestions: evaluation.questions.length,
        isActive: true
      };
    }).filter(Boolean) as LiveEvaluationSummary[];

  } catch (error) {
    console.error('Error al obtener evaluaciones en vivo:', error);
    return [];
  }
}

/**
 * Obtiene los estudiantes activos de una evaluación específica
 */
export async function getLiveStudents(evaluationId: number): Promise<LiveStudentData[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('No autorizado');
    }

    const now = nowUTC();

    // Verificar que la evaluación pertenece al profesor
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        authorId: parseInt(session.user.id)
      },
      include: {
        attempts: {
          where: {
            startTime: { lte: now },
            endTime: { gte: now }
          },
          include: {
            submissions: {
              include: {
                answersList: {
                  select: {
                    id: true,
                    answer: true
                  }
                }
              }
            }
          }
        },
        questions: {
          select: {
            id: true
          }
        }
      }
    });

    if (!evaluation || !evaluation.attempts[0]) {
      return [];
    }

    const attempt = evaluation.attempts[0];
    const totalQuestions = evaluation.questions.length;

    return attempt.submissions.map(submission => {
      // Contar solo respuestas que tienen contenido real (no vacías)
      const answersCount = submission.answersList.filter(answer => 
        answer.answer && answer.answer.trim().length > 0
      ).length;
      const progress = totalQuestions > 0 ? (answersCount / totalQuestions) * 100 : 0;
      
      // Determinar el estado del estudiante
      let status: 'active' | 'submitted' | 'inactive' = 'inactive';
      if (submission.submittedAt) {
        status = 'submitted';
      } else {
        // Considerar activo si ha tenido actividad en los últimos 5 minutos
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (submission.updatedAt > fiveMinutesAgo) {
          status = 'active';
        }
      }

      return {
        id: submission.id,
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: submission.email,
        deviceId: submission.deviceId,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        submittedAt: submission.submittedAt,
        score: submission.score,
        evaluationTitle: evaluation.title,
        attemptId: attempt.id,
        uniqueCode: attempt.uniqueCode,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        answersCount,
        totalQuestions,
        progress: Math.round(progress),
        status,
        lastActivity: submission.updatedAt
      };
    }).sort((a, b) => {
      // Ordenar por estado (activos primero) y luego por última actividad
      if (a.status !== b.status) {
        const statusOrder = { 'active': 0, 'inactive': 1, 'submitted': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

  } catch (error) {
    console.error('Error al obtener estudiantes en vivo:', error);
    return [];
  }
}

/**
 * Obtiene todos los estudiantes activos de todas las evaluaciones del profesor
 */
export async function getAllLiveStudents(): Promise<LiveStudentData[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('No autorizado');
    }

    const now = nowUTC();

    // Obtener todas las evaluaciones activas del profesor
    const evaluations = await prisma.evaluation.findMany({
      where: {
        authorId: parseInt(session.user.id),
        attempts: {
          some: {
            startTime: { lte: now },
            endTime: { gte: now }
          }
        }
      },
      include: {
        attempts: {
          where: {
            startTime: { lte: now },
            endTime: { gte: now }
          },
          include: {
            submissions: {
              include: {
                answersList: {
                  select: {
                    id: true,
                    answer: true
                  }
                }
              }
            }
          }
        },
        questions: {
          select: {
            id: true
          }
        }
      }
    });

    const allStudents: LiveStudentData[] = [];

    for (const evaluation of evaluations) {
      const attempt = evaluation.attempts[0];
      if (!attempt) continue;

      const totalQuestions = evaluation.questions.length;

      const students = attempt.submissions.map(submission => {
        // Contar solo respuestas que tienen contenido real (no vacías)
        const answersCount = submission.answersList.filter(answer => 
          answer.answer && answer.answer.trim().length > 0
        ).length;
        const progress = totalQuestions > 0 ? (answersCount / totalQuestions) * 100 : 0;
        
        let status: 'active' | 'submitted' | 'inactive' = 'inactive';
        if (submission.submittedAt) {
          status = 'submitted';
        } else {
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          if (submission.updatedAt > fiveMinutesAgo) {
            status = 'active';
          }
        }

        return {
          id: submission.id,
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          deviceId: submission.deviceId,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          submittedAt: submission.submittedAt,
          score: submission.score,
          evaluationTitle: evaluation.title,
          attemptId: attempt.id,
          uniqueCode: attempt.uniqueCode,
          startTime: attempt.startTime,
          endTime: attempt.endTime,
          answersCount,
          totalQuestions,
          progress: Math.round(progress),
          status,
          lastActivity: submission.updatedAt
        };
      });

      allStudents.push(...students);
    }

    return allStudents.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { 'active': 0, 'inactive': 1, 'submitted': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

  } catch (error) {
    console.error('Error al obtener todos los estudiantes en vivo:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas en tiempo real del profesor
 */
export async function getLiveStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('No autorizado');
    }

    const now = nowUTC();

    // Contar evaluaciones activas
    const activeEvaluations = await prisma.evaluation.count({
      where: {
        authorId: parseInt(session.user.id),
        attempts: {
          some: {
            startTime: { lte: now },
            endTime: { gte: now }
          }
        }
      }
    });

    // Contar estudiantes activos totales
    const activeStudentsResult = await prisma.submission.findMany({
      where: {
        attempt: {
          evaluation: {
            authorId: parseInt(session.user.id)
          },
          startTime: { lte: now },
          endTime: { gte: now }
        },
        submittedAt: null,
        updatedAt: {
          gte: new Date(now.getTime() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      },
      select: {
        id: true
      }
    });

    // Contar estudiantes que han enviado evaluaciones hoy
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const submittedToday = await prisma.submission.count({
      where: {
        attempt: {
          evaluation: {
            authorId: parseInt(session.user.id)
          }
        },
        submittedAt: {
          gte: todayStart
        }
      }
    });

    return {
      activeEvaluations,
      activeStudents: activeStudentsResult.length,
      submittedToday
    };

  } catch (error) {
    console.error('Error al obtener estadísticas en vivo:', error);
    return {
      activeEvaluations: 0,
      activeStudents: 0,
      submittedToday: 0
    };
  }
}