'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, FolderTree, Package, ClipboardList, CreditCard, ShoppingCart, Image, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole') || '';
    setUserRole(role);
  }, []);

  const toggleSubMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['super_admin', 'store_manager', 'social_commerce_manager'] },
    { icon: Store, label: 'Store', href: '/store', roles: ['super_admin', 'store_manager', 'social_commerce_manager'] },
    { icon: FolderTree, label: 'Category', href: '/category', roles: ['super_admin'] },
    { icon: Image, label: 'Gallery', href: '/gallery', roles: ['super_admin', 'social_commerce_manager'] },
    {
      icon: Package,
      label: 'Product',
      href: '#',
      roles: ['super_admin'],
      subMenu: [
        { label: 'Field', href: '/product/field', roles: ['super_admin'] },
        { label: 'Product', href: '/product/list', roles: ['super_admin'] },
        { label: 'Batch', href: '/product/batch', roles: ['super_admin'] },
      ],
    },
    {
      icon: ClipboardList,
      label: 'Inventory',
      href: '#',
      roles: ['super_admin', 'store_manager', 'social_commerce_manager'],
      subMenu: [
        { label: 'Manage Stock', href: '/inventory/manage_stock', roles: ['super_admin', 'store_manager'] },
        { label: 'Inventory', href: '/inventory/view', roles: ['super_admin', 'social_commerce_manager'] },
      ],
    },
    { icon: ShoppingCart, label: 'POS', href: '/pos', roles: ['super_admin', 'store_manager'] },
    { icon: ShoppingCart, label: 'Social commerce', href: '/social-commerce', roles: ['super_admin', 'social_commerce_manager'] },
    { icon: Package, label: 'Orders', href: '/orders', roles: ['super_admin', 'social_commerce_manager'] },
    { icon: ClipboardList, label: 'Purchase History', href: '/purchase-history', roles: ['super_admin', 'store_manager'] },
    { icon: AlertTriangle, label: 'Defect panel', href: '/defects', roles: ['super_admin', 'store_manager'] },
     { icon: CreditCard, label: 'Transaction', href: '/transaction', roles: ['super_admin'] },
    { icon: CreditCard, label: 'Accounting', href: '/accounting', roles: ['super_admin'] },
   
  
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole)).map(item => {
    if (item.subMenu) {
      return {
        ...item,
        subMenu: item.subMenu.filter(sub => sub.roles.includes(userRole))
      };
    }
    return item;
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50 md:translate-x-0 md:static md:h-auto`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end md:hidden p-3">
          <button onClick={() => setIsOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
              <span className="text-white dark:text-gray-900 text-sm font-semibold">E</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">ERP Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">E-Commerce Management</p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-2">Main Menu</p>
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive =
                pathname === item.href || (item.subMenu && item.subMenu.some(sub => pathname === sub.href));

              const Icon = item.icon;

              return (
                <li key={index}>
                  <div>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (item.subMenu) {
                          e.preventDefault();
                          toggleSubMenu(item.label.toLowerCase());
                        } else {
                          setIsOpen(false); // close sidebar on mobile when navigating
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                        isActive
                          ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>

                    {/* Sub-menu */}
                    {item.subMenu && item.subMenu.length > 0 && openMenu === item.label.toLowerCase() && (
                      <ul className="pl-6 space-y-1 mt-1">
                        {item.subMenu.map((subItem, subIndex) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <li key={subIndex}>
                              <Link
                                href={subItem.href}
                                className={`block text-sm px-3 py-2 rounded ${
                                  isSubActive
                                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => setIsOpen(false)} // close sidebar on mobile
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}