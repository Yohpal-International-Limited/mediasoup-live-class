import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRoomContext } from '../RoomContext';

const BotMessageRegex = new RegExp('^@bot (.*)');

const ChatInput = ({
	roomClient,
	connected,
	chatDataProducer,
	botDataProducer,
	replyToMessage,
	onClearReply,
}) => {
	const [text, setText] = useState('');

	const disabled = !connected;

	const handleChange = event => {
		setText(event.target.value);
	};

	const handleSend = () => {
		const trimmedText = text.trim();

		if (!trimmedText) return;

		setText('');

		const match = BotMessageRegex.exec(trimmedText);

		if (!match) {
			roomClient.sendChatMessage(trimmedText, replyToMessage?.id);
			onClearReply?.();
		} else {
			roomClient.sendBotMessage(match[1].trim());
		}
	};

	const handleKeyDown = event => {
		if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
			event.preventDefault();
			handleSend();
		}
	};

	return (
		<>
			{replyToMessage && (
				<div
					style={{
						fontSize: '12px',
						opacity: 0.7,
						padding: '6px 10px',
						borderLeft: '2px solid #C5A059',
						marginBottom: '4px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<div>Replying to {replyToMessage.displayName}</div>
						<div style={{ opacity: 0.6 }}>{replyToMessage.text.substring(0, 50)}...</div>
					</div>
					<button
						className="btn btn-sm p-0"
						style={{
							color: '#999',
							background: 'none',
							border: 'none',
						}}
						onClick={onClearReply}
						title="Cancel reply"
					>
						<i className="fa-solid fa-times" />
					</button>
				</div>
			)}
			<div data-component="ChatInput" className="d-flex gap-2">
				<textarea
					placeholder={disabled ? 'Chat unavailable' : 'Type a message...'}
					dir="auto"
					autoComplete="off"
					disabled={disabled}
					value={text}
					rows={1}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
				/>
				<button
					className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0"
					disabled={disabled || !text.trim()}
					onClick={handleSend}
					style={{
						width: 36,
						height: 36,
						borderRadius: 8,
						background: text.trim() ? '#C5A059' : 'rgba(197,160,89,0.15)',
						border: 'none',
						color: text.trim() ? '#050505' : 'rgba(245,245,245,0.3)',
						transition: 'all 0.2s ease',
					}}
				>
					<i className="fa-solid fa-paper-plane" style={{ fontSize: 13 }} />
				</button>
			</div>
		</>
	);
};

ChatInput.propTypes = {
	roomClient: PropTypes.any.isRequired,
	connected: PropTypes.bool.isRequired,
	chatDataProducer: PropTypes.any,
	botDataProducer: PropTypes.any,
	displayName: PropTypes.string,
	peerId: PropTypes.string,
	replyToMessage: PropTypes.any,
	onClearReply: PropTypes.func,
};

const mapStateToProps = state => {
	const dataProducersArray = Object.values(state.dataProducers);
	const chatDataProducer = dataProducersArray.find(
		dataProducer => dataProducer.label === 'chat'
	);
	const botDataProducer = dataProducersArray.find(
		dataProducer => dataProducer.label === 'bot'
	);

	return {
		connected: state.room.state === 'connected',
		chatDataProducer,
		botDataProducer,
		displayName: state.me.displayName,
		peerId: state.me.peerId,
	};
};

const ChatInputContainer = withRoomContext(
	connect(mapStateToProps, undefined)(ChatInput)
);

export default ChatInputContainer;
