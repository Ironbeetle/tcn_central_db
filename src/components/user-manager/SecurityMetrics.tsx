'use client';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getUserActivity } from '@/lib/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lock, Unlock, Clock, UserX } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

export default function SecurityMetrics() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers()
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => getUserActivity(undefined, 500, {
      start: subDays(new Date(), 30),
      end: new Date()
    })
  });

  const users = usersData?.success ? usersData.data : [];
  const activities = activityData?.success ? activityData.data : [];

  if (usersLoading || activityLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate security metrics
  const lockedUsers = users?.filter((user: any) => 
    user.lockedUntil && new Date(user.lockedUntil) > new Date()
  ) || [];

  const recentLogins = activities?.filter((activity: any) => 
    activity.action === 'login' && isAfter(new Date(activity.timestamp), subDays(new Date(), 7))
  ) || [];

  const failedLogins = users?.filter((user: any) => user.loginAttempts > 0) || [];

  const recentPasswordResets = activities?.filter((activity: any) => 
    activity.action === 'password_reset' && isAfter(new Date(activity.timestamp), subDays(new Date(), 30))
  ) || [];

  const inactiveUsers = users?.filter((user: any) => 
    !user.lastLogin || !isAfter(new Date(user.lastLogin), subDays(new Date(), 30))
  ) || [];

  const usersByRole = users?.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Security Overview
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Monitor system security and user access</p>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-300">
              <Lock className="h-4 w-4" />
              Locked Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {lockedUsers.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Currently locked accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Shield className="h-4 w-4" />
              Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {recentLogins.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logins in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-4 w-4" />
              Failed Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {failedLogins.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Users with failed login attempts
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Clock className="h-4 w-4" />
              Password Resets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {recentPasswordResets.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resets in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <UserX className="h-4 w-4" />
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">
              {inactiveUsers.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No login in 30+ days
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Shield className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {(users?.length || 0) - inactiveUsers.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recently active accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locked Users */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Lock className="h-5 w-5" />
              Locked Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lockedUsers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No locked accounts
              </p>
            ) : (
              <div className="space-y-2">
                {lockedUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Locked
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Login Attempts */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Failed Login Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {failedLogins.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No failed login attempts
              </p>
            ) : (
              <div className="space-y-2">
                {failedLogins.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      {user.loginAttempts} attempts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Shield className="h-5 w-5" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {role === 'ADMIN' ? 'Administrators' : 'Chief Council'}
                  </span>
                  <Badge className={
                    role === 'ADMIN' 
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  }>
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Clock className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Password resets</span>
                <span className="text-sm font-medium">{recentPasswordResets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">User lockouts</span>
                <span className="text-sm font-medium">
                  {activities?.filter((a: any) => a.action === 'user_locked').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Account unlocks</span>
                <span className="text-sm font-medium">
                  {activities?.filter((a: any) => a.action === 'user_unlocked').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">New users created</span>
                <span className="text-sm font-medium">
                  {activities?.filter((a: any) => a.action === 'user_created').length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}