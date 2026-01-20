import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Check,
  Clock,
  Crown,
  Link2,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { AnimatedPage, Button, Card, CardContent } from '../../components/ui';
import type {
  LucideIcon} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  free: string | boolean;
  pro: string | boolean;
}

const features: Array<Feature> = [
  {
    icon: Users,
    title: 'Unlimited Follows',
    description: 'Connect with more travelers',
    free: 'Up to 50',
    pro: 'Unlimited',
  },
  {
    icon: Share2,
    title: 'Shared Trips',
    description: 'Share your adventures publicly',
    free: 'Up to 3',
    pro: 'Unlimited',
  },
  {
    icon: Clock,
    title: 'Feed History',
    description: 'Access to activity feed',
    free: '7 days',
    pro: 'Unlimited',
  },
  {
    icon: Link2,
    title: 'Custom Share URLs',
    description: 'Personalized trip links',
    free: false,
    pro: true,
  },
  {
    icon: BarChart3,
    title: 'Profile Analytics',
    description: 'Track your profile views',
    free: false,
    pro: true,
  },
  {
    icon: Sparkles,
    title: 'Pro Badge',
    description: 'Stand out in the community',
    free: false,
    pro: true,
  },
];

function ProPage() {
  const role = useQuery(api.roles.getCurrentRole);
  const isPro = role?.permissions.includes('pro_badge');

  return (
    <AnimatedPage>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200"
          >
            <Crown size={32} className="text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-foreground"
          >
            Wanderlust Pro
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-muted mt-2"
          >
            Unlock premium features for the ultimate travel experience
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Current Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={isPro ? 'border-amber-200 bg-amber-50/50' : ''}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted">Current Plan</p>
                    <p className="text-xl font-bold text-foreground">
                      {isPro ? 'Wanderlust Pro' : 'Free Plan'}
                    </p>
                  </div>
                  {isPro ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-full border border-amber-200">
                      <Crown size={18} />
                      <span className="font-semibold">Pro Active</span>
                    </div>
                  ) : (
                    <Button leftIcon={<Crown size={18} />} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card padding="none" className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="grid grid-cols-3 gap-0 border-b border-border-light">
                  <div className="p-4 font-semibold text-foreground">Feature</div>
                  <div className="p-4 font-semibold text-foreground text-center border-x border-border-light">
                    Free
                  </div>
                  <div className="p-4 font-semibold text-amber-700 text-center bg-gradient-to-b from-amber-50 to-amber-100/50">
                    <span className="flex items-center justify-center gap-1.5">
                      <Crown size={14} />
                      Pro
                    </span>
                  </div>
                </div>

                {/* Features */}
                {features.map((feature, idx) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className={`grid grid-cols-3 gap-0 ${
                      idx < features.length - 1 ? 'border-b border-border-light' : ''
                    }`}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center flex-shrink-0">
                        <feature.icon size={16} className="text-muted" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-foreground font-medium text-sm block truncate">
                          {feature.title}
                        </span>
                        <span className="text-xs text-muted hidden sm:block">
                          {feature.description}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-center border-x border-border-light">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check size={18} className="text-secondary" />
                        ) : (
                          <span className="text-muted">—</span>
                        )
                      ) : (
                        <span className="text-muted text-sm">{feature.free}</span>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-center bg-amber-50/50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check size={18} className="text-amber-600" />
                        ) : (
                          <span className="text-muted">—</span>
                        )
                      ) : (
                        <span className="text-amber-700 font-medium text-sm">{feature.pro}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted"
          >
            Pro subscriptions are managed manually. Contact support to upgrade.
          </motion.p>
        </div>
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute('/_authenticated/pro')({
  component: ProPage,
});
