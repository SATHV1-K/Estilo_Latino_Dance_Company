import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Calendar, Clock, CreditCard, User as UserIcon } from 'lucide-react';
import { checkInService } from '../../services';
import type { CheckIn } from '../../services';

interface CustomerHistoryProps {
  userId: string;
}

export function CustomerHistory({ userId }: CustomerHistoryProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckInHistory();
  }, [userId]);

  const loadCheckInHistory = async () => {
    setLoading(true);
    try {
      const result = await checkInService.getUserCheckInHistory(userId);
      // The API returns { checkIns, total, totalPages } - we need the checkIns array
      setCheckIns(result.checkIns || []);
    } catch (error) {
      console.error('Error loading check-in history:', error);
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupByDate = (checkIns: CheckIn[]) => {
    const grouped: { [key: string]: CheckIn[] } = {};

    checkIns.forEach(checkIn => {
      const date = formatDate(checkIn.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(checkIn);
    });

    return grouped;
  };

  const groupedCheckIns = groupByDate(checkIns);

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <h1 className="text-brand-white text-xl">Check-In History</h1>
          <p className="text-gray-400 text-sm mt-1">
            Your class attendance record
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto">
          {/* Summary Card */}
          <Card padding="large" className="mb-6 bg-gradient-to-br from-brand-yellow to-yellow-600">
            <div className="text-center text-brand-black">
              <p className="text-sm mb-2 opacity-90">Total Classes Attended</p>
              <p className="text-5xl mb-1">{checkIns.length}</p>
              <p className="text-xs opacity-75">Keep dancing! 💃🕺</p>
            </div>
          </Card>

          {/* Check-In List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading history...</p>
            </div>
          ) : checkIns.length === 0 ? (
            <Card padding="large" className="text-center">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-brand-black mb-2">No Check-Ins Yet</h3>
              <p className="text-gray-400 text-sm">
                Your class attendance history will appear here once you start checking in.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCheckIns).map(([date, dateCheckIns]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-brand-yellow" />
                    <h3 className="text-brand-white text-sm font-medium">{date}</h3>
                    <div className="flex-1 h-px bg-gray-700"></div>
                  </div>

                  <div className="space-y-3">
                    {dateCheckIns.map((checkIn) => (
                      <Card
                        key={checkIn.id}
                        padding="medium"
                        className="border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard size={16} className="text-brand-yellow" />
                              <h4 className="text-brand-black text-sm font-medium">
                                {checkIn.cardName}
                              </h4>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formatTime(checkIn.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <UserIcon size={12} />
                                <span>By {checkIn.punchedBy}</span>
                              </div>
                            </div>
                          </div>

                          <div className="w-12 h-12 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-yellow text-lg">✓</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Card */}
          {checkIns.length > 0 && (
            <Card padding="medium" className="mt-6 bg-gray-900 border-gray-700">
              <h4 className="text-brand-yellow text-sm mb-3">Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-xs mb-1">This Month</p>
                  <p className="text-gray-300 text-2xl font-semibold">
                    {checkIns.filter(c => {
                      const date = new Date(c.timestamp);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() &&
                        date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">All Time</p>
                  <p className="text-gray-300 text-2xl font-semibold">{checkIns.length}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
