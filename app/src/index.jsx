import domready from 'domready';
import UrlParse from 'url-parse';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import {
	applyMiddleware as applyReduxMiddleware,
	createStore as createReduxStore,
} from 'redux';
import thunk from 'redux-thunk';
import randomString from 'random-string';
import * as faceapi from 'face-api.js';
import Logger from './Logger';
import * as utils from './utils';
import randomName from './randomName';
import deviceInfo from './deviceInfo';
import RoomClient from './RoomClient';
import RoomContext from './RoomContext';
import * as cookiesManager from './cookiesManager';
import * as stateActions from './redux/stateActions';
import reducers from './redux/reducers';
import Room from './components/Room';
import LandingPage from './components/LandingPage';
import './scss/index.scss';

const logger = new Logger();
const reduxMiddlewares = [thunk];

let roomClient;
const store = createReduxStore(
	reducers,
	undefined,
	applyReduxMiddleware(...reduxMiddlewares)
);

window.STORE = store;

RoomClient.init({ store });

domready(async () => {
	logger.debug('DOM ready');

	await utils.initialize();

	run();
});

window.RUN = run;

async function run() {
	logger.debug('run() [environment:%s]', process.env.NODE_ENV);

	if (window.CLIENT) {
		window.CLIENT.close();

		// eslint-disable-next-line require-atomic-updates
		window.CLIENT = undefined;
		// eslint-disable-next-line require-atomic-updates
		window.CC = undefined;
	}

	const urlParser = new UrlParse(window.location.href, true);
	const peerId = randomString({ length: 8 }).toLowerCase();
	const roomId = urlParser.query.roomId;
	let displayName =
		urlParser.query.displayName || (cookiesManager.getUser() || {}).displayName;
	const handlerName = urlParser.query.handlerName || urlParser.query.handler;
	const forceTcp = urlParser.query.forceTcp === 'true';
	const produce = true;
	const consume = urlParser.query.consume !== 'false';
	const mic = urlParser.query.mic !== 'false';
	const webcam =
		urlParser.query.webcam === 'true'
			? true
			: urlParser.query.webcam === 'false'
				? false
				: undefined;
	const datachannel = urlParser.query.datachannel !== 'false';
	const preferLocalCodecsOrder =
		urlParser.query.preferLocalCodecsOrder === 'true';
	const forcePCMA = urlParser.query.forcePCMA === 'true';
	const forceVP8 = urlParser.query.forceVP8 === 'true';
	const forceH264 = urlParser.query.forceH264 === 'true';
	const forceVP9 = urlParser.query.forceVP9 === 'true';
	const forceAV1 = urlParser.query.forceAV1 === 'true';
	const enableWebcamLayers = urlParser.query.enableWebcamLayers !== 'false';
	const enableSharingLayers = urlParser.query.enableSharingLayers !== 'false';
	const webcamScalabilityMode = urlParser.query.webcamScalabilityMode;
	const sharingScalabilityMode = urlParser.query.sharingScalabilityMode;
	const numWebcamSimulcastStreams = urlParser.query.numWebcamSimulcastStreams
		? Number(urlParser.query.numWebcamSimulcastStreams)
		: 3;
	const numSharingSimulcastStreams = urlParser.query.numSharingSimulcastStreams
		? Number(urlParser.query.numSharingSimulcastStreams)
		: 3;
	const videoContentHint = urlParser.query.videoContentHint;
	const screenSharing4K = urlParser.query.screenSharing4K === 'true';
	const info = urlParser.query.info === 'true';
	const stats = urlParser.query.stats === 'true';
	const faceDetection = urlParser.query.faceDetection === 'true';
	const externalVideo = urlParser.query.externalVideo === 'true';
	const throttleSecret = urlParser.query.throttleSecret;
	const e2eKey = urlParser.query.e2eKey;
	const consumerReplicas = urlParser.query.consumerReplicas;
	const usePipeTransports = urlParser.query.usePipeTransports === 'true';
	const rtcstatsUrl = urlParser.query.rtcstatsUrl;

	// Enable face detection on demand.
	if (faceDetection)
		await faceapi.loadTinyFaceDetectorModel('/face-detector-models');

	if (info) {
		// eslint-disable-next-line require-atomic-updates
		window.SHOW_INFO = true;
	}

	if (throttleSecret) {
		// eslint-disable-next-line require-atomic-updates
		window.NETWORK_THROTTLE_SECRET = throttleSecret;
	}

	// If no roomId is provided, we will later show the LandingPage.
	// The LandingPage will generate one when "Instant Launch" is clicked.

	// Build clean shareable Room URL with only roomId.
	const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
	const roomUrl = roomId ? `${baseUrl}?roomId=${roomId}` : baseUrl;

	let displayNameSet;

	// If displayName was provided via URL or Cookie, we are done.
	if (displayName) {
		displayNameSet = true;
	}
	// Otherwise pick a random name and mark as "not set".
	else {
		displayNameSet = false;
		displayName = randomName();
	}

	// Get current device info.
	const device = deviceInfo();

	store.dispatch(stateActions.setRoomUrl(roomUrl));

	store.dispatch(stateActions.setRoomFaceDetection(faceDetection));

	store.dispatch(
		stateActions.setMe({ peerId, displayName, displayNameSet, device })
	);

	const domNode = document.getElementById('mediasoup-demo-app-container');
	const root = createRoot(domNode);

	const App = () => {
		const [step, setStep] = React.useState(1);
		const [client, setClient] = React.useState(null);
		const [chatClient, setChatClient] = React.useState(null);
		const [currentRoomId, setCurrentRoomId] = React.useState(roomId);
		const [currentDisplayName, setCurrentDisplayName] =
			React.useState(displayName);
		const [joinMode, setJoinMode] = React.useState('create');

		// Initialize client if we already have a room
		React.useEffect(() => {
			if (currentRoomId && step === 3 && !client) {
				initRoomClient(currentRoomId, currentDisplayName);
			}
		}, [currentRoomId, currentDisplayName, step]);

		const initRoomClient = (rId, dName) => {
			const rClient = new RoomClient({
				roomId: rId,
				peerId,
				displayName: dName,
				device,
				handlerName: handlerName,
				forceTcp,
				produce,
				consume,
				datachannel,
				mic,
				webcam,
				preferLocalCodecsOrder,
				forcePCMA,
				forceVP8,
				forceH264,
				forceVP9,
				forceAV1,
				enableWebcamLayers,
				enableSharingLayers,
				webcamScalabilityMode,
				sharingScalabilityMode,
				numWebcamSimulcastStreams,
				numSharingSimulcastStreams,
				videoContentHint,
				screenSharing4K,
				externalVideo,
				e2eKey,
				consumerReplicas,
				usePipeTransports,
				stats,
				rtcstatsUrl,
			});

			// NOTE: For debugging.
			roomClient = rClient;
			window.CLIENT = rClient;
			window.CC = rClient;

			setClient(rClient);
			setChatClient(null);
		};

		const handleLeave = () => {
			// Clean up global references
			if (window.CLIENT) {
				window.CLIENT = undefined;
				window.CC = undefined;
			}

			setClient(null);
			setChatClient(null);
			setCurrentRoomId(null);
			setCurrentDisplayName(null);
			setJoinMode('create');

			// Remove roomId from URL
			const urlParser = new UrlParse(window.location.href, true);
			delete urlParser.query.roomId;
			delete urlParser.query.displayName;
			window.history.pushState('', '', urlParser.toString());

			// Reset Redux room URL
			store.dispatch(stateActions.setRoomUrl(urlParser.toString()));

			setStep(1);
		};

		const handleJoin = (joinRoomId, joinDisplayName, joinType = 'create') => {
			setCurrentRoomId(joinRoomId);
			setCurrentDisplayName(joinDisplayName);
			setJoinMode(joinType);

			// Build shareable URL with only roomId
			const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
			const inviteUrl = `${baseUrl}?roomId=${joinRoomId}`;
			window.history.pushState('', '', inviteUrl);

			// Update the Redux store's room URL so the Invite Link button copies the right link
			store.dispatch(stateActions.setRoomUrl(inviteUrl));

			// Sync Redux me.displayName with the name chosen on LandingPage
			store.dispatch(stateActions.setDisplayName(joinDisplayName));

			initRoomClient(joinRoomId, joinDisplayName);
			setStep(3);
		};

		if (step === 1) {
			return <LandingPage onJoin={handleJoin} initialRoomId={roomId} />;
		}

		// Don't render Room until the roomClient has been initialized via useEffect
		if (!client) {
			return (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: '100vh',
						background: '#050505',
						color: '#C5A059',
						flexDirection: 'column',
						gap: 16,
					}}
				>
					<i
						className="fa-solid fa-spinner fa-spin"
						style={{ fontSize: '2rem' }}
					/>
					<span
						style={{
							fontSize: '0.85rem',
							opacity: 0.6,
							letterSpacing: '0.08em',
							fontFamily: 'Inter, sans-serif',
						}}
					>
						CONNECTING TO SESSION...
					</span>
				</div>
			);
		}

		return (
			<RoomContext.Provider value={{ roomClient: client, chatClient }}>
				<Room onLeave={handleLeave} joinMode={joinMode} />
			</RoomContext.Provider>
		);
	};

	root.render(
		<Provider store={store}>
			<App />
		</Provider>
	);
}

