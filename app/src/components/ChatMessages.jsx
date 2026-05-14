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
					<i
						className="fa-solid fa-check"
						style={{ fontSize: 10, color: '#4caf50' }}
					/>
				</span>
			);
		case 'failed':
			return (
				<span className="chat-bubble__status" title="Failed to send">
					<i
						className="fa-solid fa-circle-exclamation"
						style={{ fontSize: 10, color: '#f44336' }}
					/>
				</span>
			);
		default:
			return null;
	}
};

const ChatMessages = ({
	roomClient,
	chatMessages,
	onReplyClick,
}) => {
	const messagesEndRef = React.useRef(null);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages]);

	const getRepliedToMessage = (messageId) => {
		return chatMessages.find(m => m.id === messageId);
	};

	return (
		<div className="chat-messages">
			{chatMessages.length === 0 && (
				<div
					className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary"
					style={{ fontSize: 13, opacity: 0.6 }}
				>
					<i className="bi bi-chat-dots fs-2 mb-2" />
					<span>No messages yet</span>
				</div>
			)}
			{chatMessages.map(msg => {
				const repliedTo = msg.replyToMessageId ? getRepliedToMessage(msg.replyToMessageId) : null;
				return (
					<div
						key={msg.id}
						className={classnames('chat-bubble', {
							'chat-bubble--me': msg.me,
							'chat-bubble--other': !msg.me,
						})}
					>
						{repliedTo && (
							<div
								style={{
									fontSize: '12px',
									opacity: 0.6,
									padding: '4px 8px',
									borderLeft: '2px solid #C5A059',
									marginBottom: '4px',
									fontStyle: 'italic',
								}}
							>
								<div>↳ {repliedTo.displayName}</div>
								<div style={{ opacity: 0.7 }}>{repliedTo.text.substring(0, 50)}...</div>
							</div>
						)}
						<div className="chat-bubble__sender">
							{msg.me ? 'You' : msg.displayName}
							<span className="chat-bubble__time">
								{new Date(msg.time).toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit',
								})}
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
									<i
										className="fa-solid fa-rotate-left"
										style={{ fontSize: 10 }}
									/>
								</button>
							)}
						</div>
						<button
							className="btn btn-sm p-0 ms-1"
							title="Reply"
							style={{
								color: '#C5A059',
								background: 'none',
								border: 'none',
								fontSize: '10px',
							}}
							onClick={() => onReplyClick(msg)}
						>
							<i className="fa-solid fa-reply" />
						</button>
					</div>
				);
			})}
			<div ref={messagesEndRef} />
		</div>
	);
};

ChatMessages.propTypes = {
	roomClient: PropTypes.any,
	myPeerId: PropTypes.string,
	chatMessages: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			displayName: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired,
			time: PropTypes.number.isRequired,
			me: PropTypes.bool.isRequired,
			status: PropTypes.string,
			replyToMessageId: PropTypes.string,
		})
	).isRequired,
	replyToMessage: PropTypes.any,
	onReplyClick: PropTypes.func,
};

const mapStateToProps = state => ({
	chatMessages: state.chatMessages,
	myPeerId: state.me.peerId,
});

const ChatMessagesContainer = connect(mapStateToProps)(ChatMessages);
export default withRoomContext(ChatMessagesContainer);
