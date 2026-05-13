import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { withRoomContext } from '../RoomContext';

const statusIcon = status => {
	switch (status) {
		case 'sending':
			return (
				<span className="chat-bubble__status" title="Sending...">
					<i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10 }} />
				</span>
			);
		case 'sent':
			return (
				<span className="chat-bubble__status" title="Sent">
					<i className="fa-solid fa-check" style={{ fontSize: 10, color: '#4caf50' }} />
				</span>
			);
		case 'failed':
			return (
				<span className="chat-bubble__status" title="Failed to send">
					<i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10, color: '#f44336' }} />
				</span>
			);
		default:
			return null;
	}
};

const ChatMessages = ({ chatMessages, roomClient }) => {
	const messagesEndRef = React.useRef(null);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages]);

	return (
		<div className="chat-messages">
			{chatMessages.length === 0 && (
				<div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary" style={{ fontSize: 13, opacity: 0.6 }}>
					<i className="bi bi-chat-dots fs-2 mb-2" />
					<span>No messages yet</span>
				</div>
			)}
			{chatMessages.map(msg => (
				<div
					key={msg.id}
					className={classnames('chat-bubble', {
						'chat-bubble--me': msg.me,
						'chat-bubble--other': !msg.me,
					})}
				>
					<div className="chat-bubble__sender">
						{msg.me ? 'You' : msg.displayName}
						<span className="chat-bubble__time">
							{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</span>
					</div>
					<div className="chat-bubble__text">
						{msg.text}
						{msg.me && statusIcon(msg.status)}
						{msg.me && msg.status === 'failed' && (
							<button
								className="btn btn-sm p-0 ms-1"
								title="Retry"
								style={{ color: '#f44336', background: 'none', border: 'none' }}
								onClick={() => roomClient.sendChatMessage(msg.text)}
							>
								<i className="fa-solid fa-rotate-left" style={{ fontSize: 10 }} />
							</button>
						)}
					</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</div>
	);
};

ChatMessages.propTypes = {
	roomClient: PropTypes.any,
	chatMessages: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			displayName: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired,
			time: PropTypes.number.isRequired,
			me: PropTypes.bool.isRequired,
			status: PropTypes.string,
		})
	).isRequired,
};

const mapStateToProps = state => ({
	chatMessages: state.chatMessages,
});

const ChatMessagesContainer = connect(mapStateToProps)(ChatMessages);
export default withRoomContext(ChatMessagesContainer);
