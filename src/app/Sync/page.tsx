'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import SyncDashboard from '@/components/sync/SyncDashboard';
import { Toaster } from '@/components/ui/sonner';

export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
          <div className="ml-6 flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Portal Sync
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-screen-xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Database Synchronization
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage data sync between Master Database and TCN Member Portal
          </p>
        </div>

        <SyncDashboard />
      </main>

      <Toaster position="top-right" />
    </div>
  );
}
