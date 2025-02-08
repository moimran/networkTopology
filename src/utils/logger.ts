/**
 * Logger utility for consistent logging across the application
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️ ${message}`, data ? data : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data ? data : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error ? error : '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔍 ${message}`, data ? data : '');
    }
  }
};
