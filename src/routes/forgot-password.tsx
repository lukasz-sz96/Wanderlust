import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Compass, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/ui';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
                <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-muted mb-6">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a
                  password reset link.
                </p>
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Back to Sign In
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
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Mail className="text-white" size={32} />
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Forgot password?</h1>
                <p className="text-muted">Enter your email and we'll send you a reset link</p>
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
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      leftIcon={<Mail size={18} />}
                      required
                      autoComplete="email"
                      autoFocus
                    />

                    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
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
