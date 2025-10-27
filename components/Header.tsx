'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Menu, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleSidebar: () => void;
}

export default function Header({ darkMode, setDarkMode, toggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'User';
    const role = localStorage.getItem('userRole') || 'Guest';
    setUserName(name);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between relative">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded md:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* User Dropdown (fixed hover zone) */}
        <div
          className="relative group"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Dropdown menu */}
          <div
            className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 transition-all duration-200 ${
              showDropdown
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-2 invisible'
            }`}
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
