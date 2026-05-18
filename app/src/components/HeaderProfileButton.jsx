import React from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import * as cookiesManager from '../cookiesManager';

export default function HeaderProfileButton({
	displayName,
	isHost,
	deviceName,
	onChangeDisplayName,
	onLeave,
}) {
	const [isOpen, setIsOpen] = React.useState(false);
	const menuRef = React.useRef(null);
	const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

	React.useEffect(() => {
		function handlePointerDown(event) {
			if (menuRef.current && !menuRef.current.contains(event.target))
				setIsOpen(false);
		}

		function handleEscape(event) {
			if (event.key === 'Escape') setIsOpen(false);
		}

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleEscape);
		};
	}, []);

	const handleEditDisplayName = async () => {
		setIsOpen(false);

		const { isConfirmed, value } = await Swal.fire({
			title: 'Edit Display Name',
			input: 'text',
			inputValue: displayName || '',
			inputAttributes: {
				autocapitalize: 'off',
				autocorrect: 'off',
				maxlength: '20',
			},
			inputValidator: name => {
				const trimmedName = name.trim();

				if (!trimmedName) return 'Display name is required.';
				if (trimmedName.length > 20)
					return 'Display name must be 20 characters or fewer.';

				return undefined;
			},
			showCancelButton: true,
			confirmButtonText: 'Save',
			background: '#050505',
			color: '#F5F5F5',
			confirmButtonColor: '#C5A059',
		});

		if (!isConfirmed) return;

		const trimmedName = value.trim();

		if (trimmedName === displayName) return;

		cookiesManager.setUser({ displayName: trimmedName });
		onChangeDisplayName(trimmedName);
	};

	const handleLeave = async () => {
		setIsOpen(false);

		const result = await Swal.fire({
			title: 'End Session?',
			text: 'Are you sure you want to leave the class?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Exit Now',
			background: '#050505',
			color: '#F5F5F5',
			confirmButtonColor: '#D32F2F',
		});

		if (result.isConfirmed) onLeave();
	};

	return (
		<div
			className={`header-profile-menu${isOpen ? ' open' : ''}`}
			ref={menuRef}
		>
			<button
				type="button"
				className="user-profile"
				onClick={() => setIsOpen(open => !open)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
			>
				<div className="avatar-small">{initial}</div>
				<div className="user-copy">
					<span className="display-name">{displayName}</span>
					<span className="profile-role">
						{isHost ? 'Host' : deviceName || 'Participant'}
					</span>
				</div>
				<i className="fa-solid fa-chevron-down profile-chevron" />
			</button>

			{isOpen && (
				<div className="profile-dropdown" role="menu">
					<div className="profile-card">
						<div className="profile-avatar">{initial}</div>
						<div className="profile-meta">
							<span className="profile-name">{displayName}</span>
							<span className="profile-subtitle">
								{isHost ? 'Session Host' : deviceName || 'Participant'}
							</span>
						</div>
					</div>

					<button
						type="button"
						className="profile-action"
						onClick={handleEditDisplayName}
						role="menuitem"
					>
						<i className="fa-solid fa-pen" />
						<span>Edit display name</span>
					</button>

					<button
						type="button"
						className="profile-action danger"
						onClick={handleLeave}
						role="menuitem"
					>
						<i className="fa-solid fa-right-from-bracket" />
						<span>Leave session</span>
					</button>
				</div>
			)}
		</div>
	);
}

HeaderProfileButton.propTypes = {
	displayName: PropTypes.string,
	isHost: PropTypes.bool,
	deviceName: PropTypes.string,
	onChangeDisplayName: PropTypes.func.isRequired,
	onLeave: PropTypes.func.isRequired,
};
