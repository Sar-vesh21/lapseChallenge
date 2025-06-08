import winston from 'winston';

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(
      ({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata, null, 2)}`;
        }
        return msg;
      }
    )
  ),
  transports: [
    new winston.transports.Console()
  ],
});

export default logger; 