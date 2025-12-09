'use client';
import { useQuery } from '@tanstack/react-query';
import { getUserActivityStats } from '@/lib/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Activity, Users, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

const ACTIVITY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function ActivityCharts() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['userActivityStats'],
    queryFn: () => getUserActivityStats(30) // Last 30 days
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!statsData?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading analytics data
        </div>
      </div>
    );
  }

  const { actionStats, dailyActivity, activeUsers } = statsData.data || { actionStats: [], dailyActivity: [], activeUsers: [] };

  // Prepare data for charts
  const actionChartData = actionStats.map((stat: any, index: number) => ({
    ...stat,
    color: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length],
    displayName: stat.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }));

  // Fill in missing dates for daily activity chart
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyChartData = last30Days.map(date => {
    const activity = dailyActivity.find((d: any) => d.date === date);
    return {
      date,
      count: activity?.count || 0,
      displayDate: format(new Date(date), 'MMM dd')
    };
  });

  // Calculate totals for summary
  const totalActivities = actionStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
  const totalActiveUsers = activeUsers.length;
  const avgDailyActivity = Math.round(totalActivities / 30);
  const peakActivity = Math.max(...dailyChartData.map(d => d.count));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Usage Analytics
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Activity patterns and usage statistics</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Activity className="h-4 w-4" />
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalActivities.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalActiveUsers}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unique users</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Calendar className="h-4 w-4" />
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {avgDailyActivity}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Activities per day</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <TrendingUp className="h-4 w-4" />
              Peak Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {peakActivity}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Highest daily count</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Trend */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Daily Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      color: '#1e293b'
                    }}
                    formatter={(value) => [`${value} activities`, 'Count']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#activityGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Types Distribution */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Activity Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ displayName, count }) => `${displayName}: ${count}`}
                  >
                    {actionChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      color: '#1e293b'
                    }}
                    formatter={(value, name) => [`${value} times`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Types Bar Chart */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart className="h-5 w-5" />
              Activity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis 
                    dataKey="displayName" 
                    type="category" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      color: '#1e293b'
                    }}
                    formatter={(value) => [`${value} times`, 'Count']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)"
                    radius={[0, 4, 4, 0]}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Active Users */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Most Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.slice(0, 6).map((userStat: any, index: number) => {
                const user = userStat.user;
                const activityCount = userStat.activityCount;
                const percentage = Math.round((activityCount / totalActivities) * 100);
                
                return (
                  <div key={user?.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {activityCount}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user?.email}
                      </p>
                      <div className="mt-1 w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeUsers.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No activity data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="mt-6 border-0 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {actionStats.find((s: any) => s.action === 'login')?.count || 0}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Logins</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {actionStats.filter((s: any) => s.action.startsWith('member_')).reduce((sum: number, s: any) => sum + s.count, 0)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Member Actions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {actionStats.filter((s: any) => s.action.startsWith('user_')).reduce((sum: number, s: any) => sum + s.count, 0)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">User Management</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {actionStats.find((s: any) => s.action === 'dashboard_view')?.count || 0}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Dashboard Views</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}