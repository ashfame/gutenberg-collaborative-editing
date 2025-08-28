const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS.DEBUG; // Change this to control verbosity

const logger = {
  error: (...args) => currentLogLevel >= LOG_LEVELS.ERROR && console.error(...args),
  warn: (...args) => currentLogLevel >= LOG_LEVELS.WARN && console.warn(...args),
  info: (...args) => currentLogLevel >= LOG_LEVELS.INFO && console.info(...args),
  debug: (...args) => currentLogLevel >= LOG_LEVELS.DEBUG && console.debug(...args)
};

export default logger;
