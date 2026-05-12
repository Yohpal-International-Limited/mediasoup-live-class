import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

let mediaQueryDetectorElem;

export function initialize() {
	mediaQueryDetectorElem = document.getElementById(
		'mediasoup-demo-app-media-query-detector'
	);

	return Promise.resolve();
}

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
