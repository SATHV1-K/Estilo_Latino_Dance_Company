import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { X, MapPin, Phone } from 'lucide-react';
import { authService } from '../services';

interface EditProfileModalProps {
    currentPhone: string;
    onClose: () => void;
    onSuccess: () => void;
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function EditProfileModal({ currentPhone, onClose, onSuccess }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        phone: currentPhone || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.updateProfile({
                phone: formData.phone,
                address: formData.address || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                zipCode: formData.zipCode || undefined,
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card padding="large" className="w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-semibold text-brand-black mb-6">Edit Profile</h2>

                {success ? (
                    <div className="text-center py-8">
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <p className="text-green-600 font-medium">Profile updated successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone size={16} className="inline mr-2" />
                                Phone Number
                            </label>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        {/* Address Section */}
                        <div className="pt-2 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <MapPin size={16} />
                                Address (Optional)
                            </h3>

                            <div className="space-y-3">
                                <Input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('address', e.target.value)}
                                    placeholder="Street Address"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('city', e.target.value)}
                                        placeholder="City"
                                    />
                                    <select
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                                    >
                                        <option value="">State</option>
                                        {US_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    type="text"
                                    value={formData.zipCode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('zipCode', e.target.value)}
                                    placeholder="ZIP Code"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}
