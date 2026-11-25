'use server'

import { redirect } from 'next/navigation'
import { getCurrentAdmin, invalidateAdminSession } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

export async function adminLogoutAction() {
  const admin = await getCurrentAdmin()
  if (admin) {
    await logAdminAction({
      adminId: admin.id,
      action: 'ADMIN_LOGOUT',
      entityType: 'Admin',
      entityId: admin.id,
    })
  }

  await invalidateAdminSession()
  redirect('/')
}
