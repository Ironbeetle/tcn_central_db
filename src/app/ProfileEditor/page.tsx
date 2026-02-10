import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-actions'
import ProfileEditorClient from '@/components/governance/ProfileEditorClient'

export const dynamic = 'force-dynamic';

export default async function ProfileEditorPage() {
  // Server-side auth check
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  // Restrict access to Chief & Council users only
  if (user.role !== 'CHIEF_COUNCIL' && user.department !== 'COUNCIL') {
    redirect('/Home')
  }

  return <ProfileEditorClient />
}