// NOTE: Debugging stuff.

window.__sendSdps = function () {
	logger.warn('>>> send transport local SDP offer:');
	logger.warn(roomClient._sendTransport._handler._pc.localDescription.sdp);

	logger.warn('>>> send transport remote SDP answer:');
	logger.warn(roomClient._sendTransport._handler._pc.remoteDescription.sdp);
};

window.__recvSdps = function () {
	logger.warn('>>> recv transport remote SDP offer:');
	logger.warn(roomClient._recvTransport._handler._pc.remoteDescription.sdp);

	logger.warn('>>> recv transport local SDP answer:');
	logger.warn(roomClient._recvTransport._handler._pc.localDescription.sdp);
};

let dataChannelTestInterval = null;

window.__startDataChannelTest = function () {
	let number = 0;

	const buffer = new ArrayBuffer(32);
	const view = new DataView(buffer);

	dataChannelTestInterval = window.setInterval(() => {
		if (window.DP) {
			view.setUint32(0, number++);
			roomClient.sendChatMessage(buffer);
		}
	}, 100);
};

window.__stopDataChannelTest = function () {
	window.clearInterval(dataChannelTestInterval);

	const buffer = new ArrayBuffer(32);
	const view = new DataView(buffer);

	if (window.DP) {
		view.setUint32(0, Math.pow(2, 32) - 1);
		window.DP.send(buffer);
	}
};

