import qs from 'qs';

const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

const protooPort = window.location.protocol === 'https:' ? 4443 : 4444; // Protoo server always listens on 4443 for HTTPS, or 4444 for HTTP
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

export function getProtooUrl(params) {
	const query = qs.stringify(params);

	return `${protocol}://${hostname}:${protooPort}/?${query}`;
}
