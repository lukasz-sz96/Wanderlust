import {  useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { Sidebar } from './Sidebar';
import type {ReactNode} from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute left-0 top-0 h-full"
          >
            <Sidebar />
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-4 px-4 py-3 bg-surface border-b border-border-light">
          <IconButton variant="ghost" label="Open menu" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </IconButton>
          <span className="font-semibold text-foreground">Wanderlust</span>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
