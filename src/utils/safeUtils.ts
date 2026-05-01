/**
 * Safe utility functions to prevent "Cannot read properties of undefined"
 * and handle data consistently across the EduAI ECOSYSTEM.
 */

export const safeArray = <T>(arr: T[] | null | undefined): T[] => {
  return Array.isArray(arr) ? arr : [];
};

export const safeObject = <T extends object>(obj: T | null | undefined): T => {
  return (obj && typeof obj === 'object') ? obj : {} as T;
};

export const safeString = (str: any, fallback = ""): string => {
  if (typeof str === 'string' && str.trim()) return str;
  if (typeof str === 'number') return String(str);
  return fallback;
};

export const safeNumber = (num: any, defaultValue: number = 0): number => {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeJoin = (value: unknown, separator = ", "): string => {
  if (Array.isArray(value)) {
    const result = value.filter(v => v !== null && v !== undefined && String(v).trim() !== "").join(separator);
    return result || "Não informado";
  }
  return safeString(value, "Não informado");
};

export const safeDate = (value: unknown): string => {
  if (!value) return "Data não informada";

  try {
    if (value instanceof Date) {
      return value.toLocaleDateString("pt-BR");
    }

    // Firebase Timestamp check
    if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate().toLocaleDateString("pt-BR");
    }

    const date = new Date(value as any);
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
};

export const safeGet = <T>(fn: () => T, defaultValue: T): T => {
  try {
    const val = fn();
    return val !== undefined && val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Executes an async function safely with a consistent error handling pattern.
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  fallback: T | null = null,
  moduleName: string = 'ASYNC_OP'
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    // Dynamic import to avoid circular dependency
    const { logger } = await import('./logger');
    logger.error(moduleName, "Async operation failed", error);
    return fallback;
  }
}
