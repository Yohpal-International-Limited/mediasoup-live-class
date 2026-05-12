import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import * as appPropTypes from './appPropTypes';
import * as stateActions from '../redux/stateActions';
import { Appear } from './transitions';

const TOAST_ICONS = {
	info: 'bi-info-circle',
	error: 'bi-exclamation-triangle-fill',
};

const Notifications = ({ notifications, onClick }) => {
	return (
		<div data-component="Notifications">
			{notifications.map(notification => {
				return (
					<Appear key={notification.id} duration={250}>
						<div
							className={classnames('toast border-0', notification.type)}
							role="alert"
							style={{
								background: notification.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(6,41,31,0.95)',
								color: '#fff',
								backdropFilter: 'blur(12px)',
								borderRadius: '10px',
								boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
							}}
							onClick={() => onClick(notification.id)}
						>
							<div className="toast-body d-flex align-items-start gap-2 p-3">
								<i className={classnames('bi fs-5', TOAST_ICONS[notification.type] || 'bi-info-circle')}
									style={{ color: notification.type === 'error' ? '#fff' : '#34d399' }} />
								<div className="flex-grow-1">
									{notification.title && (
										<div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{notification.title}</div>
									)}
									<div style={{ fontSize: 12, opacity: 0.85 }}>{notification.text}</div>
								</div>
								<button className="btn-close btn-close-white btn-sm" style={{ fontSize: 10, opacity: 0.6 }} />
							</div>
						</div>
					</Appear>
				);
			})}
		</div>
	);
};

Notifications.propTypes = {
	notifications: PropTypes.arrayOf(appPropTypes.Notification).isRequired,
	onClick: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
	const { notifications } = state;

	return { notifications };
};

const mapDispatchToProps = dispatch => {
	return {
		onClick: notificationId => {
			dispatch(stateActions.removeNotification(notificationId));
		},
	};
};

const NotificationsContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Notifications);

export default NotificationsContainer;
