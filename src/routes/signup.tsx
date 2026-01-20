import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Mail, Lock, User, MapPin, Loader2, Compass, ArrowLeft } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/ui';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
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

    setIsLoading(true);

    try {
      await authClient.signUp.email(
        { email, password, name },
        {
          onSuccess: () => {
            navigate({ to: '/dashboard' });
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Failed to create account');
          },
        },
      );
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with home link */}
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
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <MapPin className="text-white" size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Start your journey</h1>
            <p className="text-muted">Create an account to plan your adventures</p>
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

                <Input
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  leftIcon={<User size={18} />}
                  required
                  autoComplete="name"
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  leftIcon={<Mail size={18} />}
                  required
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  leftIcon={<Lock size={18} />}
                  required
                  autoComplete="new-password"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  leftIcon={<Lock size={18} />}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted mt-6">Your adventure awaits</p>
        </motion.div>
      </div>
    </div>
  );
}
