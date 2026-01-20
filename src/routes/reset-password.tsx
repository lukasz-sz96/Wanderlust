import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Compass, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/ui';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    };
  },
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset link');
      return;
    }

    setIsLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Compass className="text-white" size={18} />
              </div>
              <span className="font-semibold text-foreground">Wanderlust</span>
            </div>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="text-error" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
              <p className="text-muted mb-6">This password reset link is invalid or has expired.</p>
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full">
                  Request New Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="text-white" size={18} />
            </div>
            <span className="font-semibold text-foreground">Wanderlust</span>
          </div>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {success ? (
            <Card>
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="text-secondary" size={32} />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h2>
                <p className="text-muted mb-6">Your password has been successfully reset. You can now sign in.</p>
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Lock className="text-white" size={32} />
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
                <p className="text-muted">Enter your new password below</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        leftIcon={<Lock size={18} />}
                        required
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-muted hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <Input
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      leftIcon={<Lock size={18} />}
                      required
                      autoComplete="new-password"
                    />

                    <p className="text-xs text-muted">Password must be at least 8 characters</p>

                    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                      Back to Sign In
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
