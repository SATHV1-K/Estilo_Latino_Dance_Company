import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { QRScanner } from '../QRScanner';
import { Search, QrCode, User, CreditCard, Check, X, Camera, Cake } from 'lucide-react';
import { checkInService, userService, punchCardService } from '../../services';
import type { User as UserType, PunchCard } from '../../services';

type SearchMode = 'search' | 'qr';

export function StaffPunchInterface() {
  const [searchMode, setSearchMode] = useState<SearchMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userCard, setUserCard] = useState<PunchCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [customerStatus, setCustomerStatus] = useState<{
    isBirthdayToday: boolean;
    hasCheckedInToday: boolean;
  }>({ isBirthdayToday: false, hasCheckedInToday: false });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const results = await checkInService.searchCustomers(searchQuery);

      // Find first matching user or family member
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
        // Load user's active card and status
        const [card, status] = await Promise.all([
          punchCardService.getActiveCard(user.id),
          checkInService.getCustomerStatus(user.id, undefined),
        ]);
        setUserCard(card);
        setCustomerStatus(status);
      } else if (results.familyMembers.length > 0) {
        const foundMember = results.familyMembers[0];
        // For family members, we still show them as a user in the UI
        const user: UserType = {
          id: foundMember.id,
          firstName: foundMember.name.split(' ')[0],
          lastName: foundMember.name.split(' ').slice(1).join(' ') || '',
          email: foundMember.parentEmail,
          phone: '',
          role: 'customer',
          createdAt: '',
          qrCode: foundMember.qrCode,
        };
        setSelectedUser(user);
        // Load family member's cards and status
        const [card, status] = await Promise.all([
          punchCardService.getActiveCard(undefined, foundMember.id),
          checkInService.getCustomerStatus(undefined, foundMember.id),
        ]);
        setUserCard(card);
        setCustomerStatus(status);
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

  const handleQRScan = async () => {
    if (!qrInput.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await checkInService.findByQrCode(qrInput);

      if (result) {
        const user: UserType = {
          id: result.id,
          firstName: result.name.split(' ')[0],
          lastName: result.name.split(' ').slice(1).join(' ') || '',
          email: '',
          phone: '',
          role: 'customer',
          createdAt: '',
          qrCode: qrInput,
        };
        setSelectedUser(user);
        // Load card based on type
        if (result.type === 'user') {
          const card = await punchCardService.getActiveCard(result.id);
          setUserCard(card);
        } else {
          const card = await punchCardService.getActiveCard(undefined, result.id);
          setUserCard(card);
        }
      } else {
        setMessage({ type: 'error', text: 'Invalid QR code. Please try again.' });
      }
    } catch (error) {
      console.error('QR scan error:', error);
      setMessage({ type: 'error', text: 'Error scanning QR code.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePunchCard = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const checkInResult = await checkInService.checkIn({
        userId: selectedUser.id,
      });

      setMessage({
        type: 'success',
        text: `✓ Successfully checked in ${checkInResult.userName}! Classes remaining: ${checkInResult.classesRemaining}`
      });

      // Update card to show new remaining classes
      if (userCard && checkInResult.classesRemaining !== undefined) {
        const updatedCard = { ...userCard, classesRemaining: checkInResult.classesRemaining };
        setUserCard(updatedCard);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Check-in error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error checking in customer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBirthdayCheckIn = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const checkInResult = await checkInService.checkIn({
        userId: selectedUser.id,
        isBirthdayCheckIn: true,
      });

      setMessage({
        type: 'success',
        text: `🎂 Happy Birthday! Checked in ${checkInResult.userName} - FREE class!`
      });

      // Reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      console.error('Birthday check-in error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error checking in customer.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setQrInput('');
    setSelectedUser(null);
    setUserCard(null);
    setMessage(null);
    setCustomerStatus({ isBirthdayToday: false, hasCheckedInToday: false });
  };

  const handleCameraScan = async (qrCode: string) => {
    setShowScanner(false);
    setQrInput(qrCode);

    // Use the same search logic as handleSearch for consistency
    // The search API supports QR codes, check-in codes, names, emails, and phone numbers
    setLoading(true);
    setMessage(null);

    try {
      const results = await checkInService.searchCustomers(qrCode);

      // Find first matching user or family member
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
        // Load user's active card and status
        const [card, status] = await Promise.all([
          punchCardService.getActiveCard(user.id),
          checkInService.getCustomerStatus(user.id, undefined),
        ]);
        setUserCard(card);
        setCustomerStatus(status);
        setMessage({ type: 'success', text: `Found: ${foundUser.name}` });
      } else if (results.familyMembers.length > 0) {
        const foundMember = results.familyMembers[0];
        // For family members, we still show them as a user in the UI
        const user: UserType = {
          id: foundMember.id,
          firstName: foundMember.name.split(' ')[0],
          lastName: foundMember.name.split(' ').slice(1).join(' ') || '',
          email: foundMember.parentEmail,
          phone: '',
          role: 'customer',
          createdAt: '',
          qrCode: foundMember.qrCode,
        };
        setSelectedUser(user);
        // Load family member's cards and status
        const [card, status] = await Promise.all([
          punchCardService.getActiveCard(undefined, foundMember.id),
          checkInService.getCustomerStatus(undefined, foundMember.id),
        ]);
        setUserCard(card);
        setCustomerStatus(status);
        setMessage({ type: 'success', text: `Found: ${foundMember.name}` });
      } else {
        setMessage({ type: 'error', text: 'QR code not found. Please try again.' });
      }
    } catch (error) {
      console.error('Camera QR scan error:', error);
      setMessage({ type: 'error', text: 'Error scanning QR code.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-brand-black pb-24">
        {/* Header */}
        <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-sm mx-auto">
            <h1 className="text-brand-white text-xl">Punch Cards</h1>
            <p className="text-gray-400 text-sm mt-1">
              Check in customers for classes
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="max-w-sm mx-auto space-y-6">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={searchMode === 'search' ? 'primary' : 'secondary'}
                onClick={() => {
                  setSearchMode('search');
                  resetForm();
                }}
              >
                <Search size={20} />
                Search
              </Button>
              <Button
                variant={searchMode === 'qr' ? 'primary' : 'secondary'}
                onClick={() => {
                  setSearchMode('qr');
                  resetForm();
                }}
              >
                <QrCode size={20} />
                Scan QR
              </Button>
            </div>

            {/* Search Mode */}
            {searchMode === 'search' && (
              <Card padding="large">
                <h3 className="text-brand-black mb-4">Search Customer</h3>
                <div className="space-y-4">
                  <Input
                    label="Name, Email, or Phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter customer details..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                  >
                    <Search size={20} />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </Card>
            )}

            {/* QR Mode */}
            {searchMode === 'qr' && (
              <Card padding="large">
                <h3 className="text-brand-black mb-4">Scan QR Code</h3>
                <div className="space-y-4">
                  {/* Camera Scan Button - Primary Action */}
                  <Button
                    variant="primary"
                    onClick={() => setShowScanner(true)}
                    className="w-full h-14 text-lg"
                  >
                    <Camera size={24} />
                    Open Camera to Scan
                  </Button>

                  {/* Manual Entry Fallback */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-gray-800 px-2 text-gray-500">or enter manually</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <Input
                      label="QR Code (Manual Entry)"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="Enter QR code..."
                      onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleQRScan}
                      disabled={loading || !qrInput.trim()}
                      className="mt-3 w-full"
                    >
                      <QrCode size={20} />
                      {loading ? 'Processing...' : 'Verify Code'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

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

            {/* Customer Info & Punch */}
            {selectedUser && (
              <Card padding="large" className="border-brand-yellow">
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                    <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={32} className="text-brand-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-brand-black text-lg">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                      <p className="text-gray-400 text-sm">{selectedUser.phone}</p>
                    </div>
                  </div>

                  {/* Check-in Options */}
                  {customerStatus.isBirthdayToday ? (
                    /* Birthday Today - Show ONLY Birthday Check-in */
                    <div className="text-center py-4">
                      <div className="bg-pink-500/20 border border-pink-500/50 rounded-lg p-6 mb-4">
                        <Cake size={48} className="text-pink-400 mx-auto mb-4" />
                        <h4 className="text-brand-black text-lg mb-2">🎂 Happy Birthday!</h4>
                        <p className="text-gray-700 text-sm mb-4">
                          Today is {selectedUser.firstName}'s birthday! They get a FREE class!
                        </p>
                        <Button
                          variant="primary"
                          onClick={handleBirthdayCheckIn}
                          disabled={loading}
                          className="w-full bg-pink-500 hover:bg-pink-600 text-white h-14 text-lg"
                        >
                          <Cake size={24} />
                          Birthday Check-in (Free Class)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Not Birthday - Show Regular Check-in */
                    <>
                      {/* Card Info */}
                      {userCard ? (
                        <>
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard size={20} className="text-brand-yellow" />
                              <h4 className="text-brand-white">Active Card</h4>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                              <p className="text-brand-white mb-2">{userCard.name}</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">
                                  {userCard.totalClasses === 0 ? 'Status' : 'Remaining'}
                                </span>
                                <span className="text-brand-yellow">
                                  {userCard.totalClasses === 0
                                    ? '1 Month • Class Pass'
                                    : `${userCard.classesRemaining} of ${userCard.totalClasses} classes`}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Expires</span>
                                <span className="text-gray-300">{userCard.expirationDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Punch Button - Subscription cards (totalClasses=0) have unlimited check-ins */}
                          {(() => {
                            const isSubscription = userCard.totalClasses === 0;
                            const canCheckIn = isSubscription
                              ? !userCard.isExpired  // Subscriptions: just check not expired
                              : !userCard.isExpired && userCard.classesRemaining > 0; // Punch cards: need remaining classes

                            return (
                              <>
                                <Button
                                  variant="primary"
                                  onClick={handlePunchCard}
                                  disabled={loading || !canCheckIn}
                                  className="text-lg h-14"
                                >
                                  {userCard.isExpired
                                    ? 'Card Expired'
                                    : !canCheckIn
                                      ? 'No Classes Remaining'
                                      : isSubscription
                                        ? 'Check In - Unlimited'
                                        : 'Punch Card - Check In'}
                                </Button>

                                {!canCheckIn && (
                                  <p className="text-red-400 text-sm text-center">
                                    Customer needs to purchase a new card
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <CreditCard size={48} className="text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400 text-sm">No active punch card found</p>
                          <p className="text-gray-500 text-xs mt-2">
                            Customer needs to purchase a card
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Reset Button */}
                  <Button
                    variant="secondary"
                    onClick={resetForm}
                  >
                    Search Another Customer
                  </Button>
                </div>
              </Card>
            )}

            {/* Quick Tips */}
            <Card padding="medium" className="bg-gray-900 border-gray-700">
              <h4 className="text-brand-yellow text-sm mb-2">Quick Tips</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Search by customer name, email, or phone number</li>
                <li>• Or ask customers to show their QR code from their profile</li>
                <li>• Cards expire from purchase date, not first check-in</li>
                <li>• Customers can buy new cards through the app</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {
        showScanner && (
          <QRScanner
            onScanSuccess={handleCameraScan}
            onClose={() => setShowScanner(false)}
          />
        )
      }
    </>
  );
}
