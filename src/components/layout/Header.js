'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaWallet, FaHome, FaPlus, FaChartBar, FaMoneyBillWave, FaUserCircle } from 'react-icons/fa';

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: <FaHome className="text-lg" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <FaChartBar className="text-lg" /> },
    { name: 'Trips', path: '/trips', icon: <FaWallet className="text-lg" /> },
    { name: 'Add Trip', path: '/trips/new', icon: <FaPlus className="text-lg" /> },
    { name: 'Add Expense', path: '/expenses/new', icon: <FaMoneyBillWave className="text-lg" /> },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center" legacyBehavior={false}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <span className="text-xl font-bold text-primary">SplitRupee</span>
              <div className="bg-primary-500 text-white p-2 rounded-lg mr-2">
                <FaWallet className="text-xl" />
                
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">SplitPaisa</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center space-x-2 py-2 px-3 rounded-md transition-all duration-200 ${
                  pathname === item.path
                    ? 'text-white bg-primary-500 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                legacyBehavior={false}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {pathname === item.path && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* User Avatar */}
          <div className="hidden md:flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-tertiary-500 flex items-center justify-center text-white">
                <FaUserCircle className="text-xl" />
              </div>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-3 ${
                  pathname === item.path
                    ? 'text-primary-500 bg-primary-50 dark:bg-gray-700'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                legacyBehavior={false}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
