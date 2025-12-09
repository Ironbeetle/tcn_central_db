import { useState, useEffect, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { 
  getUsers,
  getUserActivity,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  toggleUserStatus
} from '@/lib/user-actions';

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: 'OFFICE_ADMIN' | 'COUNCIL';
  role: 'ADMIN' | 'CHIEF_COUNCIL';
  created: Date;
  lastLogin?: Date | null;
  loginAttempts: number;
  lockedUntil?: Date | null;
};

export const useUserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async (userId?: string, limit = 50) => {
    try {
      const result = await getUserActivity(userId, limit);
      if (result.success && result.data) {
        setActivities(result.data);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      toast.error('Failed to fetch activity');
    }
  }, []);

  const createUserMutation = {
    isPending,
    mutateAsync: async (userData: any) => {
      return new Promise<User>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await createUser(userData);
            
            if (result.success) {
              await fetchUsers();
              toast.success(`User ${userData.first_name} ${userData.last_name} created successfully!`);
              resolve(result.data as User);
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            toast.error(`Failed to create user: ${err instanceof Error ? err.message : 'Unknown error'}`);
            reject(err);
          }
        });
      });
    }
  };

  const updateUserMutation = {
    isPending,
    mutateAsync: async ({ id, data }: { id: string; data: any }) => {
      return new Promise<User>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await updateUser(id, data);
            
            if (result.success) {
              await fetchUsers();
              toast.success('User updated successfully!');
              resolve(result.data as User);
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            toast.error(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
            reject(err);
          }
        });
      });
    }
  };

  const deleteUserMutation = {
    isPending,
    mutateAsync: async (id: string) => {
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await deleteUser(id);
            
            if (result.success) {
              await fetchUsers();
              toast.success('User deleted successfully!');
              resolve();
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            toast.error(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
            reject(err);
          }
        });
      });
    }
  };

  const resetPasswordMutation = {
    isPending,
    mutateAsync: async (id: string) => {
      return new Promise<{ tempPassword: string }>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await resetUserPassword(id);
            
            if (result.success) {
              await fetchUsers();
              toast.success('Password reset successfully!');
              resolve(result.data as { tempPassword: string });
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            toast.error(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`);
            reject(err);
          }
        });
      });
    }
  };

  const toggleStatusMutation = {
    isPending,
    mutateAsync: async (id: string) => {
      return new Promise<User>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await toggleUserStatus(id);
            
            if (result.success) {
              await fetchUsers();
              toast.success('User status updated successfully!');
              resolve(result.data as User);
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            toast.error(`Failed to update user status: ${err instanceof Error ? err.message : 'Unknown error'}`);
            reject(err);
          }
        });
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActivity();
  }, [fetchUsers, fetchActivity]);

  return {
    // Data
    users,
    activities,
    
    // Loading states
    isLoading,
    error,
    
    // Mutations
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    resetPasswordMutation,
    toggleStatusMutation,
    
    // Refresh functions
    fetchUsers,
    fetchActivity,
  };
};

export default useUserManager;