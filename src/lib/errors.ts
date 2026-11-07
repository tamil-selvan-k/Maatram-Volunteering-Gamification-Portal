import type { AppError } from '@/types'

export class AppErrorImpl extends Error implements AppError {
  code: string
  originalError?: unknown

  constructor(code: string, message: string, originalError?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.originalError = originalError
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppErrorImpl) return err
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return {
      code: String((err as { code: unknown }).code),
      message: String((err as { message: unknown }).message),
      originalError: err,
    }
  }
  if (err instanceof Error) {
    return { code: 'UNKNOWN_ERROR', message: err.message, originalError: err }
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', originalError: err }
}

export const ERR = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  SUPABASE: 'SUPABASE_ERROR',
} as const
