import qs from 'qs';

const urlParser = new URL(window.location.href);
const urlParams = qs.parse(urlParser.search, { ignoreQueryPrefix: true });

const hostname = urlParams.infoHost || window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

export function getProtooUrl(params) {
	const query = qs.stringify(params);

	let protooPort;

	if (urlParams.infoPort) {
		protooPort = urlParams.infoPort;
	} else {
		protooPort = window.location.protocol === 'https:' ? 4443 : 4444;
	}

	// If we are on ngrok and no specific port was provided, 
	// use the default HTTPS/HTTP port (443/80) because ngrok handles the mapping.
	const isNgrok = hostname.endsWith('.ngrok.io') || hostname.endsWith('.ngrok-free.app');

	if (isNgrok && !urlParams.infoPort) {
		return `${protocol}://${hostname}/?${query}`;
	}

	return `${protocol}://${hostname}:${protooPort}/?${query}`;
}
