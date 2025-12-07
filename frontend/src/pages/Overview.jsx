import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { salaryAPI, leaveAPI, verificationAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, DollarSign, Calendar, ShieldCheck, TrendingUp, FileText, Clock } from 'lucide-react';

const Overview = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch salary slips
        const [salarySlips, leaves, verification] = await Promise.all([
          salaryAPI.getSalarySlips(user.id),
          leaveAPI.getLeaves(user.id),
          verificationAPI.getVerificationStatus?.() // optional chaining in case not implemented
        ]);

        // Aggregate salary info
        let currentMonthSalary = null;
        let currentMonth = null;
        if (Array.isArray(salarySlips) && salarySlips.length > 0) {
          // Find latest slip by year/month
          const sorted = [...salarySlips].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            // Assume month is string like 'December', map to number
            const monthMap = {
              January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
              July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
            };
            return (monthMap[b.month] || 0) - (monthMap[a.month] || 0);
          });
          const latest = sorted[0];
          currentMonthSalary = latest.net_pay;
          currentMonth = `${latest.month} ${latest.year}`;
        }

        // Aggregate leave info
        let remainingLeaves = null;
        let totalLeaves = null;
        let pendingLeaves = null;
        if (Array.isArray(leaves)) {
          totalLeaves = leaves.length;
          remainingLeaves = leaves.filter(l => l.status === 'approved').length;
          pendingLeaves = leaves.filter(l => l.status === 'pending').length;
        }

        // Verification status
        let idVerificationStatus = verification?.status || 'Pending';

        // Recent activity (combine salary and leave events)
        const recentActivity = [];
        if (Array.isArray(salarySlips)) {
          salarySlips.slice(-3).forEach(slip => {
            recentActivity.push({
              type: 'salary',
              title: `Salary slip for ${slip.month} ${slip.year}`,
              description: `Net pay: ₹${slip.net_pay}`,
              date: slip.date_generated || '',
            });
          });
        }
        if (Array.isArray(leaves)) {
          leaves.slice(-3).forEach(leave => {
            recentActivity.push({
              type: 'leave',
              title: `Leave from ${leave.start_date} to ${leave.end_date}`,
              description: leave.reason || '',
              date: leave.start_date,
            });
          });
        }

        setDashboard({
          currentMonthSalary,
          currentMonth,
          remainingLeaves,
          totalLeaves,
          pendingLeaves,
          idVerificationStatus,
          recentActivity,
        });
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const renderUserInfo = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Employee Information</CardTitle>
        <CardDescription>Your profile details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Employee ID</p>
            <p className="text-base font-medium text-gray-900 mt-1">{user?.id || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-base font-medium text-gray-900 mt-1">{user?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge className="mt-1" variant="secondary">Active</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {renderUserInfo()}
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {renderUserInfo()}
        <div className="flex items-center justify-center min-h-[200px] text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="space-y-8">
        {renderUserInfo()}
        <div className="flex items-center justify-center min-h-[200px] text-gray-500">
          No dashboard data available.
        </div>
      </div>
    );
  }

  // Example: adjust these fields as per your backend response structure
  const stats = [
    {
      title: 'Current Month Salary',
      value: dashboard.currentMonthSalary ? `₹${dashboard.currentMonthSalary}` : 'N/A',
      description: dashboard.currentMonth ? dashboard.currentMonth : '',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Remaining Leaves',
      value: dashboard.remainingLeaves !== undefined ? `${dashboard.remainingLeaves} days` : 'N/A',
      description: dashboard.totalLeaves !== undefined ? `Out of ${dashboard.totalLeaves} total` : '',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Leaves',
      value: dashboard.pendingLeaves !== undefined ? dashboard.pendingLeaves : 'N/A',
      description: 'Awaiting approval',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'ID Verification',
      value: dashboard.idVerificationStatus || 'Pending',
      description: 'Complete verification',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const recentActivity = dashboard.recentActivity || [];

  return (
    <div className="space-y-8">
      {renderUserInfo()}
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-gray-500">No recent activity.</div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'salary' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      {activity.type === 'salary' ? (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/dashboard/salary"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FileText className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  View Salary
                </span>
              </a>
              <a
                href="/dashboard/leaves"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Calendar className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Request Leave
                </span>
              </a>
              <a
                href="/dashboard/verification"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Verify ID
                </span>
              </a>
              <a
                href="/dashboard/salary"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Salary History
                </span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
