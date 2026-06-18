import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Search, Menu, X, LogOut, LayoutDashboard, SearchCode, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = user && user.role === 'Admin' 
    ? [
        { name: 'Admin Panel', path: '/admin' }
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/projects' },
        ...(user ? [{ name: 'Dashboard', path: '/dashboard' }] : [])
      ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:bg-indigo-700 transition">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">ProjectWala</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Welcome, </span>
                    <span className="font-semibold text-gray-900">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium text-sm transition"
                  >
                    Log in / Sign up
                  </Link>
                  <Link
                    to="/login?admin=true"
                    className="text-gray-600 hover:text-gray-900 font-medium text-sm transition"
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-b border-gray-100 bg-white"
          >
            <div className="px-4 pt-2 pb-4 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    User Log in / Sign up
                  </Link>
                  <Link
                    to="/login?admin=true"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    Admin
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
