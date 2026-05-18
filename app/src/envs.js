import * as process from 'node:process';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @type string
 */
export function getConfigFile() {
	return (
		process.env['CONFIG_FILE'] ||
		pathToFileURL(
			path.join(__dirname, '..', '..', 'server', 'config.mjs')
		).href
	);
}
