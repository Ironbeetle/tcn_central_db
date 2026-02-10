'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers, getUnassignedBarcodes } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, CreditCard, UserCheck, CloudUpload } from 'lucide-react';
import { format, subDays, isAfter, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MemberStatistics() {
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['fnmembers'],
    queryFn: () => getFnMembers()
  });

  const { data: barcodesData, isLoading: barcodesLoading } = useQuery({
    queryKey: ['unassigned-barcodes'],
    queryFn: () => getUnassignedBarcodes()
  });

  if (membersLoading || barcodesLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!membersData?.success || !barcodesData?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading statistics
        </div>
      </div>
    );
  }

  const members = membersData.data || [];
  const unassignedBarcodes = barcodesData.data || [];

  // Calculate statistics
  const totalMembers = members.length;
  const recentMembers = members.filter(member => 
    isAfter(new Date(member.created), subDays(new Date(), 30))
  ).length;

  const membersWithBarcodes = members.filter(member => 
    member.barcode && member.barcode.length > 0
  ).length;

  const availableBarcodes = unassignedBarcodes.length;

  // Calculate members 18 years or older (eligible for portal sync)
  const membersOver18 = members.filter(member => {
    if (!member.birthdate) return false;
    const age = differenceInYears(new Date(), new Date(member.birthdate));
    return age >= 18;
  }).length;

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      icon: Users,
      description: "Registered community members",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
    },
    {
      title: "Members 18+",
      value: membersOver18,
      icon: CloudUpload,
      description: "Eligible for portal sync",
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20"
    },
    {
      title: "New This Month",
      value: recentMembers,
      icon: UserPlus,
      description: "Members added in last 30 days",
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
    },
    {
      title: "With Barcodes",
      value: membersWithBarcodes,
      icon: CreditCard,
      description: "Members with assigned barcodes",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
    },
    {
      title: "Available Barcodes",
      value: availableBarcodes,
      icon: UserCheck,
      description: "Unassigned barcode inventory",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Member Statistics
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Overview of community member data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className={cn("border-0 bg-gradient-to-br", stat.bgGradient, "hover:scale-105 transition-transform duration-200")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg bg-gradient-to-r", stat.gradient)}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", stat.gradient)}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-800/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Registration Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">This week</span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                  {members.filter(m => isAfter(new Date(m.created), subDays(new Date(), 7))).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">This month</span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{recentMembers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total registered</span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{totalMembers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Barcode Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Assigned</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{membersWithBarcodes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Available</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{availableBarcodes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Assignment rate</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {totalMembers > 0 ? Math.round((membersWithBarcodes / totalMembers) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}