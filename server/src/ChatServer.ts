import { Server as SocketIoServer } from 'socket.io';
import type * as http from 'node:http';
import type * as https from 'node:https';
import { Logger } from './Logger';
import type { Room } from './Room';

const logger = new Logger('ChatServer');

export class ChatServer {
	readonly #io: SocketIoServer;
	readonly #getRoom: (roomId: string) => Room | undefined;

	constructor(
		httpServer: http.Server | https.Server,
		getRoom: (roomId: string) => Room | undefined
	) {
		this.#io = new SocketIoServer(httpServer, {
			cors: {
				origin: '*',
			},
			transports: ['websocket'],
		});

		this.#getRoom = getRoom;

		this.handleIo();
	}

	private handleIo(): void {
		this.#io.on('connection', socket => {
			const { token, appId } = socket.handshake.query;

			logger.debug('connection [id:%s, token:%s, appId:%s]', socket.id, token, appId);

			if (typeof token === 'string') {
				const [peerId, roomId] = token.split(':');
				if (roomId) {
					socket.join(roomId);
					(socket as any).peerId = peerId;
					(socket as any).roomId = roomId;
					logger.debug('socket joined room from token [socketId:%s, roomId:%s, peerId:%s]', socket.id, roomId, peerId);
				}
			}

			socket.on('message.send', (data, callback) => {
				const { conversationId, content } = data;
				const roomId = conversationId || (socket as any).roomId;
				const peerId = (socket as any).peerId;

				logger.debug('message.send [roomId:%s, content:%s, peerId:%s]', roomId, content, peerId);

				const room = this.#getRoom(roomId);

				if (!room) {
					logger.error('room not found [roomId:%s]', roomId);
					if (callback) callback({ error: 'Room not found' });
					return;
				}

				// Find peer to get displayName
				// We need a way to get peer by id from Room
				// Actually, we can just use a default for now or add getPeer to Room
				const displayName = (room as any).getPeerDisplayName?.(peerId) || 'Guest';

				room.addChatMessage({
					senderId: peerId || socket.id,
					displayName,
					content
				});

				if (callback) callback({ success: true });
			});

			socket.on('chat.join', (data) => {
				const { roomId } = data;
				socket.join(roomId);
				logger.debug('socket joined room [socketId:%s, roomId:%s]', socket.id, roomId);
			});
		});
	}

	/**
	 * Broadcasts a chat message to all clients in a room.
	 */
	broadcastMessage(roomId: string, message: any): void {
		this.#io.to(roomId).emit('message:new', {
			eventId: `ev_${Date.now()}`,
			type: 'message.created.v1',
			timestamp: Date.now(),
			data: {
				message
			}
		});
	}

	/**
	 * Joins a socket to a room.
	 */
	joinRoom(socketId: string, roomId: string): void {
		const socket = this.#io.sockets.sockets.get(socketId);
		if (socket) {
			socket.join(roomId);
		}
	}
}
