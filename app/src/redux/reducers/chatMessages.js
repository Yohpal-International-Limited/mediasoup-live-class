const initialState = [];

const chatMessages = (state = initialState, action) => {
	switch (action.type) {
		case 'ADD_CHAT_MESSAGE': {
			const { message } = action.payload;

			return [...state, message];
		}

		default:
			return state;
	}
};

export default chatMessages;
