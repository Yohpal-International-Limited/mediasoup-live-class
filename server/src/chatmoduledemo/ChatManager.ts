import { Logger } from '../Logger';

const logger = new Logger('ChatManager');

export interface ChatMessage {
	peerId: string;
	displayName: string;
	text: string;
	timestamp: number;
}

export class ChatManager {
	private _messages: ChatMessage[] = [];

	constructor() {
		logger.debug('constructor()');
	}

	public addMessage(message: ChatMessage): void {
		logger.debug('addMessage() [peerId:%s, text:"%s"]', message.peerId, message.text);
		
		this._messages.push(message);
		
		// Limit history to 200 messages for the demo
		if (this._messages.length > 200) {
			this._messages.shift();
		}
	}

	public getHistory(): ChatMessage[] {
		return [ ...this._messages ];
	}

	public clearHistory(): void {
		this._messages = [];
	}
}
