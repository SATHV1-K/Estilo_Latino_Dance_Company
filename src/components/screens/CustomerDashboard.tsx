import React from 'react';
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Badge, StatusDot } from '../Badge';
import { ProgressBar } from '../ProgressBar';
import { CreditCard, Calendar, Clock, TrendingUp } from 'lucide-react';

interface PunchCard {
  id: string;
  name: string;
  totalClasses: number;
  classesRemaining: number;
  expirationDate: string;
  purchaseDate: string;
  pricePerClass: number;
  isActive: boolean;
}

interface CustomerDashboardProps {
  userName: string;
  activeCard: PunchCard | null;
  onBuyMoreClasses: () => void;
  onViewHistory: () => void;
}

export function CustomerDashboard({
  userName,
  activeCard,
  onBuyMoreClasses,
  onViewHistory
}: CustomerDashboardProps) {
  const calculateDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = activeCard ? calculateDaysUntilExpiration(activeCard.expirationDate) : 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
  const classesUsed = activeCard ? activeCard.totalClasses - activeCard.classesRemaining : 0;

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black px-6 pt-8 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm">Welcome back,</p>
              <h1 className="text-brand-white text-2xl font-bold mt-1">{userName}</h1>
            </div>
            <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
              <span className="text-brand-black text-xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-4">
        <div className="max-w-sm mx-auto space-y-4">
          {/* Active Punch Card */}
          {activeCard ? (
            <Card padding="large" className="border-2 border-brand-yellow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <StatusDot status="active" label="Active Card" className="mb-2" />
                    <CardTitle className="text-2xl">{activeCard.name}</CardTitle>
                  </div>
                  <CreditCard className="text-brand-yellow" size={32} />
                </div>
              </CardHeader>

              <CardContent>
                {/* Classes Remaining - Large Display */}
                <div className="bg-gray-50 rounded-xl p-6 mb-4 text-center">
                  <p className="text-gray-700 text-sm font-medium mb-1">Classes Remaining</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-brand-yellow text-5xl font-bold">
                      {activeCard.classesRemaining}
                    </span>
                    <span className="text-gray-500 text-2xl">/ {activeCard.totalClasses}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <ProgressBar
                    current={classesUsed}
                    total={activeCard.totalClasses}
                    showLabel={false}
                  />
                </div>

                {/* Expiration Info */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-700" size={20} />
                    <div>
                      <p className="text-gray-700 text-xs font-medium">Expires</p>
                      <p className="text-brand-black font-semibold">
                        {new Date(activeCard.expirationDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {isExpiringSoon && (
                    <Badge variant="warning">
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                    </Badge>
                  )}
                </div>

                {/* Warning Banner for Last Class */}
                {activeCard.classesRemaining === 1 && (
                  <div className="mt-4 bg-brand-yellow rounded-lg p-4 flex items-start gap-3">
                    <div className="text-brand-black text-2xl">⚠️</div>
                    <div>
                      <p className="text-brand-black font-semibold text-sm">Last Class!</p>
                      <p className="text-brand-black text-xs mt-1">
                        This is your last class. Consider purchasing more classes soon!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Empty State
            <Card padding="large" className="text-center">
              <div className="py-8">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="text-gray-400" size={40} />
                </div>
                <h3 className="text-brand-black font-semibold text-lg mb-2">
                  No Active Punch Card
                </h3>
                <p className="text-gray-700 text-sm mb-6">
                  Purchase a punch card to start attending classes at Estilo Latino Dance Studio
                </p>
              </div>
            </Card>
          )}

          {/* Quick Stats */}
          {activeCard && (
            <div className="grid grid-cols-2 gap-4">
              <Card padding="medium">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-brand-yellow" size={20} />
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs">Classes Used</p>
                    <p className="text-brand-black text-xl font-bold">{classesUsed}</p>
                  </div>
                </div>
              </Card>

              <Card padding="medium">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                    <Clock className="text-brand-yellow" size={20} />
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs">Price/Class</p>
                    <p className="text-brand-black text-xl font-bold">
                      ${activeCard.pricePerClass.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button size="large" onClick={onBuyMoreClasses}>
              {activeCard ? 'Buy More Classes' : 'Get Started - Buy Classes'}
            </Button>

            <Button variant="ghost" onClick={onViewHistory}>
              View Punch History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
