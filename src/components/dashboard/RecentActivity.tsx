'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { UserPlus, User, Calendar } from 'lucide-react';

export default function RecentActivity() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fnmembers'],
    queryFn: () => getFnMembers()
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gradient-to-r from-pink-200 to-rose-200 dark:from-pink-800 dark:to-rose-800 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading recent activity
        </div>
      </div>
    );
  }

  if (!data.data || data.data.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          No member data available
        </div>
      </div>
    );
  }

  // Sort members by creation date (most recent first) and take top 10
  const recentMembers = [...data.data]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 10);

  // Also get recently updated members
  const recentlyUpdated = [...data.data]
    .filter(member => member.updated !== member.created) // Only show if actually updated
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Recent Activity
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Latest member registrations and updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card className="border-0 bg-gradient-to-br from-pink-50/70 to-rose-100/70 dark:from-pink-900/20 dark:to-rose-800/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              <UserPlus className="h-5 w-5 text-pink-600" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMembers.map((member) => {
              const initials = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
              const community = member.profile?.[0]?.community || 'Unknown';
              
              return (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-pink-500 to-rose-500">
                    <AvatarFallback className="text-xs text-white bg-transparent">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {community} • T-{member.t_number}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-pink-100 dark:bg-pink-900/30 px-2 py-1 rounded-full">
                    {formatDistanceToNow(new Date(member.created), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
            {recentMembers.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                No recent registrations
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card className="border-0 bg-gradient-to-br from-violet-50/70 to-purple-100/70 dark:from-violet-900/20 dark:to-purple-800/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              <User className="h-5 w-5 text-violet-600" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentlyUpdated.map((member) => {
              const initials = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
              const community = member.profile?.[0]?.community || 'Unknown';
              
              return (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500">
                    <AvatarFallback className="text-xs text-white bg-transparent">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {community} • Profile updated
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded-full">
                    {formatDistanceToNow(new Date(member.updated), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
            {recentlyUpdated.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                No recent updates
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              <Calendar className="h-4 w-4 text-blue-600" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {recentMembers.filter(m => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(m.created) > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">new registrations</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <Calendar className="h-4 w-4 text-emerald-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {recentMembers.filter(m => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return new Date(m.created) > monthAgo;
              }).length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">new registrations</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <User className="h-4 w-4 text-purple-600" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {recentlyUpdated.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">profile changes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}