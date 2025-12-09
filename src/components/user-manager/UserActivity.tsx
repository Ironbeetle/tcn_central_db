'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserActivity } from '@/lib/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { 
  Activity, 
  Calendar, 
  Filter, 
  Download,
  User,
  Users,
  Shield,
  Edit,
  Trash,
  LogIn,
  LogOut
} from 'lucide-react';

const activityIcons: { [key: string]: any } = {
  login: LogIn,
  logout: LogOut,
  user_created: Users,
  user_updated: Edit,
  user_deleted: Trash,
  member_create: Users,
  member_update: Edit,
  member_delete: Trash,
  dashboard_view: Activity,
  password_reset: Shield,
  user_locked: Shield,
  user_unlocked: Shield,
};

const activityColors: { [key: string]: string } = {
  login: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  logout: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  user_created: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  user_updated: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  user_deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  member_create: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  member_update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  member_delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  dashboard_view: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  password_reset: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  user_locked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  user_unlocked: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function UserActivity() {
  const [dateRange, setDateRange] = useState('7'); // days
  const [selectedUser, setSelectedUser] = useState<string>('');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['userActivity', selectedUser, dateRange],
    queryFn: () => getUserActivity(
      selectedUser || undefined, 
      100,
      { start: startDate, end: new Date() }
    )
  });

  const activities = activityData?.success ? activityData.data : [];

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Set((activities || []).map((activity: any) => activity.user.email))
  ).map(email => {
    const activity = (activities || []).find((a: any) => a.user.email === email);
    return activity?.user;
  }).filter(Boolean);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gradient-to-r from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 rounded w-1/3"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Activity Log
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Track user actions and system events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="">All Users</option>
            {uniqueUsers.map((user: any) => (
              <option key={user.email} value={user.email}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            // Export functionality could be added here
            console.log('Export activity log');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activities?.length || 0}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Activities</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activities?.filter((a: any) => a.action === 'login').length || 0}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Login Events</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {activities?.filter((a: any) => a.action.startsWith('member_')).length || 0}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Member Actions</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {uniqueUsers.length}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Active Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {(activities?.length || 0) === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No activities found for the selected period
            </div>
          ) : (
            activities?.map((activity: any) => {
              const IconComponent = activityIcons[activity.action] || Activity;
              const initials = `${activity.user.first_name[0]}${activity.user.last_name[0]}`.toUpperCase();
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500">
                    <AvatarFallback className="text-white bg-transparent text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {activity.user.first_name} {activity.user.last_name}
                      </span>
                      <Badge className={activityColors[activity.action] || "bg-slate-100 text-slate-800"}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {activity.action.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {activity.details}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    <div>{format(new Date(activity.timestamp), 'MMM dd')}</div>
                    <div>{format(new Date(activity.timestamp), 'HH:mm')}</div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}