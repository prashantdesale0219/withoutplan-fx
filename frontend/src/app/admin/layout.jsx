'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSecurityWrapper from '@/components/admin/AdminSecurityWrapper';

export default function AdminLayout({ children }) {
  return (
    <AdminSecurityWrapper>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </AdminSecurityWrapper>
  );
}