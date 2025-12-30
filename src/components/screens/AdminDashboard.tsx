import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Badge } from '../Badge';
import { DollarSign, CreditCard, Users, TrendingUp, Activity, Shield, UserPlus, UserMinus, BarChart, AlertCircle, Cake, Gift, Heart } from 'lucide-react';
import { Input } from '../Input';
import { analyticsService, punchCardService, userService, paymentService } from '../../services';
import type { AnalyticsData, PunchCard, User } from '../../services';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [expiredCards, setExpiredCards] = useState<PunchCard[]>([]);
  const [showExpiredCards, setShowExpiredCards] = useState(false);
  const [showManageCustomers, setShowManageCustomers] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    totalRevenue: 0,
    newCustomers: 0,
    totalCheckIns: 0,
    activeCards: 0
  });
  const [showAllCards, setShowAllCards] = useState(false);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [allCardsPage, setAllCardsPage] = useState(1);
  const [allCardsTotalPages, setAllCardsTotalPages] = useState(1);
  const [cardStatusFilter, setCardStatusFilter] = useState<string>('');
  const [todaysBirthdays, setTodaysBirthdays] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    totalCardsSold: 0,
  });
  const [tipStats, setTipStats] = useState({
    totalTips: 0,
    thisMonthTips: 0,
    tipCount: 0,
    thisMonthTipCount: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load data in parallel with error handling for each
      const [analyticsResult, expiredResult, statsResult, customersResult, birthdaysResult, revenueResult, tipResult] = await Promise.allSettled([
        analyticsService.getMonthlyAnalytics(6),
        punchCardService.getAllExpiredCards(),
        analyticsService.getCurrentMonthStats(),
        userService.getAllCustomers(),
        punchCardService.getTodaysBirthdays(),
        punchCardService.getRevenueStats(),
        paymentService.getTipStats(),
      ]);

      if (analyticsResult.status === 'fulfilled') setAnalyticsData(analyticsResult.value);
      if (expiredResult.status === 'fulfilled') setExpiredCards(expiredResult.value);
      if (statsResult.status === 'fulfilled') setCurrentMonthStats(statsResult.value);
      if (customersResult.status === 'fulfilled') setCustomers(customersResult.value.users);
      if (birthdaysResult.status === 'fulfilled') setTodaysBirthdays(birthdaysResult.value);
      if (revenueResult.status === 'fulfilled') setRevenueStats(revenueResult.value);
      if (tipResult.status === 'fulfilled') setTipStats(tipResult.value);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadAllCards = async (page: number = 1, status?: string) => {
    try {
      const result = await punchCardService.getAllCards(page, 10, status || undefined);
      setAllCards(result.data);
      setAllCardsPage(result.page);
      setAllCardsTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };


  const handleDeleteCustomer = async (userId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        const success = await userService.deleteCustomer(userId);
        if (success) {
          setCustomers(customers.filter(c => c.id !== userId));
          alert(`Successfully deleted ${name}`);
        } else {
          alert('Failed to delete customer. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-brand-yellow" />
            <h1 className="text-brand-white text-xl">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">Estilo Latino Dance Studio</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card padding="medium" className="border-2 border-brand-yellow bg-gray-900">
              <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                <DollarSign className="text-brand-yellow" size={20} />
              </div>
              <p className="text-gray-400 text-xs mb-1">Total Revenue</p>
              <p className="text-brand-white text-2xl">
                ${currentMonthStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs mt-1">This month</p>
            </Card>

            <Card padding="medium" className="bg-gray-900">
              <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                <Users className="text-brand-yellow" size={20} />
              </div>
              <p className="text-gray-400 text-xs mb-1">New Customers</p>
              <p className="text-brand-white text-2xl">{currentMonthStats.newCustomers}</p>
              <p className="text-gray-500 text-xs mt-1">This month</p>
            </Card>

            <Card padding="medium" className="bg-gray-900">
              <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                <Heart className="text-brand-yellow" size={20} />
              </div>
              <p className="text-gray-400 text-xs mb-1">Tips Received</p>
              <p className="text-brand-white text-2xl">${tipStats.thisMonthTips.toFixed(2)}</p>
              <p className="text-gray-500 text-xs mt-1">This month ({tipStats.thisMonthTipCount} tips)</p>
            </Card>

            <Card padding="medium" className="bg-gray-900">
              <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                <CreditCard className="text-brand-yellow" size={20} />
              </div>
              <p className="text-gray-400 text-xs mb-1">Active Cards</p>
              <p className="text-brand-white text-2xl">{currentMonthStats.activeCards}</p>
              <p className="text-gray-500 text-xs mt-1">Currently active</p>
            </Card>
          </div>

          {/* Today's Birthdays Alert */}
          {todaysBirthdays.length > 0 && (
            <Card padding="medium" className="border-2 border-brand-yellow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                  <Cake className="text-brand-yellow" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-brand-black text-lg font-semibold">🎂 Birthday Alert!</h3>
                  <p className="text-gray-700 text-sm">
                    {todaysBirthdays.length} customer{todaysBirthdays.length > 1 ? 's have' : ' has'} a birthday today!
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {todaysBirthdays.map((person: any) => (
                      <span key={person.id} className="bg-brand-yellow/30 text-brand-black px-2 py-1 rounded text-xs font-medium">
                        {person.first_name} {person.last_name}
                        {person.check_in_code && ` (${person.check_in_code})`}
                      </span>
                    ))}
                  </div>
                </div>
                <Gift className="text-brand-yellow" size={32} />
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card padding="large" className="bg-gray-900">
            <h3 className="text-brand-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowAllCards(!showAllCards);
                  if (!showAllCards) loadAllCards();
                }}
                variant="secondary"
                className="w-full justify-start"
              >
                <CreditCard size={20} />
                View All Purchased Cards
              </Button>
              <Button
                onClick={() => setShowExpiredCards(!showExpiredCards)}
                variant="secondary"
                className="w-full justify-start"
              >
                <AlertCircle size={20} />
                View All Expired Cards ({expiredCards.length})
              </Button>
              <Button
                onClick={() => setShowManageCustomers(!showManageCustomers)}
                variant="secondary"
                className="w-full justify-start"
              >
                <Users size={20} />
                Manage Customers
              </Button>
              <Button
                onClick={() => setShowReports(!showReports)}
                variant="secondary"
                className="w-full justify-start"
              >
                <BarChart size={20} />
                View Reports
              </Button>
            </div>
          </Card>

          {/* All Cards Section */}
          {showAllCards && (
            <Card padding="large" className="bg-gray-900 border-2 border-brand-yellow/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-brand-white">All Purchased Cards</h3>
                <select
                  className="bg-gray-800 text-white text-sm rounded px-3 py-1 border border-gray-600"
                  value={cardStatusFilter}
                  onChange={(e) => {
                    setCardStatusFilter(e.target.value);
                    loadAllCards(1, e.target.value);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="exhausted">Exhausted</option>
                </select>
              </div>

              {allCards.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No cards found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allCards.map((card: any) => (
                    <div key={card.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-brand-white text-sm font-medium">{card.owner_name}</p>
                          <p className="text-gray-400 text-xs">{card.owner_email}</p>
                          {card.owner_check_in_code && (
                            <p className="text-brand-yellow text-xs">Code: {card.owner_check_in_code}</p>
                          )}
                        </div>
                        <Badge variant={card.status === 'active' ? 'success' : card.status === 'expired' ? 'error' : 'warning'}>
                          {card.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-gray-500">Card: </span>
                          <span className="text-gray-300">{card.card_type?.name || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining: </span>
                          <span className="text-gray-300">{card.classes_remaining}/{card.total_classes}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Purchased: </span>
                          <span className="text-gray-300">{card.purchase_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Paid: </span>
                          <span className="text-brand-yellow">${card.amount_paid}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {allCardsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => loadAllCards(allCardsPage - 1, cardStatusFilter)}
                    disabled={allCardsPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-400 text-sm py-2">
                    Page {allCardsPage} of {allCardsTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => loadAllCards(allCardsPage + 1, cardStatusFilter)}
                    disabled={allCardsPage >= allCardsTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Expired Cards */}
          {showExpiredCards && (
            <Card padding="large" className="bg-gray-900 border-2 border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-brand-white">Expired Cards</h3>
                <Badge variant="danger">{expiredCards.length}</Badge>
              </div>

              {expiredCards.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No expired cards at this time
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expiredCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-brand-white text-sm">{card.name}</p>
                          <p className="text-gray-400 text-xs">User ID: {card.userId}</p>
                        </div>
                        <Badge variant="danger">Expired</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Remaining: </span>
                          <span className="text-gray-300">{card.classesRemaining} classes</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expired: </span>
                          <span className="text-red-400">{card.expirationDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Manage Customers */}
          {showManageCustomers && (
            <Card padding="large" className="bg-gray-900 border-2 border-brand-yellow/30">
              <h3 className="text-brand-white mb-4">Manage Customers</h3>


              {/* Customer List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="text-gray-400 text-xs mb-2">All Customers ({customers.length})</h4>
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-brand-white text-sm">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-gray-400 text-xs">{customer.email}</p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteCustomer(customer.id, `${customer.firstName} ${customer.lastName}`)}
                      className="text-xs h-8"
                    >
                      <UserMinus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reports */}
          {showReports && (
            <Card padding="large" className="bg-gray-900 border-2 border-brand-yellow/30">
              <h3 className="text-brand-white mb-4">Analytics Reports</h3>

              {/* Monthly Trends */}
              <div className="mb-6">
                <h4 className="text-brand-yellow text-sm mb-3">Monthly Trends</h4>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#FFC700' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="newCustomers" stroke="#FFC700" name="New Customers" strokeWidth={2} />
                      <Line type="monotone" dataKey="attendance" stroke="#10B981" name="Attendance" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="mb-6">
                <h4 className="text-brand-yellow text-sm mb-3">Revenue & Active Cards</h4>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#FFC700' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="revenue" fill="#FFC700" name="Revenue ($)" />
                      <Bar dataKey="activeCards" fill="#3B82F6" name="Active Cards" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs mb-1">Avg Monthly Revenue</p>
                  <p className="text-brand-yellow text-xl">
                    ${Math.round(analyticsData.reduce((sum, d) => sum + d.revenue, 0) / analyticsData.length).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs mb-1">Total New Customers</p>
                  <p className="text-brand-yellow text-xl">
                    {analyticsData.reduce((sum, d) => sum + d.newCustomers, 0)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* System Info */}
          <Card padding="small" className="bg-gray-900 border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              💡 Use navigation tabs to access Punch, Modify, and History features
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
