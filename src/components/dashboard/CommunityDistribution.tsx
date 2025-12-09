'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers } from '@/lib/actions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const colors = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function CommunityDistribution() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fnmembers'],
    queryFn: () => getFnMembers()
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading community data
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

  // Count members in each community
  const communityCounts = data.data.reduce((acc: { [key: string]: number }, member: any) => {
    const community = member.profile?.[0]?.community?.trim() || 'Unspecified';
    acc[community] = (acc[community] || 0) + 1;
    return acc;
  }, {});

  // Format data for Recharts and calculate percentages
  const total = Object.values(communityCounts).reduce((sum, count) => sum + count, 0);
  const chartData = Object.entries(communityCounts)
    .map(([name, value], index) => ({
      name,
      value,
      percentage: ((value / total) * 100).toFixed(1),
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Community Distribution
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Members by community location</p>
      </div>

      <div className="h-[400px] mb-8 p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
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
              dataKey="value" 
              name="Members"
              radius={[6, 6, 0, 0]}
              fill="url(#colorGradient)"
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chartData.map((item, index) => (
          <div 
            key={item.name}
            className="bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm border-0 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate mb-2" title={item.name}>
              {item.name}
            </h3>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}