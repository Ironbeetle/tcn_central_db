'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers } from '@/lib/actions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInYears } from 'date-fns';

export default function AgeDistribution() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fnmembers'],
    queryFn: () => getFnMembers()
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading age distribution data
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

  // Calculate ages and group them
  const ageGroups = {
    '0-17': 0,
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56-65': 0,
    '65+': 0
  };

  data.data.forEach(member => {
    const age = differenceInYears(new Date(), new Date(member.birthdate));
    
    if (age <= 17) ageGroups['0-17']++;
    else if (age <= 25) ageGroups['18-25']++;
    else if (age <= 35) ageGroups['26-35']++;
    else if (age <= 45) ageGroups['36-45']++;
    else if (age <= 55) ageGroups['46-55']++;
    else if (age <= 65) ageGroups['56-65']++;
    else ageGroups['65+']++;
  });

  const chartData = Object.entries(ageGroups).map(([range, count]) => ({
    ageRange: range,
    count,
    percentage: ((count / data.data.length) * 100).toFixed(1)
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Age Distribution
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Members by age group</p>
      </div>

      <div className="h-[400px] mb-6 p-4 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis 
              dataKey="ageRange" 
              stroke="#64748b"
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
              formatter={(value: number, name, props) => [
                `${value} members (${props.payload?.percentage}%)`, 
                'Count'
              ]}
            />
            <Bar 
              dataKey="count" 
              name="Members"
              radius={[6, 6, 0, 0]}
              fill="url(#ageGradient)"
            />
            <defs>
              <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((item, index) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
          const color = colors[index % colors.length];
          
          return (
            <div 
              key={item.ageRange}
              className="bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm border-0 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-lg"
            >
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {item.ageRange} years
              </h3>
              <p className="text-2xl font-bold" style={{ color }}>
                {item.count}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}