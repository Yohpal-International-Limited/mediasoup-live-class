import { config as baseConfig } from './config.example.mjs';

export const config = {
	...baseConfig,
	http: {
		...baseConfig.http,
		listenPort: Number(process.env['HTTP_LISTEN_PORT'] ?? 4445),
		tls: undefined,
	},
};
