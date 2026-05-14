import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRoomContext } from '../RoomContext';
import * as stateActions from '../redux/stateActions';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

class Stats extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			sendTransportRemoteStats: null,
			sendTransportLocalStats: null,
			recvTransportRemoteStats: null,
			recvTransportLocalStats: null,
			audioProducerRemoteStats: null,
			audioProducerLocalStats: null,
			videoProducerRemoteStats: null,
			videoProducerLocalStats: null,
			audioConsumerRemoteStats: null,
			audioConsumerLocalStats: null,
			videoConsumerRemoteStats: null,
			videoConsumerLocalStats: null,
		};

		this._delayTimer = null;
		this._chartRef = React.createRef();
		this._chart = null;
		this._bitrateHistory = [];
	}

	render() {
		const { peerId, peerDisplayName, isMe, onClose } = this.props;
		if (!peerId) return null;

		return (
			<div data-component="Stats" className="ics-stats-modal" onClick={onClose}>
				<div className="modal-content" onClick={e => e.stopPropagation()}>
					<div className="modal-header">
						<div className="title-group">
							<i className="fa-solid fa-chart-line" />
							<h3>
								{isMe
									? 'My Connection Quality'
									: `Stats for ${peerDisplayName}`}
							</h3>
						</div>
						<button className="close-btn" onClick={onClose}>
							<i className="fa-solid fa-xmark" />
						</button>
					</div>

					<div className="modal-body">
						<div className="stats-grid">
							<div className="stats-card chart-card">
								<div className="card-header">
									<label>Real-time Bitrate (kbps)</label>
								</div>
								<div className="chart-container">
									<canvas ref={this._chartRef} />
								</div>
							</div>

							<div className="stats-card metrics-card">
								<div className="card-header">
									<label>Live Metrics</label>
								</div>
								<div className="metrics-list">
									{this._renderMetric(
										'Round Trip Time',
										this._getMetricValue('rtt'),
										'ms'
									)}
									{this._renderMetric(
										'Packet Loss',
										this._getMetricValue('packetLoss'),
										'%'
									)}
									{this._renderMetric(
										'Jitter',
										this._getMetricValue('jitter'),
										'ms'
									)}
									{this._renderMetric(
										'Resolution',
										this._getMetricValue('resolution'),
										''
									)}
								</div>
							</div>
						</div>

						<div className="raw-details">
							<label>Advanced Stream Details</label>
							<div className="details-scroll">
								{this._renderRawSection(
									'Send Transport',
									this.state.sendTransportRemoteStats
								)}
								{this._renderRawSection(
									'Video Producer',
									this.state.videoProducerRemoteStats
								)}
								{this._renderRawSection(
									'Audio Producer',
									this.state.audioProducerRemoteStats
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	_renderMetric(label, value, unit) {
		return (
			<div className="metric-item">
				<span className="label">{label}</span>
				<span className="value">
					{value} <small>{unit}</small>
				</span>
			</div>
		);
	}

	_renderRawSection(title, stats) {
		if (!stats) return null;
		return (
			<div className="detail-section">
				<h6>{title}</h6>
				<pre>{JSON.stringify(stats, null, 2)}</pre>
			</div>
		);
	}

	_getMetricValue(key) {
		const stats =
			this.state.videoProducerRemoteStats ||
			this.state.videoConsumerRemoteStats ||
			{};
		const values = Array.isArray(stats)
			? stats[0]
			: stats.values
				? Array.from(stats.values())[0]
				: {};

		if (!values) return 'N/A';

		switch (key) {
			case 'rtt':
				return values.roundTripTime || 'N/A';
			case 'packetLoss':
				return values.fractionLost
					? Math.round(values.fractionLost * 100)
					: '0';
			case 'jitter':
				return values.jitter ? Math.round(values.jitter * 1000) : 'N/A';
			case 'resolution':
				return values.width ? `${values.width}x${values.height}` : 'N/A';
			default:
				return 'N/A';
		}
	}

	componentDidMount() {
		const { peerId } = this.props;
		if (peerId) {
			this._delayTimer = setTimeout(() => this._start(), 250);
			this._initChart();
		}
	}

	componentWillUnmount() {
		this._stop();
		if (this._chart) {
			this._chart.destroy();
		}
	}

	componentDidUpdate(prevProps) {
		const { peerId } = this.props;

		if (peerId && !prevProps.peerId) {
			this._delayTimer = setTimeout(() => this._start(), 250);
			this._initChart();
		} else if (!peerId && prevProps.peerId) {
			this._stop();
		} else if (peerId && prevProps.peerId && peerId !== prevProps.peerId) {
			this._stop();
			this._start();
			this._initChart();
		}
	}

	_initChart() {
		if (this._chart) this._chart.destroy();

		const ctx = this._chartRef.current.getContext('2d');
		this._chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: new Array(20).fill(''),
				datasets: [
					{
						label: 'Bitrate',
						data: new Array(20).fill(0),
						borderColor: '#C5A059',
						backgroundColor: 'rgba(197, 160, 89, 0.1)',
						borderWidth: 2,
						fill: true,
						tension: 0.4,
						pointRadius: 0,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(255,255,255,0.05)' },
						ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
					},
					x: { display: false },
				},
			},
		});
	}

	async _start() {
		const { roomClient, isMe, audioConsumerId, videoConsumerId } = this.props;

		let sendTransportRemoteStats = null;
		let audioProducerRemoteStats = null;
		let videoProducerRemoteStats = null;
		let audioConsumerRemoteStats = null;
		let videoConsumerRemoteStats = null;

		try {
			if (isMe) {
				sendTransportRemoteStats =
					await roomClient.getSendTransportRemoteStats();
				audioProducerRemoteStats = await roomClient.getAudioRemoteStats();
				videoProducerRemoteStats = await roomClient.getVideoRemoteStats();
			} else {
				audioConsumerRemoteStats =
					await roomClient.getConsumerRemoteStats(audioConsumerId);
				videoConsumerRemoteStats =
					await roomClient.getConsumerRemoteStats(videoConsumerId);
			}
		} catch (error) {}

		this.setState({
			sendTransportRemoteStats,
			audioProducerRemoteStats,
			videoProducerRemoteStats,
			audioConsumerRemoteStats,
			videoConsumerRemoteStats,
		});

		this._updateChart(videoProducerRemoteStats || videoConsumerRemoteStats);

		this._delayTimer = setTimeout(() => this._start(), 2000);
	}

	_updateChart(stats) {
		if (!this._chart || !stats) return;
		const values = Array.isArray(stats)
			? stats[0]
			: stats.values
				? Array.from(stats.values())[0]
				: {};
		const bitrate = values.bitrate ? Math.round(values.bitrate / 1000) : 0;

		this._bitrateHistory.push(bitrate);
		if (this._bitrateHistory.length > 20) this._bitrateHistory.shift();

		this._chart.data.datasets[0].data = this._bitrateHistory;
		this._chart.update('none');
	}

	_stop() {
		clearTimeout(this._delayTimer);
		this._bitrateHistory = [];
		this.setState({
			sendTransportRemoteStats: null,
			audioProducerRemoteStats: null,
			videoProducerRemoteStats: null,
			audioConsumerRemoteStats: null,
			videoConsumerRemoteStats: null,
		});
	}
}

