'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Server,
  Database,
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MemberStats {
  total: number;
  activated: number;
  pending: number;
  notActivated: number;
  deceased: number;
  over18?: number;
  under18?: number;
}

interface LocalStats {
  members: MemberStats;
  profiles: number;
  barcodes: number;
  families: number;
  lastUpdated: {
    member: string | null;
    profile: string | null;
  };
}

// Portal stats come with nested 'stats' from the API
interface PortalStatusData {
  healthy: boolean;
  timestamp: string;
  database: {
    connected: boolean;
    schema: string;
    error?: string | null;
  };
  stats: {
    members: MemberStats;
    profiles: number;
    barcodes: number;
    families: number;
  };
  lastUpdated: {
    member: string | null;
    profile: string | null;
  };
}

interface SyncStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  portalStats?: PortalStatusData;
}

interface SyncData {
  sync: SyncStatus;
  local: LocalStats;
  timestamp: string;
}

export default function SyncDashboard() {
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const data = await response.json();
      if (data.success) {
        setSyncData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePush = async (type: 'full' | 'member-only' | 'incremental', options?: { since?: string }) => {
    setSyncing(`push-${type}`);
    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...options }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Push completed successfully');
      } else {
        toast.error(result.error || 'Push failed');
      }
      
      // Refresh status
      fetchStatus();
    } catch (error) {
      toast.error('Push failed: Network error');
    } finally {
      setSyncing(null);
    }
  };

  const handlePull = async (type: 'all' | 'profiles' | 'families') => {
    setSyncing(`pull-${type}`);
    try {
      const response = await fetch('/api/sync/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Pull completed successfully');
      } else {
        toast.error(result.error || 'Pull failed');
      }
      
      // Refresh status
      fetchStatus();
    } catch (error) {
      toast.error('Pull failed: Network error');
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isConnected = syncData?.sync.configured && syncData?.sync.connected;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Portal Connection
              </CardTitle>
              <CardDescription>
                Sync status with TCN Member Portal
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!syncData?.sync.configured ? (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            ) : isConnected ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
            <span className="text-sm text-gray-600">{syncData?.sync.message}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-blue-500" />
              Master Database (Local)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {syncData?.local.members.total || 0}
                </div>
                <div className="text-xs text-gray-500">Total Members</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-indigo-600">
                  {syncData?.local.members.over18 || 0}
                </div>
                <div className="text-xs text-gray-500">Eligible for Sync (18+)</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {syncData?.local.members.activated || 0}
                </div>
                <div className="text-xs text-gray-500">Activated</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">
                  {syncData?.local.members.pending || 0}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Last updated: {formatDate(syncData?.local.lastUpdated.member || null)}
            </div>
          </CardContent>
        </Card>

        {/* Portal Stats */}
        <Card className={!isConnected ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-500" />
              Member Portal (Remote)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && syncData?.sync.portalStats?.stats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {syncData.sync.portalStats.stats.members.total}
                    </div>
                    <div className="text-xs text-gray-500">Total Members</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {syncData.sync.portalStats.stats.members.activated}
                    </div>
                    <div className="text-xs text-gray-500">Activated</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600">
                      {syncData.sync.portalStats.stats.members.pending}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-600">
                      {syncData.sync.portalStats.stats.profiles}
                    </div>
                    <div className="text-xs text-gray-500">Profiles</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  Last updated: {formatDate(syncData.sync.portalStats.lastUpdated?.member)}
                </div>
              </>
            ) : isConnected && syncData?.sync.portalStats && !syncData.sync.portalStats.healthy ? (
              <div className="text-center py-6 space-y-2">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Portal Database Error</span>
                </div>
                <p className="text-sm text-gray-500">
                  {syncData.sync.portalStats.database?.error 
                    ? 'Database tables missing - run migrations on the portal server'
                    : 'Portal is connected but database is unhealthy'}
                </p>
                <p className="text-xs text-gray-400">
                  Run: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npx prisma migrate deploy</code> on the VPS
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {!syncData?.sync.configured 
                  ? 'Configure portal connection to view stats' 
                  : 'Unable to fetch portal stats'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Actions</CardTitle>
          <CardDescription>
            Push data to portal or pull member updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Push Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                Push to Portal (Master → Portal)
              </h3>
              <p className="text-sm text-gray-500">
                Send member data from master database to the portal.
                <span className="block mt-1 text-indigo-600 font-medium">
                  Only members 18 years or older will be synced.
                </span>
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => handlePush('member-only')}
                  disabled={!isConnected || syncing !== null}
                  className="w-full"
                >
                  {syncing === 'push-member-only' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Sync Members + Barcodes Only
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Recommended: Won&apos;t overwrite portal profile/family edits
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Sync members updated in the last 24 hours
                      const since = new Date();
                      since.setHours(since.getHours() - 24);
                      handlePush('incremental', { since: since.toISOString() });
                    }}
                    disabled={!isConnected || syncing !== null}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {syncing === 'push-incremental' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Last 24h Only
                  </Button>
                  <Button
                    onClick={() => handlePush('full')}
                    disabled={!isConnected || syncing !== null}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    {syncing === 'push-full' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Full Sync (All Data)
                  </Button>
                </div>
              </div>
            </div>

            {/* Pull Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-green-500" />
                Pull from Portal (Portal → Master)
              </h3>
              <p className="text-sm text-gray-500">
                Get member-updated contact info and family data.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => handlePull('all')}
                  disabled={!isConnected || syncing !== null}
                  className="w-full"
                  variant="outline"
                >
                  {syncing === 'pull-all' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Pull All Updates
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePull('profiles')}
                    disabled={!isConnected || syncing !== null}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    {syncing === 'pull-profiles' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Profiles Only
                  </Button>
                  <Button
                    onClick={() => handlePull('families')}
                    disabled={!isConnected || syncing !== null}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    {syncing === 'pull-families' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Families Only
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Help */}
      {!syncData?.sync.configured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700">
            <p className="mb-2">Add these environment variables to your <code className="bg-yellow-100 px-1 rounded">.env</code> file:</p>
            <pre className="bg-yellow-100 p-3 rounded-lg overflow-x-auto">
{`PORTAL_API_KEY="your-api-key-from-portal"
PORTAL_API_URL="https://your-portal-domain.com/api/sync"`}
            </pre>
            <p className="mt-2">Then restart the development server.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
