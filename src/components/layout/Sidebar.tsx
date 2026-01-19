import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MapPin,
  Plane,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  Compass,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authClient } from '../../lib/auth-client';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
  { label: 'Places', href: '/places', icon: <MapPin size={20} /> },
  { label: 'Trips', href: '/trips', icon: <Plane size={20} /> },
  { label: 'Journal', href: '/journal', icon: <BookOpen size={20} /> },
  { label: 'Discover', href: '/places/discover', icon: <Compass size={20} /> },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [currentPath, setCurrentPath] = useState('/dashboard');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-surface border-r border-border-light flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-border-light">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Compass className="text-white" size={18} />
              </div>
              <span className="font-semibold text-foreground">Wanderlust</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Compass className="text-white" size={18} />
          </div>
        )}
        {onCollapsedChange && !collapsed && (
          <IconButton
            variant="ghost"
            size="sm"
            label="Collapse sidebar"
            onClick={() => onCollapsedChange(true)}
          >
            <ChevronLeft size={18} />
          </IconButton>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Check for exact match first, then check if path starts with href
          // but exclude cases where a more specific nav item exists
          const isExactMatch = currentPath === item.href;
          const isParentMatch = currentPath.startsWith(item.href + '/');
          // Don't highlight parent if there's a more specific nav item that matches
          const hasMoreSpecificMatch = navItems.some(
            (other) => other.href !== item.href &&
            other.href.startsWith(item.href + '/') &&
            (currentPath === other.href || currentPath.startsWith(other.href + '/'))
          );
          const isActive = isExactMatch || (isParentMatch && !hasMoreSpecificMatch);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setCurrentPath(item.href)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150
                ${isActive
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-border-light hover:text-foreground'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              {item.icon}
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-light space-y-1">
        <Link
          to="/settings"
          onClick={() => setCurrentPath('/settings')}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-colors duration-150 text-muted
            hover:bg-border-light hover:text-foreground
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Settings size={20} />
          {!collapsed && <span className="font-medium">Settings</span>}
        </Link>

        <div className={`
          flex items-center gap-3 px-3 py-2.5
          ${collapsed ? 'justify-center' : ''}
        `}>
          <Avatar
            src={user?.image || undefined}
            alt={user?.name || user?.email || 'User'}
            size="sm"
          />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <IconButton
              variant="ghost"
              size="sm"
              label="Sign out"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
            </IconButton>
          )}
        </div>
      </div>

      {collapsed && onCollapsedChange && (
        <div className="p-3 border-t border-border-light">
          <IconButton
            variant="ghost"
            size="sm"
            label="Expand sidebar"
            onClick={() => onCollapsedChange(false)}
            className="mx-auto"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </IconButton>
        </div>
      )}
    </motion.aside>
  );
}

export default Sidebar;
