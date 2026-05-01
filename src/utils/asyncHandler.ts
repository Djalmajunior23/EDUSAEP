/**
 * Async handler for production-ready service calls
 */
import { logger } from './logger';

export interface AsyncResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export async function asyncHandler<T>(
  promise: Promise<T>,
  moduleName: string = 'GENERIC'
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(moduleName, err.message, error);
    return [null, err];
  }
}
