type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
  log: (level: LogLevel, message: string, meta: Record<string, any> = {}) => {
    // Strip sensitive user data before logging to console
    const safeMeta = { ...meta };
    delete safeMeta.password;
    delete safeMeta.token;
    delete safeMeta.email;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...safeMeta,
      env: process.env.NODE_ENV,
    };

    // Output structured JSON for Vercel Log Drains / Datadog
    console[level](JSON.stringify(logEntry));
  },
  info: (msg: string, meta?: any) => logger.log('info', msg, meta),
  warn: (msg: string, meta?: any) => logger.log('warn', msg, meta),
  error: (msg: string, meta?: any) => logger.log('error', msg, meta),
};