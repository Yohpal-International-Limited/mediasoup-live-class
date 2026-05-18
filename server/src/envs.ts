import * as process from 'node:process';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export function getConfigFile(): string {
	const configFile = process.env['CONFIG_FILE'];

	if (configFile == null) {
		return pathToFileURL(path.join(__dirname, '..', 'config.mjs')).href;
	}

	const hasUrlScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(configFile);
	const isWindowsAbsolutePath = /^[a-zA-Z]:[\\/]/.test(configFile);

	if (hasUrlScheme && !isWindowsAbsolutePath) {
		return configFile;
	}

	return pathToFileURL(path.resolve(process.cwd(), configFile)).href;
}

export function getDebug(): string | undefined {
	return process.env['DEBUG'];
}

export function getTerminal(): boolean {
	return process.env['TERMINAL'] === 'true';
}

export function getNetworkThrottleSecret(): string | undefined {
	return process.env['NETWORK_THROTTLE_SECRET'];
}
