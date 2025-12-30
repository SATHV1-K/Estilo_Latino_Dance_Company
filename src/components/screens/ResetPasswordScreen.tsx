import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';
import { authService } from '../../services/authService';

interface ResetPasswordScreenProps {
    token: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ResetPasswordScreen({ token, onSuccess, onCancel }: ResetPasswordScreenProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await authService.resetPassword(token, password);
            setStatus('success');
            setMessage('Your password has been reset successfully!');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to reset password. The link may have expired.');
        }
    };

    return (
        <div className="min-h-screen bg-brand-black flex flex-col items-center px-6 py-12">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img
                        src="/logo.jpeg"
                        alt="Estilo Latino Dance Studio"
                        className="w-64 h-auto"
                    />
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-brand-yellow text-2xl font-bold mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Enter your new password below
                    </p>
                </div>

                {status === 'success' ? (
                    <Card padding="large">
                        <div className="text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <h2 className="text-brand-black text-xl font-bold mb-2">Password Reset!</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <Button onClick={onSuccess} size="large" className="w-full">
                                Go to Login
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Card padding="medium">
                            <Input
                                type="password"
                                placeholder="New password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Card>

                        <Card padding="medium">
                            <Input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Card>

                        {status === 'error' && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{message}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            size="large"
                            className="mt-6"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                        </Button>

                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full text-gray-400 text-sm hover:text-brand-yellow mt-4"
                        >
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
