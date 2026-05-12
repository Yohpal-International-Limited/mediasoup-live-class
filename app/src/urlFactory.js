import qs from 'qs';

const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

const protooPort = isLocalhost
	? 4445
	: hostname === 'test.mediasoup.org'
		? 4444
		: 4443;

const protocol = isLocalhost ? 'ws' : 'wss';

export function getProtooUrl(params) {
	const query = qs.stringify(params);

	return `${protocol}://${hostname}:${protooPort}/?${query}`;
}
