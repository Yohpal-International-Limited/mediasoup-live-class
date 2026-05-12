import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const ChatMessages = ({ chatMessages }) => {
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
					<div className="chat-bubble__text">{msg.text}</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</div>
	);
};

ChatMessages.propTypes = {
	chatMessages: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			displayName: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired,
			time: PropTypes.number.isRequired,
			me: PropTypes.bool.isRequired,
		})
	).isRequired,
};

const mapStateToProps = state => ({
	chatMessages: state.chatMessages,
});

const ChatMessagesContainer = connect(mapStateToProps)(ChatMessages);
export default ChatMessagesContainer;
