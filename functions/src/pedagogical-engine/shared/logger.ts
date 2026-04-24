import * as functionLogger from 'firebase-functions/logger';

export const logger = {
  info: (msg: string, data?: any) => {
    functionLogger.info(msg, data);
    console.info(msg, data ? JSON.stringify(data) : '');
  },
  warn: (msg: string, data?: any) => {
    functionLogger.warn(msg, data);
    console.warn(msg, data ? JSON.stringify(data) : '');
  },
  error: (msg: string, error?: any) => {
    functionLogger.error(msg, error);
    console.error(msg, error);
  },
};
