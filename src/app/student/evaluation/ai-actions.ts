'use server';

import { prisma } from '@/lib/prisma';
import { evaluateStudentCode } from '@/lib/gemini-code-evaluation';
import { evaluateTextResponse } from '@/lib/gemini-text-evaluation';
import { updateSubmissionScore } from './actions';

/**
 * Evalúa una respuesta utilizando la API de Gemini configurada por el profesor (autor de la evaluación).
 * Aplica límites de intentos por pregunta.
 */
export async function evaluateAnswerWithAI(
    submissionId: number,
    questionId: number,
    answerText: string
): Promise<{
    success: true;
    grade?: number;
    feedback: string;
    isCorrect: boolean;
    remainingAttempts: number;
    answer: any;
} | {
    success: false;
    error: string;
    limitReached?: boolean;
}> {
    try {
        // 1. Obtener la presentación, evaluación, configuración y autor
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                attempt: {
                    include: {
                        evaluation: {
                            include: {
                                author: {
                                    select: { geminiApiKey: true }
                                },
                                questions: {
                                    where: { id: questionId }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!submission) {
            return { success: false, error: 'Presentación no encontrada' };
        }

        const evaluation = submission.attempt.evaluation;
        const author = evaluation.author;
        const question = evaluation.questions[0]; // La pregunta específica

        if (!question) {
            return { success: false, error: 'Pregunta no encontrada en esta evaluación' };
        }

        // 2. Verificar API Key del Profesor
        if (!author?.geminiApiKey) {
            return {
                success: false,
                error: 'El profesor no ha configurado la IA para esta evaluación. Contacte al instructor.'
            };
        }

        // 3. Verificar límites de intentos (supportAttempts)
        // Primero, obtener o crear la respuesta para leer su contador actual
        let answer = await prisma.answer.findFirst({
            where: {
                submissionId,
                questionId
            }
        });

        if (!answer) {
            // Si no existe, la creamos (contará como primer intento tras la evaluación)
            answer = await prisma.answer.create({
                data: {
                    submissionId,
                    questionId,
                    answer: answerText,
                    supportAttempts: 0
                }
            });
        }

        // Verificar si ya alcanzó el límite
        if (answer.supportAttempts >= evaluation.maxSupportAttempts) {
            return {
                success: false,
                error: `Has agotado tus ${evaluation.maxSupportAttempts} intentos para esta pregunta.`,
                limitReached: true
            };
        }

        // 4. Realizar la evaluación con IA
        let aiResult;
        const isCodeQuestion = question.type?.toLowerCase() === 'code';

        if (isCodeQuestion) {
            const language = question.language || 'javascript';
            aiResult = await evaluateStudentCode(
                question.text,
                answerText,
                language,
                author.geminiApiKey
            );
        } else {
            aiResult = await evaluateTextResponse(
                answerText,
                question.text,
                author.geminiApiKey
            );
        }

        // 5. Actualizar la respuesta: contador de intentos, nota y texto
        // Comparar con la nota anterior para la estrategia de "Mejor Puntuación"
        const currentScore = answer.score || 0;
        const newScore = aiResult.grade;

        let shouldUpdateScore = false;

        // Si no tenía nota previa, o si la nueva nota es mayor, actualizamos
        // Nota: newScore puede ser undefined si la IA falló en dar una nota, en cuyo caso no actualizamos la nota
        if (newScore !== undefined) {
            // Regla normal: Mejor puntuación
            if (answer.score === null || newScore > currentScore) {
                shouldUpdateScore = true;
            }
            // Regla punitiva: Si es último intento y nota es 0, forzar actualización
            // Nota: supportAttempts ya incluye el intento actual porque incrementaremos en el paso 5 (aquí usamos el valor previo guardado + 1 conceptualmente)
            // answer.supportAttempts es el valor ANTES de este intento.
            // Si (answer.supportAttempts + 1) >= maxSupportAttempts, es el último.
            const attemptsUsed = (answer.supportAttempts || 0) + 1;
            if (attemptsUsed >= evaluation.maxSupportAttempts && newScore === 0) {
                shouldUpdateScore = true;
            }
        }

        // Preparar datos para actualización
        const updateData: any = {
            supportAttempts: {
                increment: 1
            }
        };

        if (shouldUpdateScore && newScore !== undefined) {
            updateData.answer = answerText;
            updateData.score = newScore;
        }

        const updatedAnswer = await prisma.answer.update({
            where: { id: answer.id },
            data: updateData
        });

        // Actualizar el promedio global de la submission
        await updateSubmissionScore(submissionId);

        return {
            success: true,
            grade: aiResult.grade,
            feedback: aiResult.feedback,
            isCorrect: aiResult.isCorrect,
            remainingAttempts: evaluation.maxSupportAttempts - updatedAnswer.supportAttempts,
            answer: {
                id: updatedAnswer.id,
                score: updatedAnswer.score,
                answer: updatedAnswer.answer,
                supportAttempts: updatedAnswer.supportAttempts
            }
        };

    } catch (error) {
        console.error('Error en evaluateAnswerWithAI:', error);
        return { success: false, error: 'Error interno al procesar la evaluación con IA.' };
    }
}
