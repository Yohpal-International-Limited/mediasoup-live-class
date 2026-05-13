const initialState = [];

const chatMessages = (state = initialState, action) => {
	switch (action.type) {
		case 'ADD_CHAT_MESSAGE': {
			const { message } = action.payload;

			return [...state, message];
		}

		case 'UPDATE_CHAT_MESSAGE_STATUS': {
			const { clientId, status } = action.payload;

			return state.map(msg =>
				msg.clientId === clientId ? { ...msg, status } : msg
			);
		}

		default:
			return state;
	}
};

export default chatMessages;
