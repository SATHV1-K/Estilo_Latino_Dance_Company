import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',
    fullScreen = false
}) => {
    return (
        <div className={`loading-spinner ${fullScreen ? 'loading-spinner--fullscreen' : ''}`}>
            <div className="loading-spinner__content">
                <div className="loading-spinner__dancers">
                    <span className="loading-spinner__emoji loading-spinner__emoji--left">💃</span>
                    <span className="loading-spinner__emoji loading-spinner__emoji--right">🕺</span>
                </div>
                <p className="loading-spinner__message">{message}</p>
                <div className="loading-spinner__dots">
                    <span className="loading-spinner__dot"></span>
                    <span className="loading-spinner__dot"></span>
                    <span className="loading-spinner__dot"></span>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
