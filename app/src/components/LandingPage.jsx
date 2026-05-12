import React, { useState, useEffect } from 'react';
import * as cookiesManager from '../cookiesManager';

export default function LandingPage({ onJoin }) {
	const [roomId, setRoomId] = useState('');
	const [userName, setUserName] = useState('');
	const [connectionStatus, setConnectionStatus] = useState('online');

	useEffect(() => {
		const savedUser = cookiesManager.getUser() || {};
		if (savedUser.displayName) {
			setUserName(savedUser.displayName);
		} else {
			// Check localStorage legacy key from original app if exists
			const legacyName = localStorage.getItem('streamtalk-user');
			if (legacyName) setUserName(legacyName);
		}
	}, []);

	const handleNameChange = (e) => {
		const name = e.target.value;
		setUserName(name);
		localStorage.setItem('streamtalk-user', name);
		cookiesManager.setUser({ displayName: name });
	};

	const createAndJoin = () => {
		const generatedRoomId = Math.random().toString(36).substring(2, 10);
		const finalName = userName || 'Educator';
		onJoin(generatedRoomId, finalName);
	};

	const joinRoom = () => {
		if (!roomId) return;
		const finalName = userName || 'Student';
		onJoin(roomId, finalName);
	};

	return (
		<div className="landing-page-container">
			{/* Animated Background */}
			<div className="animated-bg">
				<div className="blob w-96 h-96 bg-emerald-900 top-0 -left-4 animate-blob"></div>
				<div className="blob w-96 h-96 bg-yellow-900 top-0 -right-4 animate-blob animation-delay-2000"></div>
				<div className="blob w-96 h-96 bg-teal-900 -bottom-8 left-20 animate-blob animation-delay-4000"></div>
			</div>

			{/* Navbar */}
			<nav className="relative z-20 w-full px-6 py-6 flex items-center justify-between backdrop-blur-md bg-ics-navy/20">
				<div className="flex items-center gap-3">
					{/* Logo Placeholder - in a real app this would be an <img> */}
					<div className="w-10 h-10 bg-ics-gold rounded-lg flex items-center justify-center font-bold text-ics-black">
						ICS
					</div>
					<span className="text-xl font-heading font-bold text-white">
						ICS <span className="text-ics-gold">LIVE</span>
					</span>
				</div>

				<div className="hidden md:flex items-center gap-8 text-white/70 font-medium">
					<a href="#" className="hover:text-ics-gold transition-colors">Platform</a>
					<a href="#" className="hover:text-ics-gold transition-colors">Resources</a>
					<a href="#" className="hover:text-ics-gold transition-colors">Support</a>
				</div>

				<div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
					<div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`}></div>
					<span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/80">Secure Session</span>
				</div>
			</nav>

			{/* Hero & Action Section */}
			<main className="landing-content">
				<div className="hero-section">
					<h1 className="select-none">ICS LIVE</h1>
					<p>Advanced Virtual Classroom for Excellence in Education</p>
				</div>

				<div className="w-full max-w-lg mb-12 relative z-20">
					<div className="input-group">
						<label className="text-emerald-400/60 text-sm font-bold uppercase tracking-widest mb-2 block mx-2">Your Identity</label>
						<input
							type="text"
							placeholder="Enter your name"
							value={userName}
							onChange={handleNameChange}
							className="glass-dark"
						/>
					</div>
				</div>

				<div className="action-cards">
					{/* Join Room Card */}
					<div className="action-card join">
						<div className="space-y-2">
							<h3>Enter Classroom</h3>
							<p>Securely enter a Class ID to join an ongoing lecture</p>
						</div>
						
						<div className="input-group">
							<input
								type="text"
								placeholder="CLASS-ID-000"
								value={roomId}
								onChange={(e) => setRoomId(e.target.value)}
								className="bg-black/60"
							/>
						</div>

						<button 
							onClick={joinRoom}
							className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
						>
							Enter Class
						</button>
					</div>

					{/* Create Room Card */}
					<div className="action-card create">
						<div className="space-y-2">
							<h3>Live Lecture</h3>
							<p>Start a live session and invite your students</p>
						</div>

						<div className="space-y-4 py-4 text-white/80 font-medium">
							<div className="flex items-center gap-3">
								<i className="bi bi-broadcast text-ics-gold"></i>
								<span>Live HD Stream</span>
							</div>
							<div className="flex items-center gap-3">
								<i className="bi bi-shield-check text-ics-gold"></i>
								<span>Verified Educator</span>
							</div>
							<div className="flex items-center gap-3">
								<i className="bi bi-people text-ics-gold"></i>
								<span>Interactive Grid</span>
							</div>
						</div>

						<button 
							onClick={createAndJoin}
							className="bg-ics-gold hover:bg-[#FFD15C] text-ics-black shadow-lg shadow-yellow-900/40"
						>
							Instant Launch
						</button>
					</div>
				</div>

				{/* Features Footer */}
				<div className="mt-20 flex flex-wrap justify-center gap-8 text-white/40 text-sm font-bold uppercase tracking-widest">
					<div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
						<div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
						<span>Lecture Grid</span>
					</div>
					<div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
						<div className="w-2 h-2 bg-ics-gold rounded-full"></div>
						<span>Golden Tier</span>
					</div>
					<div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
						<div className="w-2 h-2 bg-white rounded-full"></div>
						<span>Ultra Low Latency</span>
					</div>
				</div>
			</main>
		</div>
	);
}
