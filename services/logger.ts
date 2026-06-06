const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function log(level: LogLevel, ...args: unknown[]) {
	if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
		const timestamp = new Date().toISOString();
		console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
			`[${timestamp}] [${level.toUpperCase()}]`,
			...args,
		);
	}
}

export const logger = {
	debug: (...args: unknown[]) => log("debug", ...args),
	info: (...args: unknown[]) => log("info", ...args),
	warn: (...args: unknown[]) => log("warn", ...args),
	error: (...args: unknown[]) => log("error", ...args),
};
