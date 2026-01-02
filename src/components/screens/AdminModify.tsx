import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Search, User, CreditCard, Calendar, Hash, Check, X, Edit } from 'lucide-react';
import { userService, punchCardService, checkInService } from '../../services';
import type { User as UserType } from '../../services';

export function AdminModify() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [remainingClasses, setRemainingClasses] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const results = await checkInService.searchCustomers(searchQuery);

      if (results.users.length > 0) {
        const foundUser = results.users[0];
        const user: UserType = {
          id: foundUser.id,
          firstName: foundUser.name.split(' ')[0],
          lastName: foundUser.name.split(' ').slice(1).join(' ') || '',
          email: foundUser.email,
          phone: foundUser.phone,
          role: 'customer',
          createdAt: '',
          qrCode: foundUser.qrCode,
        };
        setSelectedUser(user);
      } else {
        setMessage({ type: 'error', text: 'Customer not found. Please try another search.' });
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ type: 'error', text: 'Error searching for customer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePass = async () => {
    if (!selectedUser || !remainingClasses || !expirationDate) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    const classes = parseInt(remainingClasses);
    if (isNaN(classes) || classes <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of classes.' });
      return;
    }

    // Validate expiration date is in the future
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expDate <= today) {
      setMessage({ type: 'error', text: 'Expiration date must be in the future.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await punchCardService.adminCreatePass({
        userId: selectedUser.id,
        classes: classes,
        expirationDate: expirationDate,
        amountPaid: 0,  // Cash payment, amount can be logged separately
      });

      setMessage({
        type: 'success',
        text: `✓ Successfully created pass for ${selectedUser.firstName} ${selectedUser.lastName} with ${classes} classes!`
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating pass. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setRemainingClasses('');
    setExpirationDate('');
    setMessage(null);
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get max date (1 year from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <Edit size={24} className="text-brand-yellow" />
            <h1 className="text-brand-white text-xl">Create Pass</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Manually create punch cards for customers
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Info Card */}
          <Card padding="medium" className="bg-brand-yellow/10 border-brand-yellow/30">
            <div className="flex items-start gap-2">
              <Edit size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-brand-yellow text-sm mb-1">Admin Pass Creation</h4>
                <p className="text-gray-300 text-xs">
                  Use this feature for existing customers who need a new card. This is especially useful for customers who purchased cards before the system was implemented.
                </p>
              </div>
            </div>
          </Card>

          {/* Search Customer */}
          <Card padding="large">
            <h3 className="text-brand-black font-medium mb-4">1. Find Customer</h3>
            <div className="space-y-4">
              <Input
                label="Search by Name, Email, or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter customer details..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="secondary"
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
              >
                <Search size={20} />
                {loading ? 'Searching...' : 'Search Customer'}
              </Button>
            </div>
          </Card>

          {/* Message Display */}
          {message && (
            <Card
              padding="medium"
              className={`border-2 ${message.type === 'success'
                ? 'bg-green-900/20 border-green-500'
                : 'bg-red-900/20 border-red-500'
                }`}
            >
              <div className="flex items-center gap-3">
                {message.type === 'success' ? (
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                ) : (
                  <X size={20} className="text-red-500 flex-shrink-0" />
                )}
                <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                  {message.text}
                </p>
              </div>
            </Card>
          )}

          {/* Selected Customer & Pass Creation */}
          {selectedUser && (
            <>
              {/* Customer Info */}
              <Card padding="large" className="border-brand-yellow">
                <h3 className="text-brand-black font-medium mb-4">Selected Customer</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={32} className="text-brand-black" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-brand-black text-lg font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.phone}</p>
                  </div>
                </div>
              </Card>

              {/* Pass Details */}
              <Card padding="large">
                <h3 className="text-brand-black font-medium mb-4">2. Configure Pass</h3>
                <div className="space-y-4">
                  {/* Number of Classes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <Hash size={16} className="text-brand-yellow" />
                      Number of Classes
                    </label>
                    <Input
                      type="number"
                      value={remainingClasses}
                      onChange={(e) => setRemainingClasses(e.target.value)}
                      placeholder="Enter number of classes..."
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the total number of classes for this pass
                    </p>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <Calendar size={16} className="text-brand-yellow" />
                      Expiration Date
                    </label>
                    <Input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      min={minDate}
                      max={maxDateStr}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Card will expire on this date (from purchase, not first use)
                    </p>
                  </div>

                  {/* Preview */}
                  {remainingClasses && expirationDate && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-400 text-xs mb-2">Pass Preview:</p>
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard size={16} className="text-brand-yellow" />
                        <p className="text-brand-white text-sm">
                          Admin Pass ({remainingClasses} classes)
                        </p>
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-gray-400">Expires:</span>
                        <span className="text-gray-300">
                          {(() => {
                            // Parse date string directly to avoid timezone shifting
                            const [year, month, day] = expirationDate.split('-').map(Number);
                            const dateForDisplay = new Date(year, month - 1, day);
                            return dateForDisplay.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Create Button */}
              <Button
                variant="primary"
                onClick={handleCreatePass}
                disabled={loading || !remainingClasses || !expirationDate}
                className="text-lg h-14"
              >
                <CreditCard size={20} />
                {loading ? 'Creating Pass...' : 'Create Pass'}
              </Button>

              {/* Cancel */}
              <Button
                variant="secondary"
                onClick={resetForm}
              >
                Cancel & Search Another
              </Button>
            </>
          )}

          {/* Guidelines */}
          <Card padding="medium" className="bg-gray-900 border-gray-700">
            <h4 className="text-brand-yellow text-sm mb-3">Guidelines</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">•</span>
                <span>Use this for existing customers who already paid but need cards in the system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">•</span>
                <span>The expiration date starts from when you create the pass, not first check-in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">•</span>
                <span>Customer will be able to use their QR code to check in once pass is created</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">•</span>
                <span>All pass creations are logged in the system for audit purposes</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
