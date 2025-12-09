"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Users, Activity, Shield, Clock, UserPlus, Settings } from "lucide-react";
import UserList from "@/components/user-manager/UserList";
import UserActivity from "@/components/user-manager/UserActivity";
import SecurityMetrics from "@/components/user-manager/SecurityMetrics";
import ActivityCharts from "@/components/user-manager/ActivityCharts";

const managerTabs = [
  { id: 1, name: "Users", icon: Users, color: "from-blue-500 to-blue-600" },
  { id: 2, name: "Activity Log", icon: Activity, color: "from-emerald-500 to-emerald-600" },
  { id: 3, name: "Security", icon: Shield, color: "from-purple-500 to-purple-600" },
  { id: 4, name: "Analytics", icon: Clock, color: "from-orange-500 to-orange-600" },
];

export default function UserManager() {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-400 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <Link 
            href="/Home" 
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="ml-6">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Manager
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 mb-4">Management</h2>
            {managerTabs.map((tab) => {
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
          <div className="lg:col-span-4 p-6">
            <div className="rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
              {activeTab === 1 && <UserList />}
              {activeTab === 2 && <UserActivity />}
              {activeTab === 3 && <SecurityMetrics />}
              {activeTab === 4 && <ActivityCharts />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}