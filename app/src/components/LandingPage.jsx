import React, { useState, useEffect } from 'react';
import { cn } from '../utils';
import '../scss/landing-page.css';
import * as cookiesManager from '../cookiesManager';

const features = [
	'Live HD Video Stream',
	'Verified Educator Session',
	'Interactive Student Grid',
	'Screen Sharing & Chat',
];

const footerChips = [
	{ dot: 'emerald', label: 'Lecture Grid' },
	{ dot: 'gold', label: 'Ultra-Low Latency' },
	{ dot: 'white', label: 'End-to-End Encrypted' },
	{ dot: 'emerald', label: 'Screen Sharing' },
];

export default function LandingPage({ onJoin, initialRoomId }) {
	const [roomId, setRoomId] = useState(initialRoomId || '');
	const [userName, setUserName] = useState('');

	useEffect(() => {
		const savedUser = cookiesManager.getUser() || {};
		if (savedUser.displayName) {
			setUserName(savedUser.displayName);
		} else {
			const legacyName = localStorage.getItem('streamtalk-user');
			if (legacyName) setUserName(legacyName);
		}
	}, []);

	const handleNameChange = (e) => {
		const name = e.target.value;
		setUserName(name);
		localStorage.setItem('streamtalk-user', name);
		try { cookiesManager.setUser({ displayName: name }); } catch (_) {}
	};

	const createAndJoin = () => {
		const newRoomId = Math.random().toString(36).substring(2, 10);
		onJoin(newRoomId, userName || 'Educator');
	};

	const joinRoom = () => {
		if (!roomId.trim()) return;
		onJoin(roomId.trim(), userName || 'Student');
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') joinRoom();
	};

	return (
		<div className="lp-root">
			<div className="lp-animated-bg">
				<div className="lp-blob lp-blob-1" />
				<div className="lp-blob lp-blob-2" />
				<div className="lp-blob lp-blob-3" />
				<div className="lp-grid-overlay" />
			</div>

			<nav className="lp-nav">
				<a className="lp-nav-brand" href="#">
					<img src="/images/logo.png" alt="ICS" className="lp-nav-logo" />
					<span className="lp-nav-name">ICS <span>LIVE</span></span>
				</a>

				<div className="lp-nav-links">
					<a href="#">Platform</a>
					<a href="#">Resources</a>
					<a href="#">Support</a>
				</div>

				<div className="lp-nav-badge">
					<div className="lp-nav-badge-dot" />
					<span>Secure Session</span>
				</div>
			</nav>

			<main className="lp-main">
				<div className="lp-hero">
					<div className="lp-hero-eyebrow">
						Virtual Classroom Platform
					</div>
					<h1 className="lp-hero-title">ICS LIVE</h1>
					<p className="lp-hero-subtitle">
						Advanced virtual classroom for excellence in education — built for educators and students.
					</p>
				</div>

				<div className="lp-identity">
					<label className="lp-identity-label">Your Display Name</label>
					<input
						type="text"
						className="lp-identity-input"
						placeholder="Enter your name to continue..."
						value={userName}
						onChange={handleNameChange}
						autoFocus
					/>
				</div>

				<div className="lp-cards">
					<div className="lp-card lp-card--join">
						<div className="lp-card-header">
							<div className="lp-card-icon">
								<i className="bi bi-box-arrow-in-right" />
							</div>
							<div>
								<h3 className="lp-card-title">Enter Classroom</h3>
							</div>
						</div>

						<p className="lp-card-desc">
							Securely enter a Class ID to join an ongoing lecture session.
						</p>

						<input
							type="text"
							className="lp-card-input"
							placeholder="CLASS-ID-000"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							onKeyDown={handleKeyDown}
						/>

						<div className="lp-card-divider-join" />

						<button
							className={cn(
								'lp-btn lp-btn--join',
								!roomId.trim() && 'opacity-60 cursor-not-allowed'
							)}
							onClick={joinRoom}
							disabled={!roomId.trim()}
						>
							Enter Class
							<span className="lp-btn-arrow">→</span>
						</button>
					</div>

					<div className="lp-card lp-card--create">
						<div className="lp-card-header">
							<div className="lp-card-icon">
								<i className="bi bi-broadcast" />
							</div>
							<div>
								<h3 className="lp-card-title">Live Lecture</h3>
							</div>
						</div>

						<p className="lp-card-desc">
							Start a live session instantly and invite your students.
						</p>

						<div className="lp-features">
							{features.map((f, i) => (
								<div className="lp-feature" key={i}>
									<div className="lp-feature-dot" />
									{f}
								</div>
							))}
						</div>

						<div className="lp-card-divider-create" />

						<button className="lp-btn lp-btn--create" onClick={createAndJoin}>
							Instant Launch
							<span className="lp-btn-arrow">→</span>
						</button>
					</div>
				</div>

				<div className="lp-footer">
					{footerChips.map(({ dot, label }, i) => (
						<div className="lp-chip" key={i}>
							<div className={cn('lp-chip-dot', `lp-chip-dot--${dot}`)} />
							{label}
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
