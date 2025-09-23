'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Menu, 
  X,
  Home,
  Users,
  BarChart,
  Settings,
  LogOut,
  CreditCard,
  FileText
} from 'lucide-react';

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/admin/dashboard'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname === '/admin/users' || pathname.startsWith('/admin/users/')
    },
    {
      name: 'Plans',
      href: '/admin/plans',
      icon: CreditCard,
      current: pathname === '/admin/plans' || pathname.startsWith('/admin/plans/')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart,
      current: pathname === '/admin/analytics'
    },
    {
      name: 'Environment',
      href: '/admin/environment',
      icon: FileText,
      current: pathname === '/admin/environment'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings'
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-lg shadow-lg text-gray-600 hover:text-gray-900"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        w-16 md:w-16
      `}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 flex flex-col justify-center p-6">
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center justify-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'text-coffee'
                      : 'text-gray-600 hover:coffee'
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 h-6 w-6 ${
                      item.current ? 'text-coffee' : 'text-gray-600 group-hover:text-coffee'
                    }`}
                    aria-hidden="true"
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                </Link>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="group relative flex items-center justify-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-red-600 cursor-pointer" onClick={handleLogout}>
              <LogOut className="flex-shrink-0 h-6 w-6 text-gray-600 group-hover:text-red-600" />
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            </div>
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="group relative flex items-center justify-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600"
            >
              <Home className="flex-shrink-0 h-6 w-6 text-gray-600 group-hover:text-blue-600" />
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Back to Home
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content spacer for desktop */}
      <div className="hidden md:block w-16 flex-shrink-0"></div>
    </>
  );
};

export default AdminSidebar;