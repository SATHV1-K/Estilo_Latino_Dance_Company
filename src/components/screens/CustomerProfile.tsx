import React, { useState } from 'react';
import { Card } from '../Card';
import { User, Phone, Mail, Calendar, QrCode, LogOut, Lock } from 'lucide-react';
import { Button } from '../Button';
import { qrService } from '../../services';
import { EditProfileModal } from '../EditProfileModal';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface CustomerProfileProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
    qrCode?: string;
    checkInCode?: string;
  };
  onLogout: () => void;
}

export function CustomerProfile({ user, onLogout }: CustomerProfileProps) {
  const [showQR, setShowQR] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Use the actual QR code from the database (must be set by backend)
  const qrCode = user.qrCode || '';
  const checkInCode = user.checkInCode || '';  // 4-character code for easy check-in
  const qrImageUrl = qrCode ? qrService.generateQRCodeImageUrl(qrCode) : '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <h1 className="text-brand-white text-xl">My Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Profile Header */}
          <Card padding="large" className="text-center">
            <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={48} className="text-brand-black" />
            </div>
            <h2 className="text-brand-black text-2xl font-semibold mb-1">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500 text-sm">Customer</p>
          </Card>

          {/* Contact Information */}
          <Card padding="large">
            <h3 className="text-brand-black mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs mb-1">Email</p>
                  <p className="text-gray-700 text-sm break-all">{user.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs mb-1">Phone</p>
                  <p className="text-gray-700 text-sm">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs mb-1">Member Since</p>
                  <p className="text-gray-700 text-sm">{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* QR Code Card */}
          <Card padding="large">
            <div className="text-center">
              <div className="flex flex-col items-center justify-center gap-2 mb-4">
                <QrCode size={28} className="text-brand-yellow" />
              </div>

              {/* 4-Digit Check-In Code Display */}
              {user.checkInCode && (
                <div className="mb-4">
                  <div className="bg-brand-yellow rounded-xl py-3 px-8 inline-block">
                    <p className="text-brand-black text-3xl font-bold tracking-[0.3em] font-mono">
                      {user.checkInCode}
                    </p>
                  </div>
                  <p className="text-gray-500 text-sm mt-3">
                    Tell staff this code when checking in
                  </p>
                </div>
              )}

              <p className="text-gray-500 text-sm mb-4">
                Or show the QR code below to staff
              </p>

              {showQR ? (
                <div className="space-y-4">
                  {/* QR Code Display - Real scannable image */}
                  <div className="bg-white rounded-lg p-6 inline-block">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code for check-in"
                        width={200}
                        height={200}
                        className="mx-auto"
                      />
                    ) : (
                      <p className="text-gray-500">QR code not available</p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowQR(false)}
                  >
                    Hide QR Code
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode size={20} />
                  Show QR Code
                </Button>
              )}
            </div>
          </Card>

          {/* Account Actions */}
          <Card padding="large">
            <h3 className="text-brand-black font-medium mb-4">Account Settings</h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setShowEditModal(true)}
              >
                <User size={20} />
                Edit Profile
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock size={20} />
                Change Password
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut size={20} />
                Log Out
              </Button>
            </div>
          </Card>

          {/* Studio Information */}
          <Card padding="medium" className="bg-gray-900 border-gray-700">
            <h4 className="text-brand-yellow mb-2 text-sm">Estilo Latino Dance Studio</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Experience the passion of salsa and bachata with our professional instructors.
              Join us for classes that will transform your dance skills and connect you with a vibrant community.
            </p>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          currentPhone={user.phone}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

