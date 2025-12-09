'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers } from '@/lib/actions';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function ReserveStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fnmembers'],
    queryFn: () => getFnMembers()
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-emerald-200 to-blue-200 dark:from-emerald-800 dark:to-blue-800 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 rounded"></div>
            <div className="h-24 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading reserve status data
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

  // Count the status with corrected logic for your data format
  const statusCounts = data.data.reduce((acc: { [key: string]: number }, member: any) => {
    const status = member.profile?.[0]?.o_r_status || 'Unknown';
    
    // Handle your actual data format: 'onreserve', 'offreserve'
    let displayStatus;
    if (status.toLowerCase() === 'onreserve' || status.toLowerCase().includes('on') && status.toLowerCase().includes('reserve')) {
      displayStatus = 'On Reserve';
    } else if (status.toLowerCase() === 'offreserve' || status.toLowerCase().includes('off') && status.toLowerCase().includes('reserve')) {
      displayStatus = 'Off Reserve';
    } else {
      displayStatus = 'Unknown';
    }
    
    acc[displayStatus] = (acc[displayStatus] || 0) + 1;
    return acc;
  }, {});

  // Format data for Recharts
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Calculate total for percentage
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Reserve Status Distribution
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Members living on-reserve vs off-reserve</p>
      </div>

      <div className="h-[400px] mb-8 p-4 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${(((value as number) / total) * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              formatter={(value) => [`${value} members`, 'Count']} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {chartData.map((item, index) => (
          <div 
            key={item.name}
            className="bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm border-0 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">{item.name}</h3>
            <p className="text-4xl font-bold mb-2" style={{ color: COLORS[index % COLORS.length] }}>
              {item.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl">
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Summary Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <span className="text-slate-600 dark:text-slate-400 block">Total Members</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{total}</span>
          </div>
          <div className="text-center">
            <span className="text-slate-600 dark:text-slate-400 block">Majority Status</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {chartData[0]?.value >= chartData[1]?.value ? chartData[0]?.name : chartData[1]?.name}
            </span>
          </div>
          <div className="text-center">
            <span className="text-slate-600 dark:text-slate-400 block">Distribution Difference</span>
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {Math.abs(((chartData[0]?.value || 0) - (chartData[1]?.value || 0)) / total * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}