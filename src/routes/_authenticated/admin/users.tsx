import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedPage, Card, CardContent, Input, Avatar, PageLoading } from '../../../components/ui';
import { ProBadge } from '../../../components/social/ProBadge';
import { Shield, Search, Crown, Users, AlertCircle } from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

const ROLES = ['free', 'pro', 'moderator', 'admin'] as const;
type Role = (typeof ROLES)[number];

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const role = useQuery(api.roles.getCurrentRole);
  const usersResult = useQuery(api.roles.listUsers, { search: search || undefined, limit: 100 });
  const users = usersResult?.users ?? [];
  const setUserRole = useMutation(api.roles.setUserRole);

  // Redirect if not admin
  useEffect(() => {
    if (role && !role.permissions.includes('admin_panel')) {
      navigate({ to: '/dashboard' });
    }
  }, [role, navigate]);

  if (role === undefined || usersResult === undefined) {
    return <PageLoading />;
  }

  if (!role.permissions.includes('admin_panel')) {
    return null;
  }

  const handleRoleChange = async (userId: Id<'users'>, newRole: Role) => {
    try {
      setError(null);
      await setUserRole({ userId, role: newRole });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-error/10 text-error border-error/20';
      case 'moderator':
        return 'bg-info/10 text-info border-info/20';
      case 'pro':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-border-light text-muted border-border';
    }
  };

  return (
    <AnimatedPage>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
            <Shield size={20} className="text-error" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted">Manage user roles and permissions</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* Search */}
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ROLES.map((r) => {
              const count = users.filter((u) => u.role === r).length;
              return (
                <Card key={r} padding="sm">
                  <CardContent className="text-center">
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-sm text-muted capitalize">{r}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Users List */}
          <Card padding="none">
            <CardContent className="p-0">
              <div className="divide-y divide-border-light">
                {users.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={40} className="mx-auto text-muted mb-3" />
                    <p className="text-muted">No users found</p>
                  </div>
                ) : (
                  users.map((user, idx) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between p-4 hover:bg-border-light/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.displayName || user.email}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {user.displayName || 'No name'}
                            </p>
                            {user.role === 'pro' && <ProBadge size="sm" />}
                          </div>
                          <p className="text-sm text-muted truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border capitalize hidden sm:inline-block ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value as Role)
                          }
                          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  );
}
