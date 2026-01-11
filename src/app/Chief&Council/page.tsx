import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, BarChart3, Edit, Users, FileText, Shield, Search } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth-actions';
import LogoutButton from '@/components/logout-button';

export default async function ChiefCouncilPage() {
  // Server-side auth check - no useEffect needed!
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }

  // Restrict access to Chief & Council users only
  if (user.role !== 'CHIEF_COUNCIL' && user.department !== 'COUNCIL') {
    redirect('/Home');
  }

  // Get user display information
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.email?.split('@')[0] || 'User';
  
  const firstName = user.first_name || user.email?.split('@')[0] || 'User';
  
  const initials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-amber-100 to-orange-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Panel */}
      <div className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                TCN Chief & Council Portal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-amber-500 to-orange-500">
                  <AvatarFallback className="bg-transparent text-white text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {displayName}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Chief & Council
                    </span>
                  </div>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="text-center mb-12">
          <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Tansi!
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Welcome to the Chief & Council Portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
          {/* Dashboard Card */}
          <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-6">
              <Link 
                href="/Dashboard" 
                className="flex flex-col items-center justify-center h-32 text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-900 transition-all">
                  Dashboard
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  View member statistics & analytics
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Creator Card */}
          <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-6">
              <Link 
                href="/ProfileEditor" 
                className="flex flex-col items-center justify-center h-32 text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-emerald-900 transition-all">
                  Council Profile & History
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Create & manage council profiles
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Member Lookup Card */}
          <Card className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-6">
              <Link 
                href="/Editor" 
                className="flex flex-col items-center justify-center h-32 text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all">
                  Member Lookup
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Search & view member information
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <Card className="mt-8 max-w-2xl w-full mx-4 border-0 bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Chief & Council Portal
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  After each election, council members can register and create their profiles here. 
                  Use the Profile Creator to manage council member information and sync with the VPS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-4 max-w-md w-full mx-4 border-0 bg-gradient-to-br from-white/70 to-slate-100/70 dark:from-slate-800/70 dark:to-slate-700/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-2">
                User Info (Development)
              </h4>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">First Name:</span> {user.first_name}</div>
                <div><span className="font-medium">Last Name:</span> {user.last_name}</div>
                <div><span className="font-medium">Role:</span> {user.role}</div>
                <div><span className="font-medium">Department:</span> {user.department}</div>
                <div><span className="font-medium">ID:</span> {user.id}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}