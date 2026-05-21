import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import Spinner from 'react-spinner';
import clipboardCopy from 'clipboard-copy';
import hark from 'hark';
import * as faceapi from 'face-api.js';
import Logger from '../Logger';
import * as appPropTypes from './appPropTypes';
import EditableInput from './EditableInput';

const logger = new Logger('PeerView');
const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({
	inputSize: 160,
	scoreThreshold: 0.5,
});

export default class PeerView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			audioVolume: 0,
			showInfo: window.SHOW_INFO || false,
			videoResolutionWidth: null,
			videoResolutionHeight: null,
			videoCanPlay: false,
			videoElemPaused: false,
			maxSpatialLayer: null,
		};
		this._audioElemRef = React.createRef();
		this._videoElemRef = React.createRef();
		this._canvasElemRef = React.createRef();
		this._audioTrack = null;
		this._videoTrack = null;
		this._hark = null;
		this._videoResolutionPeriodicTimer = null;
		this._faceDetectionRequestAnimationFrame = null;
	}

	render() {
		const {
			isMe,
			peer,
			audioProducerId,
			videoProducerId,
			audioConsumerId,
			videoConsumerId,
			videoRtpParameters,
			consumerSpatialLayers,
			consumerTemporalLayers,
			consumerCurrentSpatialLayer,
			consumerCurrentTemporalLayer,
			consumerPreferredSpatialLayer,
			consumerPreferredTemporalLayer,
			consumerPriority,
			audioMuted,
			videoVisible,
			videoMultiLayer,
			audioCodec,
			videoCodec,
			audioScore,
			videoScore,
			onChangeDisplayName,
			onChangeMaxSendingSpatialLayer,
			onChangeVideoPreferredLayers,
			onChangeVideoPriority,
			onRequestKeyFrame,
			onStatsClick,
			audioTrack,
			videoTrack,
		} = this.props;

		const {
			audioVolume,
			showInfo,
			videoResolutionWidth,
			videoResolutionHeight,
			videoCanPlay,
			videoElemPaused,
			maxSpatialLayer,
		} = this.state;

		const initial = peer.displayName
			? peer.displayName.charAt(0).toUpperCase()
			: '?';

		const micState = (audioProducerId || audioConsumerId) && !audioMuted ? 'on' : 'off';
		const camState = videoVisible ? 'on' : 'off';

		return (
			<div data-component="PeerView" className="ics-peerview">
				<div className="tile-bg">
					<div className="tile-avatar">{initial}</div>
				</div>

				<video
					ref={this._videoElemRef}
					className={classnames({
						'is-me': isMe,
						hidden: !videoVisible || !videoCanPlay,
						'network-error':
							videoVisible &&
							videoMultiLayer &&
							consumerCurrentSpatialLayer === null,
					})}
					autoPlay
					playsInline
					muted
					controls={false}
				/>
				<audio
					ref={this._audioElemRef}
					autoPlay
					muted={isMe || audioMuted}
					controls={false}
				/>
				<canvas
					ref={this._canvasElemRef}
					className={classnames('face-detection', { 'is-me': isMe })}
				/>

				<div className="tile-overlay">
					<div className="tile-header">
						{peer.isHost && (
							<span className="premium-badge">
								<i className="fa-solid fa-crown" />
								<span>Host</span>
							</span>
						)}
						<div className="status-indicators">
							<div
								className={classnames('indicator', { off: micState === 'off' })}
							>
								<i
									className={`fa-solid ${micState === 'off' ? 'fa-microphone-slash' : 'fa-microphone'}`}
								/>
							</div>
							<div
								className={classnames('indicator', { off: camState === 'off' })}
							>
								<i
									className={`fa-solid ${camState === 'off' ? 'fa-video-slash' : 'fa-video'}`}
								/>
							</div>
						</div>
					</div>

					<div className="tile-footer">
						<div className="user-info">
							{isMe ? (
								<EditableInput
									value={peer.displayName}
									propName="displayName"
									className="display-name-editable"
									classLoading="loading"
									classInvalid="invalid"
									shouldBlockWhileLoading
									editProps={{
										maxLength: 20,
										autoCorrect: 'false',
										spellCheck: 'false',
									}}
									onChange={({ displayName }) =>
										onChangeDisplayName(displayName)
									}
								/>
							) : (
								<span className="display-name">{peer.displayName}</span>
							)}
							<div className="device-tag">
								<i
									className={`fa-solid ${peer.device.flag === 'mobile' ? 'fa-mobile-screen' : 'fa-laptop'}`}
								/>
								<span>{peer.device.name}</span>
							</div>
						</div>

						<div className="action-buttons">
							{videoTrack && (
								<button
									className="action-btn"
									onClick={() => this._handleToggleFullscreen()}
									data-tip="Toggle Fullscreen"
								>
									<i className="fa-solid fa-expand" />
								</button>
							)}
							<button
								className="action-btn"
								onClick={() => this.setState({ showInfo: !showInfo })}
								data-tip="Session Info"
							>
								<i className="fa-solid fa-circle-info" />
							</button>
							<button
								className="action-btn"
								onClick={() => onStatsClick(peer.id)}
								data-tip="View Stats"
							>
								<i className="fa-solid fa-chart-line" />
							</button>
						</div>
					</div>
				</div>

				<div className={classnames('info-overlay', { visible: showInfo })}>
					<div className="info-header">
						<h6>Stream Metadata</h6>
						<button
							className="close-btn"
							onClick={() => this.setState({ showInfo: false })}
						>
							<i className="fa-solid fa-xmark" />
						</button>
					</div>
					<div className="info-body">
						{(audioProducerId || audioConsumerId) && (
							<section>
								<label>Audio</label>
								<p>
									ID: {(audioProducerId || audioConsumerId).substring(0, 8)}...
								</p>
								{audioCodec && <p>Codec: {audioCodec}</p>}
							</section>
						)}
						{(videoProducerId || videoConsumerId) && (
							<section>
								<label>Video</label>
								<p>
									ID: {(videoProducerId || videoConsumerId).substring(0, 8)}...
								</p>
								{videoCodec && <p>Codec: {videoCodec}</p>}
								{videoVisible && videoResolutionWidth !== null && (
									<p>
										Res: {videoResolutionWidth}x{videoResolutionHeight}
									</p>
								)}
							</section>
						)}
					</div>
				</div>

				<div className="audio-meter">
					<div
						className="meter-inner"
						style={{
							width: `${audioVolume * 10}%`,
							background: audioVolume > 7 ? '#D32F2F' : '#C5A059',
						}}
					/>
				</div>

				{videoVisible && videoScore < 5 && (
					<div className="loading-overlay">
						<Spinner />
						<span>Optimizing Steam...</span>
					</div>
				)}
			</div>
		);
	}

	componentDidMount() {
		const { audioTrack, videoTrack } = this.props;
		this._setTracks(audioTrack, videoTrack);
	}

	componentWillUnmount() {
		if (this._hark) this._hark.stop();
		clearInterval(this._videoResolutionPeriodicTimer);
		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);
		const audioElem = this._audioElemRef.current;
		const videoElem = this._videoElemRef.current;
		if (audioElem) {
			audioElem.pause();
			audioElem.srcObject = null;
		}
		if (videoElem) {
			videoElem.pause();
			videoElem.srcObject = null;
			videoElem.oncanplay = null;
			videoElem.onplay = null;
			videoElem.onpause = null;
		}
	}

	UNSAFE_componentWillUpdate() {
		const { isMe, audioTrack, videoTrack, videoRtpParameters } = this.props;
		const { maxSpatialLayer } = this.state;
		if (isMe && videoRtpParameters && maxSpatialLayer === null)
			this.setState({
				maxSpatialLayer: videoRtpParameters.encodings.length - 1,
			});
		else if (isMe && !videoRtpParameters && maxSpatialLayer !== null)
			this.setState({ maxSpatialLayer: null });
		this._setTracks(audioTrack, videoTrack);
	}

	_setTracks(audioTrack, videoTrack) {
		const { faceDetection } = this.props;
		if (this._audioTrack === audioTrack && this._videoTrack === videoTrack)
			return;
		this._audioTrack = audioTrack;
		this._videoTrack = videoTrack;
		if (this._hark) this._hark.stop();
		this._stopVideoResolution();
		if (faceDetection) this._stopFaceDetection();
		const audioElem = this._audioElemRef.current;
		const videoElem = this._videoElemRef.current;
		if (audioTrack) {
			const stream = new MediaStream();
			stream.addTrack(audioTrack);
			audioElem.srcObject = stream;
			audioElem
				.play()
				.catch(error => logger.warn('audioElem.play() failed:%o', error));
			this._runHark(stream);
		} else {
			audioElem.srcObject = null;
		}
		if (videoTrack) {
			const stream = new MediaStream();
			stream.addTrack(videoTrack);
			videoElem.srcObject = stream;
			videoElem.oncanplay = () => this.setState({ videoCanPlay: true });
			videoElem.onplay = () => {
				this.setState({ videoElemPaused: false });
				audioElem
					.play()
					.catch(error => logger.warn('audioElem.play() failed:%o', error));
			};
			videoElem.onpause = () => this.setState({ videoElemPaused: true });
			videoElem
				.play()
				.catch(error => logger.warn('videoElem.play() failed:%o', error));
			this._startVideoResolution();
			if (faceDetection) this._startFaceDetection();
		} else {
			videoElem.srcObject = null;
		}
	}

	_runHark(stream) {
		if (!stream.getAudioTracks()[0])
			throw new Error('_runHark() | given stream has no audio track');
		this._hark = hark(stream, { play: false });
		this._hark.on('volume_change', (dBs, threshold) => {
			let audioVolume = Math.round(Math.pow(10, dBs / 85) * 10);
			if (audioVolume === 1) audioVolume = 0;
			if (audioVolume !== this.state.audioVolume)
				this.setState({ audioVolume });
		});
	}

	_startVideoResolution() {
		this._videoResolutionPeriodicTimer = setInterval(() => {
			const { videoResolutionWidth, videoResolutionHeight } = this.state;
			const videoElem = this._videoElemRef.current;
			if (
				videoElem.videoWidth !== videoResolutionWidth ||
				videoElem.videoHeight !== videoResolutionHeight
			)
				this.setState({
					videoResolutionWidth: videoElem.videoWidth,
					videoResolutionHeight: videoElem.videoHeight,
				});
		}, 500);
	}

	_stopVideoResolution() {
		clearInterval(this._videoResolutionPeriodicTimer);
		this.setState({ videoResolutionWidth: null, videoResolutionHeight: null });
	}

	_startFaceDetection() {
		const videoElem = this._videoElemRef.current;
		const canvasElem = this._canvasElemRef.current;
		const step = async () => {
			if (!this._videoTrack || videoElem.readyState < 2) {
				this._faceDetectionRequestAnimationFrame = requestAnimationFrame(step);
				return;
			}
			const detection = await faceapi.detectSingleFace(
				videoElem,
				tinyFaceDetectorOptions
			);
			if (detection) {
				const width = videoElem.offsetWidth;
				const height = videoElem.offsetHeight;
				canvasElem.width = width;
				canvasElem.height = height;
				faceapi.draw.drawDetections(
					canvasElem,
					faceapi.resizeResults(detection, { width, height })
				);
			} else {
				canvasElem.width = 0;
				canvasElem.height = 0;
			}
			this._faceDetectionRequestAnimationFrame = requestAnimationFrame(() =>
				setTimeout(step, 100)
			);
		};
		step();
	}

	_stopFaceDetection() {
		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);
		const canvasElem = this._canvasElemRef.current;
		canvasElem.width = 0;
		canvasElem.height = 0;
	}

	_handleToggleFullscreen() {
		const videoElem = this._videoElemRef.current;

		if (!videoElem) return;

		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			videoElem.requestFullscreen().catch(err => {
				logger.error('Error attempting to enable full-screen mode: %o', err);
			});
		}
	}

	_printProducerScore(id, score) {
		const scores = Array.isArray(score) ? score : [score];
		return (
			<React.Fragment key={id}>
				<p>streams:</p>
				{scores
					.filter(v => v)
					.sort((a, b) =>
						a.rid ? (a.rid > b.rid ? 1 : -1) : a.ssrc > b.ssrc ? 1 : -1
					)
					.map(({ ssrc, rid, score: score2 }, idx) => (
						<p key={idx} className="indent">
							{rid !== undefined
								? `rid:${rid}, ssrc:${ssrc}, score:${score2}`
								: `ssrc:${ssrc}, score:${score2}`}
						</p>
					))}
			</React.Fragment>
		);
	}

	_printConsumerScore(id, score) {
		return (
			<p
				key={id}
			>{`score:${score.score}, producerScore:${score.producerScore}, producerScores:[${score.producerScores}]`}</p>
		);
	}
}

