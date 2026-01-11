"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, BarChart3, Users, Home, UserCheck, Calendar, Activity } from "lucide-react";
import CommunityDistribution from "@/components/dashboard/CommunityDistribution";
import ReserveStatus from "@/components/dashboard/ReserveStatus";
import MemberStatistics from "@/components/dashboard/MemberStatistics";
import AgeDistribution from "@/components/dashboard/AgeDistribution";
import BarcodeStatus from "@/components/dashboard/BarcodeStatus";
import RecentActivity from "@/components/dashboard/RecentActivity";

const dashboardTabs = [
  { id: 1, name: "Overview", icon: BarChart3, color: "from-blue-500 to-blue-600" },
  { id: 2, name: "Reserve Status", icon: Home, color: "from-emerald-500 to-emerald-600" },
  { id: 3, name: "Communities", icon: Users, color: "from-purple-500 to-purple-600" },
  { id: 4, name: "Age Groups", icon: Calendar, color: "from-orange-500 to-orange-600" },
  { id: 5, name: "Barcodes", icon: UserCheck, color: "from-teal-500 to-teal-600" },
  { id: 6, name: "Recent Activity", icon: Activity, color: "from-pink-500 to-pink-600" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-400 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back 
          </button>
          <div className="ml-6">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 mb-4">Analytics</h2>
            {dashboardTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button 
                  key={tab.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group",
                    activeTab === tab.id 
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-blue-500/25 scale-105` 
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 hover:shadow-md"
                  )} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    activeTab === tab.id ? "text-white" : ""
                  )} />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4 flex flex-col justify-center items-center">
            <div className="w-9/10 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
              {activeTab === 1 && <MemberStatistics />}
              {activeTab === 2 && <ReserveStatus />}
              {activeTab === 3 && <CommunityDistribution />}
              {activeTab === 4 && <AgeDistribution />}
              {activeTab === 5 && <BarcodeStatus />}
              {activeTab === 6 && <RecentActivity />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}