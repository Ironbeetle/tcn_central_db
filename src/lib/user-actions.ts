'use server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Validation schemas
const CreateUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  department: z.enum(['OFFICE_ADMIN', 'COUNCIL']),
  role: z.enum(['ADMIN', 'CHIEF_COUNCIL']),
});

const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

// Simplified activity logging utility
export async function logUserActivity(
  userId: string, 
  action: string, 
  details?: string
) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw here as activity logging shouldn't break main functionality
  }
}

export async function createUser(data: CreateUserData) {
  try {
    const validatedData = CreateUserSchema.parse(data);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
    });

    // Log activity
    await logUserActivity(
      user.id, 
      'user_created', 
      `User ${user.email} created`
    );

    revalidatePath('/UserManager');
    return { 
      success: true, 
      data: { ...user, password: undefined } // Don't return password
    };
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.issues };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Email already exists' };
      }
    }
    return { success: false, error: 'Failed to create user' };
  }
}

export async function updateUser(id: string, data: Partial<UpdateUserData>) {
  try {
    const validatedData = UpdateUserSchema.partial().parse({ ...data, id });
    
    const updateData: any = { ...validatedData };
    delete updateData.id;
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await logUserActivity(
      id, 
      'user_updated', 
      `User ${user.email} updated`
    );

    revalidatePath('/UserManager');
    return { 
      success: true, 
      data: { ...user, password: undefined }
    };
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.issues };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' };
      }
    }
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    await prisma.user.delete({ where: { id } });

    // Note: Activity logging for deletion would need the current user's ID from session
    // This could be added if needed
    
    revalidatePath('/UserManager');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        department: true,
        role: true,
        created: true,
        lastLogin: true,
        loginAttempts: true,
        lockedUntil: true,
      },
      orderBy: {
        created: 'desc'
      }
    });

    return {
      success: true,
      data: users
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function getUserActivity(
  userId?: string, 
  limit: number = 50,
  dateRange?: { start: Date; end: Date }
) {
  try {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (dateRange) {
      where.timestamp = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const activities = await prisma.userActivity.findMany({
      where,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
    });

    return {
      success: true,
      data: activities
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return { success: false, error: 'Failed to fetch user activity' };
  }
}

export async function resetUserPassword(id: string) {
  try {
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordResetRequested: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log activity
    await logUserActivity(
      id, 
      'password_reset', 
      `Password reset for ${user.email}`
    );

    revalidatePath('/UserManager');
    return { 
      success: true, 
      data: { tempPassword } // Return temp password to show admin
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

export async function toggleUserStatus(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const isLocked = user.lockedUntil && user.lockedUntil > new Date();
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil: isLocked ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Lock for 1 year or unlock
        loginAttempts: 0,
      },
    });

    // Log activity
    await logUserActivity(
      id, 
      isLocked ? 'user_unlocked' : 'user_locked', 
      `User ${user.email} ${isLocked ? 'unlocked' : 'locked'}`
    );

    revalidatePath('/UserManager');
    return { 
      success: true, 
      data: { ...updatedUser, password: undefined }
    };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, error: 'Failed to toggle user status' };
  }
}

// Activity statistics for analytics
export async function getUserActivityStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activity counts by action
    const actionStats = await prisma.userActivity.groupBy({
      by: ['action'],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    // Get daily activity counts
    const dailyStats = await prisma.userActivity.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        timestamp: true,
        action: true,
      },
    });

    // Process daily stats
    const dailyActivityMap = new Map();
    dailyStats.forEach(activity => {
      const date = activity.timestamp.toISOString().split('T')[0];
      if (!dailyActivityMap.has(date)) {
        dailyActivityMap.set(date, 0);
      }
      dailyActivityMap.set(date, dailyActivityMap.get(date) + 1);
    });

    const dailyActivity = Array.from(dailyActivityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get most active users
    const userStats = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 5,
    });

    // Get user details for most active users
    const userDetails = await prisma.user.findMany({
      where: {
        id: {
          in: userStats.map(stat => stat.userId),
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    const activeUsers = userStats.map(stat => {
      const user = userDetails.find(u => u.id === stat.userId);
      return {
        user,
        activityCount: stat._count.userId,
      };
    });

    return {
      success: true,
      data: {
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.action,
        })),
        dailyActivity,
        activeUsers,
      },
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return { success: false, error: 'Failed to fetch activity statistics' };
  }
}