window.__testSctp = async function ({ timeout = 100, bot = false } = {}) {
	let dp;

	if (!bot) {
		await window.CLIENT.enableChatDataProducer();

		dp = window.CLIENT._chatDataProducer;
	} else {
		await window.CLIENT.enableBotDataProducer();

		dp = window.CLIENT._botDataProducer;
	}

	logger.debug(
		'__testSctp() | DataProducer created [bot:%s, streamId:%d, readyState:%s]',
		bot ? 'true' : 'false',
		dp.sctpStreamParameters.streamId,
		dp.readyState
	);

	function send() {
		dp.send(`I am streamId ${dp.sctpStreamParameters.streamId}`);
	}

	if (dp.readyState === 'open') {
		send();
	} else {
		dp.on('open', () => {
			logger.debug(
				'testSctp() | DataChannel open [streamId:%d]',
				dp.sctpStreamParameters.streamId
			);

			send();
		});
	}

	setTimeout(() => window.__testSctp({ timeout, bot }), timeout);
};

setInterval(() => {
	if (window.CLIENT._sendTransport) {
		window.H1 = window.CLIENT._sendTransport._handler;
		window.PC1 = window.CLIENT._sendTransport._handler._pc;
		window.DP = window.CLIENT._chatDataProducer;
	} else {
		delete window.PC1;
		delete window.DP;
	}

	if (window.CLIENT._recvTransport) {
		window.H2 = window.CLIENT._recvTransport._handler;
		window.PC2 = window.CLIENT._recvTransport._handler._pc;
	} else {
		delete window.PC2;
	}
}, 2000);
