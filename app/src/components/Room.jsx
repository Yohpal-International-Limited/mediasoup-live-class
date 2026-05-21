import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import clipboardCopy from 'clipboard-copy';
import Swal from 'sweetalert2';
import * as appPropTypes from './appPropTypes';
import { withRoomContext } from '../RoomContext';
import * as requestActions from '../redux/requestActions';
import Me from './Me';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Peers from './Peers';
import Stats from './Stats';
import Notifications from './Notifications';
import NetworkThrottle from './NetworkThrottle';

class Room extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			darkMode: true,
			sidePanelOpen: false,
			activePanelTab: 'people',
		};
		this._nameChecked = false;
		this._seenConnected = false;
		this._seenPeers = false;
	}

	componentDidUpdate(prevProps) {
		const { room, peers, me, roomClient, onLeave, joinMode } = this.props;

		if (this._nameChecked) return;

		if (room.state === 'connected' && prevProps.room.state !== 'connected') {
			this._seenConnected = true;
		}
		if (prevProps.peers !== peers) {
			this._seenPeers = true;
		}

		if (this._seenConnected && this._seenPeers) {
			this._nameChecked = true;

			// Check for duplicate usernames
			const duplicate = Object.values(peers).find(
				p => p.displayName?.toLowerCase() === me.displayName?.toLowerCase()
			);

			if (duplicate) {
				roomClient.close();
				Swal.fire({
					title: 'Username Already Taken',
					text: `"${me.displayName}" is already in use in this session. Please enter a different name.`,
					icon: 'warning',
					confirmButtonText: 'Try Again',
					background: '#050505',
					color: '#F5F5F5',
					confirmButtonColor: '#FFBF29',
				}).then(() => onLeave());
			}
		}
	}

	render() {
		const {
			roomClient,
			room,
			me,
			audioProducer,
			videoProducers,
			peers,
			amActiveSpeaker,
			amSpeakingPeer,
			onRoomLinkCopy,
		} = this.props;

		const { darkMode, sidePanelOpen, activePanelTab } = this.state;

		const meTiles = [];

		if (videoProducers.length === 0) {
			meTiles.push({ type: 'me' });
		} else {
			videoProducers.forEach(vp => {
				meTiles.push({
					type: vp.type === 'share' ? 'share' : 'me',
					videoProducerId: vp.id,
				});
			});
		}

		let videoProducer = videoProducers.find(p => p.type !== 'share');

		if (!videoProducer && videoProducers.length > 0) {
			videoProducer = videoProducers[0];
		}

		let micState;
		if (!me.canSendMic) micState = 'unsupported';
		else if (!audioProducer) micState = 'unsupported';
		else if (!audioProducer.paused) micState = 'on';
		else micState = 'off';

		let webcamState;
		if (!me.canSendWebcam) webcamState = 'unsupported';
		else if (videoProducer && videoProducer.type !== 'share')
			webcamState = 'on';
		else webcamState = 'off';

		let shareState;
		if (!me.canSendWebcam) shareState = 'unsupported';
		else if (videoProducers.some(p => p.type === 'share')) shareState = 'on';
		else shareState = 'off';

		const peerCount = Object.keys(peers).length;
		const viewerCount = peerCount + 1;
		const initial = me.displayName
			? me.displayName.charAt(0).toUpperCase()
			: '?';

		return (
			<div data-component="Room" className="ics-theme">
				<Notifications />

				{/* Sidebar */}
				<aside className={classnames('ics-sidebar', { open: sidePanelOpen })}>
						<div className="sidebar-header">
							<img src="/images/logo.png" alt="ICS" className="sidebar-logo" />
							<span className="brand-text">ICS LIVE</span>
						</div>

						<div className="sidebar-nav">
							<button
								className={classnames('nav-item', {
									active: activePanelTab === 'people',
								})}
								onClick={() => this.setState({ activePanelTab: 'people' })}
							>
								<i className="fa-solid fa-users" />
								<span>Participants</span>
								<span className="badge ms-auto">{viewerCount}</span>
							</button>
							<button
								className={classnames('nav-item', {
									active: activePanelTab === 'chat',
								})}
								onClick={() => this.setState({ activePanelTab: 'chat' })}
							>
								<i className="fa-solid fa-comment-dots" />
								<span>Chat</span>
							</button>
							<button
								className="nav-item"
								onClick={() => {
									clipboardCopy(room.url).then(onRoomLinkCopy);
									Swal.fire({
										title: 'Link Copied!',
										text: 'Invitation link has been copied to your clipboard.',
										icon: 'success',
										toast: true,
										position: 'top-end',
										timer: 3000,
										showConfirmButton: false,
										background: '#0A2F1F',
										color: '#F5F5F5',
									});
								}}
							>
								<i className="fa-solid fa-link" />
								<span>Invite Link</span>
							</button>
						</div>

						<div className="sidebar-content">
							{activePanelTab === 'chat' ? (
								<div className="chat-container">
									<div className="chat-header-brand">
										<img
											src="/images/logo.png"
											alt="ICS"
											className="chat-logo"
										/>
										<span className="chat-brand-text">ICS LIVE</span>
									</div>
									<ChatMessages />
									<ChatInput />
								</div>
							) : (
								<div className="participants-list">
									<div className="peer-item">
										<div className="peer-avatar">{initial}</div>
										<div className="peer-info">
											<span className="peer-name">
												{me.displayName} <span className="peer-tag">(Me)</span>
											</span>
											<span className="peer-role">
												{me.isHost ? 'Host' : me.device?.name || 'Participant'}
											</span>
										</div>
										<div className="peer-indicators">
											<div
												className={classnames('indicator', {
													off: micState === 'off',
												})}
											>
												<i className="fa-solid fa-microphone" />
											</div>
											<div
												className={classnames('indicator', {
													off: webcamState === 'off',
												})}
											>
												<i className="fa-solid fa-video" />
											</div>
										</div>
									</div>
									{Object.keys(peers).map(id => {
										const p = peers[id];
										const pInitial = p.displayName
											? p.displayName.charAt(0).toUpperCase()
											: '?';
										return (
											<div key={id} className="peer-item">
												<div className="peer-avatar">{pInitial}</div>
												<div className="peer-info">
													<span className="peer-name">{p.displayName}</span>
													<span className="peer-role">
														{p.isHost
															? 'Host'
															: p.device?.name || 'Participant'}
													</span>
												</div>
												<div className="peer-indicators">
													<div className="indicator">
														<i className="fa-solid fa-microphone" />
													</div>
													<div className="indicator">
														<i className="fa-solid fa-video" />
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</aside>

					{/* Main Content Area */}
					<main className="ics-main">
						<header className="ics-header">
							<div className="header-left">
								<button
									className="toggle-sidebar-btn"
									onClick={() =>
										this.setState({ sidePanelOpen: !sidePanelOpen })
									}
								>
									<i
										className={`fa-solid ${sidePanelOpen ? 'fa-indent' : 'fa-outdent'}`}
									/>
								</button>
								<h1 className="session-title">Live Interactive Class</h1>
								<span className="session-status">
									<span className="status-dot pulse" />
									LIVE
								</span>
							</div>

							<div className="header-right">
								<div className="peer-count-badge">
									<i className="fa-solid fa-users" />
									<span>{viewerCount}</span>
								</div>
								<div className="session-timer">00:00:00</div>
								<div className="user-profile">
									<div className="avatar-small">{initial}</div>
									<span className="display-name">{me.displayName}</span>
								</div>
							</div>
						</header>

						<div className="ics-video-grid-container">
							<div className="video-grid">
								{meTiles.map(tile => (
									<div
										key={tile.videoProducerId || 'me'}
										className={classnames('video-tile-wrapper', {
											speaking: amSpeakingPeer,
											active: amActiveSpeaker,
										})}
									>
										<Me videoProducerId={tile.videoProducerId} />
									</div>
								))}
								<Peers />
							</div>
						</div>

						<footer className="ics-controls">
							<div className="controls-group">
								<button
									className={classnames('ctrl-btn', {
										active: micState === 'on',
										muted: micState === 'off',
									})}
									onClick={() => {
										micState === 'on'
											? roomClient.muteMic()
											: roomClient.unmuteMic();
									}}
									data-tip={micState === 'on' ? 'Mute Mic' : 'Unmute Mic'}
								>
									<i
										className={`fa-solid ${micState === 'off' ? 'fa-microphone-slash' : 'fa-microphone'}`}
									/>
									<span>{micState === 'on' ? 'Mute' : 'Unmute'}</span>
								</button>
								<button
									className={classnames('ctrl-btn', {
										active: webcamState === 'on',
										muted: webcamState === 'off',
									})}
									onClick={() => {
										webcamState === 'on'
											? roomClient.disableWebcam()
											: roomClient.enableWebcam();
									}}
									data-tip={webcamState === 'on' ? 'Stop Video' : 'Start Video'}
								>
									<i
										className={`fa-solid ${webcamState === 'off' ? 'fa-video-slash' : 'fa-video'}`}
									/>
									<span>Video</span>
								</button>
								<button
									className={classnames('ctrl-btn', {
										active: shareState === 'on',
										disabled: shareState === 'unsupported',
									})}
									onClick={() => {
										shareState === 'on'
											? roomClient.disableShare()
											: roomClient.enableShare();
									}}
									disabled={shareState === 'unsupported'}
									data-tip={
										shareState === 'on'
											? 'Stop Sharing'
											: shareState === 'unsupported'
												? 'Sharing unavailable'
												: 'Share Screen'
									}
								>
									<i className="fa-solid fa-display" />
									<span>Share</span>
								</button>
							</div>

							<div className="controls-group">
								<button
									className="ctrl-btn danger"
									onClick={() => {
										Swal.fire({
											title: 'End Session?',
											text: 'Are you sure you want to leave the class?',
											icon: 'warning',
											showCancelButton: true,
											confirmButtonText: 'Exit Now',
											background: '#050505',
											color: '#F5F5F5',
											confirmButtonColor: '#D32F2F',
										}).then(res => {
											if (res.isConfirmed) {
												roomClient.close();
												this.props.onLeave();
											}
										});
									}}
								>
									<i className="fa-solid fa-phone-slash" />
									<span>Leave</span>
								</button>
							</div>
						</footer>
					</main>

					<Stats roomClient={roomClient} />
					<ReactTooltip effect="solid" className="ics-tooltip" />
				</div>
		);
	}

	componentDidMount() {
		const { roomClient } = this.props;
		roomClient.join();
	}
}
Room.propTypes = {
	roomClient: PropTypes.any.isRequired,
	room: PropTypes.object.isRequired,
	me: appPropTypes.Me.isRequired,
	audioProducer: appPropTypes.Producer,
	videoProducers: PropTypes.arrayOf(appPropTypes.Producer).isRequired,
	peers: PropTypes.object.isRequired,
	amActiveSpeaker: PropTypes.bool.isRequired,
	amSpeakingPeer: PropTypes.bool.isRequired,
	onLeave: PropTypes.func.isRequired,
	onRoomLinkCopy: PropTypes.func.isRequired,
	joinMode: PropTypes.string,
};

const mapStateToProps = state => {
	const producersArray = Object.values(state.producers);
	const audioProducer = producersArray.find(
		p => p.track && p.track.kind === 'audio'
	);
	const videoProducers = producersArray.filter(
		p => p.track && p.track.kind === 'video'
	);

	return {
		room: state.room,
		me: state.me,
		peers: state.peers,
		audioProducer,
		videoProducers,
		amActiveSpeaker: state.me.id === state.room.activeSpeakerId,
		amSpeakingPeer: state.room.speakingPeerIds.includes(state.me.id),
	};
};

const mapDispatchToProps = dispatch => ({
	onRoomLinkCopy: () =>
		dispatch(
			requestActions.notify({ text: 'Room link copied to the clipboard' })
		),
});

const RoomContainer = withRoomContext(
	connect(mapStateToProps, mapDispatchToProps)(Room)
);
export default RoomContainer;
