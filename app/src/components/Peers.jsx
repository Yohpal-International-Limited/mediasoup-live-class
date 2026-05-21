import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as appPropTypes from './appPropTypes';
import Peer from './Peer';

const Peers = ({ peerTiles, activeSpeakerId, speakingPeerIds }) => {
	return (
		<>
			{peerTiles.map(tile => {
				return (
					<div
						key={`${tile.peerId}-${tile.videoConsumerId || 'none'}`}
						className={classnames('video-tile-wrapper', {
							'active-speaker': tile.peerId === activeSpeakerId,
							speaking: speakingPeerIds.includes(tile.peerId),
							active: tile.peerId === activeSpeakerId,
						})}
					>
						<Peer id={tile.peerId} videoConsumerId={tile.videoConsumerId} />
					</div>
				);
			})}
		</>
	);
};

Peers.propTypes = {
	peerTiles: PropTypes.arrayOf(
		PropTypes.shape({
			peerId: PropTypes.string.isRequired,
			videoConsumerId: PropTypes.string,
		})
	).isRequired,
	activeSpeakerId: PropTypes.string,
	speakingPeerIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const mapStateToProps = state => {
	const peers = Object.values(state.peers);
	const consumers = state.consumers;

	const peerTiles = [];

	peers.forEach(peer => {
		const videoConsumers = peer.consumers
			.map(cid => consumers[cid])
			.filter(c => c && c.track.kind === 'video');

		if (videoConsumers.length === 0) {
			peerTiles.push({ peerId: peer.id });
		} else {
			videoConsumers.forEach(vc => {
				peerTiles.push({
					peerId: peer.id,
					videoConsumerId: vc.id,
				});
			});
		}
	});

	return {
		peerTiles,
		activeSpeakerId: state.room.activeSpeakerId,
		speakingPeerIds: state.room.speakingPeerIds,
	};
};

const PeersContainer = connect(mapStateToProps, null, null, {
	areStatesEqual: (next, prev) => {
		return (
			prev.peers === next.peers &&
			prev.room.activeSpeakerId === next.room.activeSpeakerId &&
			prev.room.speakingPeerIds.length === next.room.speakingPeerIds.length
		);
	},
})(Peers);

export default PeersContainer;
