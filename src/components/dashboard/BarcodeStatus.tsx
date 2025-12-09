'use client';
import { useQuery } from '@tanstack/react-query';
import { getFnMembers, getUnassignedBarcodes } from '@/lib/actions';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b'];

export default function BarcodeStatus() {
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
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-teal-200 to-cyan-200 dark:from-teal-800 dark:to-cyan-800 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (!membersData?.success || !barcodesData?.success) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-600 dark:text-slate-300">
          Error loading barcode data
        </div>
      </div>
    );
  }

  const members = membersData.data || [];
  const unassignedBarcodes = barcodesData.data || [];

  // Calculate barcode statistics
  const membersWithBarcodes = members.filter(member => 
    member.barcode && member.barcode.length > 0
  ).length;
  const membersWithoutBarcodes = members.length - membersWithBarcodes;
  const availableBarcodes = unassignedBarcodes.length;

  const chartData = [
    { name: 'Assigned to Members', value: membersWithBarcodes },
    { name: 'Available for Assignment', value: availableBarcodes },
    { name: 'Members Without Barcodes', value: membersWithoutBarcodes }
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          Barcode Status
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Overview of barcode assignments and availability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] p-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
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
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {chartData.map((item, index) => (
            <Card key={item.name} className="border-0 bg-gradient-to-br from-white/70 to-slate-100/70 dark:from-slate-800/70 dark:to-slate-700/70 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: COLORS[index] }}>
                  {item.value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}% of total
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader>
            <CardTitle className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Assignment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {members.length > 0 ? Math.round((membersWithBarcodes / members.length) * 100) : 0}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              of members have barcodes
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader>
            <CardTitle className="text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {availableBarcodes}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              barcodes ready for assignment
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-800/20 hover:scale-105 transition-transform duration-200">
          <CardHeader>
            <CardTitle className="text-sm bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">Coverage Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {membersWithoutBarcodes}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              members need barcode assignment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}