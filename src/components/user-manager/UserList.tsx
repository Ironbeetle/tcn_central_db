'use client';
import { useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, toggleUserStatus } from '@/lib/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff, 
  RotateCcw, 
  Lock, 
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserFormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  department: 'OFFICE_ADMIN' | 'COUNCIL';
  role: 'ADMIN' | 'CHIEF_COUNCIL';
}

export default function UserList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    department: 'OFFICE_ADMIN',
    role: 'ADMIN',
  });

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers()
  });

  const users = usersData?.success ? usersData.data : [];

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      department: 'OFFICE_ADMIN',
      role: 'ADMIN',
    });
    setEditingUser(null);
    setTempPassword(null);
    setShowPassword(false);
  };

  const handleCreateUser = () => {
    if (!formData.password) {
      toast.error('Password is required for creating a user');
      return;
    }
    
    startTransition(async () => {
      try {
        const createData = {
          ...formData,
          password: formData.password as string
        };
        const result = await createUser(createData);
        if (result.success) {
          toast.success('User created successfully!');
          setIsCreateDialogOpen(false);
          resetForm();
          refetch();
        } else {
          toast.error(result.error || 'Failed to create user');
        }
      } catch (error) {
        toast.error('An error occurred while creating the user');
      }
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    startTransition(async () => {
      try {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        
        const result = await updateUser(editingUser.id, updateData);
        if (result.success) {
          toast.success('User updated successfully!');
          setEditingUser(null);
          resetForm();
          refetch();
        } else {
          toast.error(result.error || 'Failed to update user');
        }
      } catch (error) {
        toast.error('An error occurred while updating the user');
      }
    });
  };

  const handleDeleteUser = (user: any) => {
    if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      startTransition(async () => {
        try {
          const result = await deleteUser(user.id);
          if (result.success) {
            toast.success('User deleted successfully!');
            refetch();
          } else {
            toast.error(result.error || 'Failed to delete user');
          }
        } catch (error) {
          toast.error('An error occurred while deleting the user');
        }
      });
    }
  };

  const handleResetPassword = (user: any) => {
    if (window.confirm(`Reset password for ${user.first_name} ${user.last_name}?`)) {
      startTransition(async () => {
        try {
          const result = await resetUserPassword(user.id);
          if (result.success) {
            setTempPassword(result.data?.tempPassword || null);
            toast.success('Password reset successfully!');
            refetch();
          } else {
            toast.error(result.error || 'Failed to reset password');
          }
        } catch (error) {
          toast.error('An error occurred while resetting password');
        }
      });
    }
  };

  const handleToggleStatus = (user: any) => {
    const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
    const action = isLocked ? 'unlock' : 'lock';
    
    if (window.confirm(`${action} ${user.first_name} ${user.last_name}?`)) {
      startTransition(async () => {
        try {
          const result = await toggleUserStatus(user.id);
          if (result.success) {
            toast.success(`User ${action}ed successfully!`);
            refetch();
          } else {
            toast.error(result.error || `Failed to ${action} user`);
          }
        } catch (error) {
          toast.error(`An error occurred while ${action}ing the user`);
        }
      });
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department,
      role: user.role,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Manage system users and permissions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              onClick={() => resetForm()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateUser}
              isPending={isPending}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Temporary Password Display */}
      {tempPassword && (
        <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Temporary Password Generated
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Share this password with the user: <code className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded font-mono">{tempPassword}</code>
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTempPassword(null)}
                className="text-orange-600 hover:text-orange-800"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users && users.map((user: any) => {
          const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
          const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
          
          return (
            <Card key={user.id} className="border-0 bg-gradient-to-br from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm hover:scale-105 transition-transform duration-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500">
                    <AvatarFallback className="text-white bg-transparent font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                  </div>
                  {isLocked && (
                    <Lock className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={cn(
                      "text-xs",
                      user.role === 'ADMIN' 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    )}
                  >
                    {user.role}
                  </Badge>
                  <Badge 
                    className={cn(
                      "text-xs",
                      user.department === 'OFFICE_ADMIN' 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" 
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    )}
                  >
                    {user.department}
                  </Badge>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Created: {format(new Date(user.created), 'MMM dd, yyyy')}</div>
                  {user.lastLogin && (
                    <div>Last login: {format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')}</div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(user)}
                    className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResetPassword(user)}
                    className="h-8 px-2 text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(user)}
                    className={cn(
                      "h-8 px-2",
                      isLocked 
                        ? "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" 
                        : "text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                    )}
                  >
                    {isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteUser(user)}
                    className="h-8 px-2 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateUser}
            isPending={isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Form Component
function UserForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  isPending, 
  showPassword, 
  setShowPassword,
  isEditing 
}: {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  onSubmit: () => void;
  isPending: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Password {isEditing && "(leave blank to keep current)"}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full mt-1 px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            required={!isEditing}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="OFFICE_ADMIN">Office Admin</option>
            <option value="COUNCIL">Council</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="ADMIN">Admin</option>
            <option value="CHIEF_COUNCIL">Chief Council</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isPending}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          {isPending ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </div>
  );
}