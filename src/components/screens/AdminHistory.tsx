import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Calendar, Clock, CreditCard, User, ChevronLeft, ChevronRight, Filter, X, Search } from 'lucide-react';
import { checkInService } from '../../services';
import type { CheckIn } from '../../services';

export function AdminHistory() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadCheckIns();
  }, [currentPage, dateFilter, searchQuery]);

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const result = await checkInService.getCheckInHistory(currentPage, itemsPerPage);

      setCheckIns(result.checkIns);
      setTotalPages(result.totalPages);
      setTotalCheckIns(result.total);
    } catch (error) {
      console.error('Error loading check-ins:', error);
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || dateFilter !== 'all';

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <h1 className="text-brand-white text-xl">All Activity</h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete check-in history with filters
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Stats Card */}
          <Card padding="large" className="bg-gradient-to-br from-brand-yellow to-yellow-600">
            <div className="grid grid-cols-2 gap-4 text-brand-black">
              <div>
                <p className="text-sm mb-1 opacity-90">Total Check-Ins</p>
                <p className="text-4xl">{totalCheckIns}</p>
              </div>
              <div>
                <p className="text-sm mb-1 opacity-90">Current Page</p>
                <p className="text-4xl">{currentPage}/{totalPages}</p>
              </div>
            </div>
          </Card>

          {/* Filters */}
          <Card padding="medium">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-brand-black font-medium flex items-center gap-2">
                <Filter size={16} className="text-brand-yellow" />
                Filters
              </h3>
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs h-8"
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-3 border-t border-gray-700">
                {/* Search */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Search Customer</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name, email, phone..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Time Period</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['all', 'today', 'week', 'month'].map((filter) => (
                      <Button
                        key={filter}
                        variant={dateFilter === filter ? 'primary' : 'secondary'}
                        onClick={() => {
                          setDateFilter(filter);
                          setCurrentPage(1);
                        }}
                        className="text-xs h-9"
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X size={16} />
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Check-Ins List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading activity...</p>
            </div>
          ) : checkIns.length === 0 ? (
            <Card padding="large" className="text-center">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-brand-black mb-2">No Activity Found</h3>
              <p className="text-gray-400 text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Check-in activity will appear here.'}
              </p>
            </Card>
          ) : (
            <>
              {/* Check-In Cards */}
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
                        <h4 className="text-brand-black font-medium mb-1">
                          {checkIn.userName}
                        </h4>

                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard size={14} className="text-brand-yellow flex-shrink-0" />
                          <p className="text-gray-400 text-xs truncate">
                            {checkIn.cardName}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(checkIn.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatTime(checkIn.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>By {checkIn.punchedBy}</span>
                          </div>
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

              {/* Pagination */}
              <Card padding="medium">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCheckIns)} of {totalCheckIns}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 p-0"
                    >
                      <ChevronLeft size={20} />
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'primary' : 'secondary'}
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10 h-10 p-0 text-sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 p-0"
                    >
                      <ChevronRight size={20} />
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Export Note */}
          <Card padding="small" className="bg-gray-900 border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              💡 Export and advanced filtering features coming soon
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
