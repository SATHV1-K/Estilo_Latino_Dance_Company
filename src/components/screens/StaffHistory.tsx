import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Calendar, Clock, CreditCard, User, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { checkInService } from '../../services';
import type { CheckIn } from '../../services';

export function StaffHistory() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadTodayCheckIns();
  }, []);

  const loadTodayCheckIns = async () => {
    setLoading(true);
    try {
      const todayCheckIns = await checkInService.getTodayCheckIns();
      setCheckIns(todayCheckIns);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading today\'s check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const checkInTime = new Date(timestamp).getTime();
    const diffMs = now - checkInTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatTime(timestamp);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <h1 className="text-brand-white text-xl">Today's Check-Ins</h1>
          <p className="text-gray-400 text-sm mt-1">
            {today}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Summary Card */}
          <Card padding="large" className="bg-gradient-to-br from-brand-yellow to-yellow-600">
            <div className="flex items-center justify-between">
              <div className="text-brand-black">
                <p className="text-sm mb-1 opacity-90">Total Check-Ins Today</p>
                <p className="text-5xl">{checkIns.length}</p>
              </div>
              <Button
                variant="secondary"
                onClick={loadTodayCheckIns}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </Card>

          {/* Last Refresh Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
            <button
              onClick={loadTodayCheckIns}
              className="text-brand-yellow hover:text-yellow-400"
            >
              Refresh
            </button>
          </div>

          {/* Check-In List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading check-ins...</p>
            </div>
          ) : checkIns.length === 0 ? (
            <Card padding="large" className="text-center">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-brand-white mb-2">No Check-Ins Yet</h3>
              <p className="text-gray-400 text-sm">
                Check-ins for today will appear here as customers arrive.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {checkIns.map((checkIn) => (
                <Card
                  key={checkIn.id}
                  padding="medium"
                  className="border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-brand-black" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-brand-black mb-1 truncate">
                        {checkIn.userName}
                      </h4>

                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={14} className="text-brand-yellow flex-shrink-0" />
                        <p className="text-gray-400 text-xs truncate">
                          {checkIn.cardName}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatTime(checkIn.timestamp)}</span>
                        </div>
                        <span>•</span>
                        <span>{getTimeAgo(checkIn.timestamp)}</span>
                      </div>
                    </div>

                    {/* Check mark */}
                    <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-yellow">✓</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {checkIns.length > 0 && (
            <Card padding="medium" className="bg-gray-900 border-gray-700">
              <h4 className="text-brand-yellow text-sm mb-3">Today's Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Total</p>
                  <p className="text-brand-white text-xl">{checkIns.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Last Hour</p>
                  <p className="text-brand-white text-xl">
                    {checkIns.filter(c => {
                      const hourAgo = Date.now() - 3600000;
                      return new Date(c.timestamp).getTime() > hourAgo;
                    }).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Unique</p>
                  <p className="text-brand-white text-xl">
                    {new Set(checkIns.map(c => c.userId)).size}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Info */}
          <Card padding="small" className="bg-gray-900 border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              💡 This list shows check-ins for today only. Auto-refreshes on reload.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
