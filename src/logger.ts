const LOG_LEVELS: { [ key: string ]: number } = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS.DEBUG; // Change this to control verbosity

const logger = {
	error: ( ...args: any[] ) =>
		currentLogLevel >= LOG_LEVELS.ERROR && console.error( ...args ),
	warn: ( ...args: any[] ) =>
		currentLogLevel >= LOG_LEVELS.WARN && console.warn( ...args ),
	info: ( ...args: any[] ) =>
		currentLogLevel >= LOG_LEVELS.INFO && console.info( ...args ),
	debug: ( ...args: any[] ) =>
		currentLogLevel >= LOG_LEVELS.DEBUG && console.debug( ...args ),
};

export default logger;
