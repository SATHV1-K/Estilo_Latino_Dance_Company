import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';
import { authService } from '../../services/authService';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'customer' | 'staff') => void;
  onSignUpClick: () => void;
}

export function LoginScreen({ onLogin, onSignUpClick }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'staff'>('customer');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, role);
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
    setResetEmail(email); // Pre-fill with login email if entered
    setResetStatus('idle');
    setResetMessage('');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      setResetStatus('error');
      setResetMessage('Please enter your email address');
      return;
    }

    setResetStatus('loading');

    try {
      await authService.forgotPassword(resetEmail.trim());
      setResetStatus('success');
      setResetMessage('If an account exists with that email, a password reset link has been sent. Please check your inbox.');
    } catch (err: any) {
      setResetStatus('error');
      setResetMessage(err.message || 'Failed to send reset email. Please try again.');
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetStatus('idle');
    setResetMessage('');
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

        {/* Tagline */}
        <div className="text-center mb-8">
          <p className="text-brand-yellow text-lg font-medium">
            Estilo Latino Payments
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Buy and track your classes
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector */}
          <Card padding="small" className="mb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${role === 'customer'
                  ? 'bg-brand-yellow text-brand-black'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${role === 'staff'
                  ? 'bg-brand-yellow text-brand-black'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Staff
              </button>
            </div>
          </Card>

          <Card padding="medium">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Card>

          <Card padding="medium">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Card>

          <Button type="submit" size="large" className="mt-6">
            Login
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSignUpClick}
              className="text-brand-yellow font-medium hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <button
            onClick={handleForgotPasswordClick}
            className="text-brand-yellow text-sm hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-brand-black mb-2">Reset Password</h2>
            <p className="text-gray-600 text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {resetStatus === 'success' ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-700 text-sm">✅ {resetMessage}</p>
                </div>
                <button
                  onClick={closeForgotPassword}
                  className="w-full py-3 bg-brand-yellow text-brand-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-gray-900 bg-white placeholder-gray-400"
                  required
                />

                {resetStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">{resetMessage}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-3 bg-brand-yellow text-brand-black font-medium rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                  >
                    {resetStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