Stats.propTypes = {
	roomClient: PropTypes.any.isRequired,
	peerId: PropTypes.string,
	peerDisplayName: PropTypes.string,
	isMe: PropTypes.bool,
	audioConsumerId: PropTypes.string,
	videoConsumerId: PropTypes.string,
	onClose: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
	const { room, me, peers, consumers } = state;
	const { statsPeerId } = room;

	if (!statsPeerId) return {};

	const isMe = statsPeerId === me.id;
	const peer = isMe ? me : peers[statsPeerId];
	let audioConsumerId;
	let videoConsumerId;

	if (!isMe && peer.consumers) {
		for (const consumerId of peer.consumers) {
			const consumer = consumers[consumerId];
			if (!consumer) continue;
			if (consumer.track.kind === 'audio') audioConsumerId = consumer.id;
			else if (consumer.track.kind === 'video') videoConsumerId = consumer.id;
		}
	}

	return {
		peerId: peer.id,
		peerDisplayName: peer.displayName,
		isMe,
		audioConsumerId,
		videoConsumerId,
	};
};

const mapDispatchToProps = dispatch => ({
	onClose: () => dispatch(stateActions.setRoomStatsPeerId(null)),
});

export default withRoomContext(
	connect(mapStateToProps, mapDispatchToProps)(Stats)
);
