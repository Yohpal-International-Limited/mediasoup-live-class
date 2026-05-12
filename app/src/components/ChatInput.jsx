import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRoomContext } from '../RoomContext';

const BotMessageRegex = new RegExp('^@bot (.*)');

class ChatInput extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			text: '',
		};

		this._textareaElem = null;
	}

	render() {
		const { connected, chatDataProducer, botDataProducer } = this.props;

		const { text } = this.state;

		const disabled = !connected || (!chatDataProducer && !botDataProducer);

		return (
			<div data-component="ChatInput" className="d-flex gap-2">
				<textarea
					ref={elem => {
						this._textareaElem = elem;
					}}
					placeholder={disabled ? 'Chat unavailable' : 'Type a message...'}
					dir="auto"
					autoComplete="off"
					disabled={disabled}
					value={text}
					rows={1}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
				/>
				<button
					className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0"
					disabled={disabled || !text.trim()}
					onClick={this.handleSend}
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
		);
	}

	handleChange = event => {
		this.setState({ text: event.target.value });
	};

	handleSend = () => {
		const text = this.state.text.trim();

		if (!text) return;

		this.setState({ text: '' });

		const { roomClient } = this.props;
		const match = BotMessageRegex.exec(text);

		if (!match) {
			roomClient.sendChatMessage(text);
		} else {
			roomClient.sendBotMessage(match[1].trim());
		}
	};

	handleKeyDown = event => {
		if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
			event.preventDefault();
			this.handleSend();
		}
	};
}

ChatInput.propTypes = {
	roomClient: PropTypes.any.isRequired,
	connected: PropTypes.bool.isRequired,
	chatDataProducer: PropTypes.any,
	botDataProducer: PropTypes.any,
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
	};
};

const ChatInputContainer = withRoomContext(
	connect(mapStateToProps, undefined)(ChatInput)
);

export default ChatInputContainer;
