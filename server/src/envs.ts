import * as process from 'node:process';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export function getConfigFile(): string {
	return (
		process.env['CONFIG_FILE'] ??
		pathToFileURL(path.join(__dirname, '..', 'config.mjs')).href
	);
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
