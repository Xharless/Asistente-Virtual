import React, { useEffect } from 'react';
import './Toast.css';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

function Toast({ message, type = 'success', duration = 3000, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle />;
            case 'error':
                return <FaExclamationCircle />;
            case 'info':
                return <FaInfoCircle />;
            default:
                return <FaCheckCircle />;
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">{getIcon()}</span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
                <FaTimes />
            </button>
        </div>
    );
}

export default Toast;