PeerView.propTypes = {
	isMe: PropTypes.bool,
	peer: PropTypes.oneOfType([appPropTypes.Me, appPropTypes.Peer]).isRequired,
	audioProducerId: PropTypes.string,
	videoProducerId: PropTypes.string,
	audioConsumerId: PropTypes.string,
	videoConsumerId: PropTypes.string,
	audioRtpParameters: PropTypes.object,
	videoRtpParameters: PropTypes.object,
	consumerSpatialLayers: PropTypes.number,
	consumerTemporalLayers: PropTypes.number,
	consumerCurrentSpatialLayer: PropTypes.number,
	consumerCurrentTemporalLayer: PropTypes.number,
	consumerPreferredSpatialLayer: PropTypes.number,
	consumerPreferredTemporalLayer: PropTypes.number,
	consumerPriority: PropTypes.number,
	audioTrack: PropTypes.any,
	videoTrack: PropTypes.any,
	audioMuted: PropTypes.bool,
	videoVisible: PropTypes.bool.isRequired,
	videoMultiLayer: PropTypes.bool,
	audioCodec: PropTypes.string,
	videoCodec: PropTypes.string,
	audioScore: PropTypes.any,
	videoScore: PropTypes.any,
	faceDetection: PropTypes.bool.isRequired,
	onChangeDisplayName: PropTypes.func,
	onChangeMaxSendingSpatialLayer: PropTypes.func,
	onChangeVideoPreferredLayers: PropTypes.func,
	onChangeVideoPriority: PropTypes.func,
	onRequestKeyFrame: PropTypes.func,
	onStatsClick: PropTypes.func.isRequired,
};
