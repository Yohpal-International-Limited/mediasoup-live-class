/* eslint-disable react/display-name */
import React from 'react';

const RoomContext = React.createContext();

export default RoomContext;

export function withRoomContext(Component) {
	return props => (
		<RoomContext.Consumer>
			{context => <Component {...props} {...context} />}
		</RoomContext.Consumer>
	);
}
