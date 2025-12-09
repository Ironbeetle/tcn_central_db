"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth-actions';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="outline" 
      size="sm"
      className="flex items-center space-x-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}