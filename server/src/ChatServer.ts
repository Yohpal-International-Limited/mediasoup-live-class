import { Server as SocketIoServer } from 'socket.io';
import type * as http from 'node:http';
import type * as https from 'node:https';
import { Logger } from './Logger';
import type { Room } from './Room';

const logger = new Logger('ChatServer');

interface ChatMessage {
	id: string;
	senderId: string;
	displayName: string;
	content: string;
	timestamp: number;
	seq: number;
	conversationId: string;
}

export class ChatServer {
	readonly #io: SocketIoServer;
	readonly #getRoom: (roomId: string) => Room | undefined;
	readonly #roomSockets = new Map<string, Set<string>>();

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
					this.trackSocketInRoom(roomId, socket.id);
				}
			}

			socket.on('chat:send', (data, callback) => {
				this.handleChatSend(socket, data, callback);
			});

			socket.on('chat:getHistory', (data, callback) => {
				this.handleGetChatHistory(socket, data, callback);
			});

			socket.on('disconnect', () => {
				const roomId = (socket as any).roomId;
				if (roomId) {
					this.untrackSocketFromRoom(roomId, socket.id);
				}
			});
		});
	}

	private handleChatSend(socket: any, data: any, callback?: (arg0: any) => void): void {
		const { content, replyToMessageId } = data;
		const roomId = (socket as any).roomId;
		const peerId = (socket as any).peerId;

		if (!content || typeof content !== 'string') {
			if (callback) callback({ error: 'Content is required' });
			return;
		}

		if (content.length > 5000) {
			if (callback) callback({ error: 'Message too long (max 5000 chars)' });
			return;
		}

		if (!roomId) {
			logger.error('chat:send - no roomId for socket [socketId:%s]', socket.id);
			if (callback) callback({ error: 'Not in a room' });
			return;
		}

		const room = this.#getRoom(roomId);
		if (!room) {
			logger.error('room not found [roomId:%s]', roomId);
			if (callback) callback({ error: 'Room not found' });
			return;
		}

		const displayName = (room as any).getPeerDisplayName?.(peerId) || 'Guest';

		// Add message via Room (generates server ID and timestamp)
		room.addChatMessage({
			senderId: peerId || socket.id,
			displayName,
			content,
			replyToMessageId,
		});

		if (callback) callback({ success: true });
	}

	private handleGetChatHistory(socket: any, data: any, callback?: (arg0: any) => void): void {
		const { lastSeq = -1 } = data || {};
		const roomId = (socket as any).roomId;

		if (!roomId) {
			if (callback) callback({ error: 'Not in a room' });
			return;
		}

		const room = this.#getRoom(roomId);
		if (!room) {
			if (callback) callback({ error: 'Room not found' });
			return;
		}

		const messages = (room as any).getChatMessages?.(lastSeq) || [];
		logger.debug('sending chat history [roomId:%s, count:%d, lastSeq:%d]', roomId, messages.length, lastSeq);

		if (callback) callback({ messages });
	}

	private trackSocketInRoom(roomId: string, socketId: string): void {
		if (!this.#roomSockets.has(roomId)) {
			this.#roomSockets.set(roomId, new Set());
		}
		this.#roomSockets.get(roomId)!.add(socketId);
	}

	private untrackSocketFromRoom(roomId: string, socketId: string): void {
		const sockets = this.#roomSockets.get(roomId);
		if (sockets) {
			sockets.delete(socketId);
			if (sockets.size === 0) {
				this.#roomSockets.delete(roomId);
			}
		}
	}

	/**
	 * Broadcasts a chat message to all clients in a room.
	 */
	broadcastMessage(roomId: string, message: ChatMessage): void {
		this.#io.to(roomId).emit('chat:message', {
			type: 'message.created',
			timestamp: Date.now(),
			data: message,
		});

		logger.debug('broadcast chat message [roomId:%s, messageId:%s]', roomId, message.id);
	}

	/**
	 * Joins a socket to a room.
	 */
	joinRoom(socketId: string, roomId: string): void {
		const socket = this.#io.sockets.sockets.get(socketId);
		if (socket) {
			socket.join(roomId);
			this.trackSocketInRoom(roomId, socketId);
			logger.debug('socket joined room [socketId:%s, roomId:%s]', socketId, roomId);
		}
	}

	/**
	 * Get room socket count.
	 */
	getRoomSocketCount(roomId: string): number {
		return this.#roomSockets.get(roomId)?.size || 0;
	}
}
