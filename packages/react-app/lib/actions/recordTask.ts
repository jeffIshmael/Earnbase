// app/actions/recordTask.ts
'use server'

import { recordTask as recordTaskFn } from '@/lib/Prismafnctns'

export async function recordTaskServer(
  taskId: number,
  completed: boolean,
  score: string,
  aiScore: number | null,
  individualFeedback: string,
  address: string
) {
  return await recordTaskFn(taskId, completed, score, aiScore?.toString() || null, individualFeedback, address);
}
