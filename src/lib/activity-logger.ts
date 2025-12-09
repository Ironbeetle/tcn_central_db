'use server';
import { logUserActivity } from './user-actions';
import { getCurrentUser } from './auth-actions';

export async function logActivity(action: string, details?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    await logUserActivity(user.id, action, details);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Helper functions for common activities
export async function logLogin() {
  await logActivity('login', 'User logged in');
}

export async function logLogout() {
  await logActivity('logout', 'User logged out');
}

export async function logMemberAction(action: 'create' | 'update' | 'delete', memberName?: string, memberId?: string) {
  const details = memberName 
    ? `Member: ${memberName} (ID: ${memberId})` 
    : `Member ID: ${memberId}`;
  await logActivity(`member_${action}`, details);
}

export async function logDashboardView(section?: string) {
  await logActivity('dashboard_view', section ? `Section: ${section}` : undefined);
}

export async function logUserManagement(action: string, targetUser?: string) {
  await logActivity('user_management', `${action}: ${targetUser}`);
}