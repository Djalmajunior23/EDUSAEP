/**
 * Centralized Logger for EduAI CORE ULTRA
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private prefix(module: string): string {
    return `[EduAI:${module}]`;
  }

  error(module: string, message: string, error?: unknown) {
    console.error(`${this.prefix(module)} ❌ ${message}`, error || '');
  }

  warn(module: string, message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${this.prefix(module)} ⚠️ ${message}`, data || '');
    }
  }

  info(module: string, message: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`${this.prefix(module)} ℹ️ ${message}`);
    }
  }

  debug(module: string, message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`${this.prefix(module)} 🔍 ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
