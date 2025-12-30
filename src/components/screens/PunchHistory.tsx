import React, { useState } from 'react';
import { Card, CardContent } from '../Card';
import { Badge } from '../Badge';
import { ArrowLeft, Calendar, Filter } from 'lucide-react';

interface PunchRecord {
  id: string;
  date: string;
  time: string;
  classType: 'salsa' | 'bachata';
  cardUsed: string;
  instructor?: string;
}

interface PunchHistoryProps {
  onBack: () => void;
}

// Mock punch history data
const mockHistory: PunchRecord[] = [
  {
    id: '1',
    date: '2024-11-20',
    time: '7:00 PM',
    classType: 'salsa',
    cardUsed: '15 Classes Card',
    instructor: 'Maria Santos'
  },
  {
    id: '2',
    date: '2024-11-17',
    time: '6:00 PM',
    classType: 'bachata',
    cardUsed: '15 Classes Card',
    instructor: 'Carlos Rivera'
  },
  {
    id: '3',
    date: '2024-11-13',
    time: '7:00 PM',
    classType: 'salsa',
    cardUsed: '15 Classes Card',
    instructor: 'Maria Santos'
  },
  {
    id: '4',
    date: '2024-11-10',
    time: '6:00 PM',
    classType: 'bachata',
    cardUsed: '15 Classes Card',
    instructor: 'Carlos Rivera'
  },
  {
    id: '5',
    date: '2024-11-06',
    time: '7:00 PM',
    classType: 'salsa',
    cardUsed: '15 Classes Card',
    instructor: 'Maria Santos'
  },
  {
    id: '6',
    date: '2024-11-03',
    time: '6:00 PM',
    classType: 'bachata',
    cardUsed: '10 Classes Card',
    instructor: 'Carlos Rivera'
  },
  {
    id: '7',
    date: '2024-10-30',
    time: '7:00 PM',
    classType: 'salsa',
    cardUsed: '10 Classes Card',
    instructor: 'Maria Santos'
  },
  {
    id: '8',
    date: '2024-10-27',
    time: '6:00 PM',
    classType: 'bachata',
    cardUsed: '10 Classes Card',
    instructor: 'Carlos Rivera'
  }
];

export function PunchHistory({ onBack }: PunchHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'salsa' | 'bachata'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredHistory = filter === 'all'
    ? mockHistory
    : mockHistory.filter(record => record.classType === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const groupByMonth = (records: PunchRecord[]) => {
    const groups: { [key: string]: PunchRecord[] } = {};
    records.forEach(record => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(record);
    });
    return groups;
  };

  const groupedHistory = groupByMonth(filteredHistory);

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-brand-yellow hover:text-yellow-400 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-brand-white text-xl font-semibold">Punch History</h1>
            </div>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="text-brand-yellow hover:text-yellow-400 transition-colors relative"
            >
              <Filter size={24} />
              {filter !== 'all' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-yellow rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="bg-brand-black border-b border-gray-700 px-6 py-4">
          <div className="max-w-sm mx-auto">
            <p className="text-gray-400 text-sm mb-3">Filter by class type</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setShowFilterMenu(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-brand-yellow text-brand-black'
                    : 'bg-gray-700 text-brand-white hover:bg-gray-600'
                }`}
              >
                All Classes
              </button>
              <button
                onClick={() => {
                  setFilter('salsa');
                  setShowFilterMenu(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'salsa'
                    ? 'bg-brand-yellow text-brand-black'
                    : 'bg-gray-700 text-brand-white hover:bg-gray-600'
                }`}
              >
                💃 Salsa
              </button>
              <button
                onClick={() => {
                  setFilter('bachata');
                  setShowFilterMenu(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'bachata'
                    ? 'bg-brand-yellow text-brand-black'
                    : 'bg-gray-700 text-brand-white hover:bg-gray-600'
                }`}
              >
                🕺 Bachata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-sm mx-auto">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card padding="medium" className="text-center">
              <p className="text-gray-700 text-xs mb-1">Total</p>
              <p className="text-brand-black text-2xl font-bold">{filteredHistory.length}</p>
            </Card>
            <Card padding="medium" className="text-center">
              <p className="text-gray-700 text-xs mb-1">This Month</p>
              <p className="text-brand-black text-2xl font-bold">
                {filteredHistory.filter(r => {
                  const date = new Date(r.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </Card>
            <Card padding="medium" className="text-center">
              <p className="text-gray-700 text-xs mb-1">This Week</p>
              <p className="text-brand-black text-2xl font-bold">
                {filteredHistory.filter(r => {
                  const date = new Date(r.date);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return date >= weekAgo;
                }).length}
              </p>
            </Card>
          </div>

          {/* History List */}
          {Object.entries(groupedHistory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([monthYear, records]) => (
                <div key={monthYear}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-gray-400" />
                    <h3 className="text-gray-400 text-sm font-medium">{monthYear}</h3>
                  </div>
                  <div className="space-y-2">
                    {records.map((record) => (
                      <Card key={record.id} padding="medium">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                              record.classType === 'salsa' ? 'bg-red-100' : 'bg-purple-100'
                            }`}>
                              {record.classType === 'salsa' ? '💃' : '🕺'}
                            </div>
                            <div>
                              <p className="text-brand-black font-semibold capitalize">
                                {record.classType} Class
                              </p>
                              <p className="text-gray-500 text-sm">
                                {formatDate(record.date)} • {record.time}
                              </p>
                              {record.instructor && (
                                <p className="text-gray-400 text-xs mt-0.5">
                                  with {record.instructor}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="text-xs">
                              {record.cardUsed}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card padding="large" className="text-center">
              <Calendar className="text-gray-400 mx-auto mb-3" size={40} />
              <p className="text-gray-700 font-medium mb-1">No History Found</p>
              <p className="text-gray-500 text-sm">
                {filter !== 'all' 
                  ? `No ${filter} classes in your history`
                  : "You haven't attended any classes yet"
                }
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
