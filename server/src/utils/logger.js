const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function ts() {
  return new Date().toISOString();
}

function write(level, ...args) {
  if (LEVELS[level] > CURRENT) return;
  const tag = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍' }[level];
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`${tag} [${ts()}]`, ...args);
}

export const logger = {
  error: (...args) => write('error', ...args),
  warn: (...args) => write('warn', ...args),
  info: (...args) => write('info', ...args),
  debug: (...args) => write('debug', ...args),
};
