import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { AnimatedModal } from '../ui/AnimatedModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Link2,
  Copy,
  Check,
  Eye,
  Globe,
  Lock,
  Crown,
  X,
  Trash2,
} from 'lucide-react';

interface ShareTripModalProps {
  tripId: Id<'trips'>;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTripModal({ tripId, isOpen, onClose }: ShareTripModalProps) {
  const [copied, setCopied] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const shareSettings = useQuery(api.sharing.getShareSettings, { tripId });
  const role = useQuery(api.roles.getCurrentRole);
  const createShareLink = useMutation(api.sharing.createShareLink);
  const updateShareSettings = useMutation(api.sharing.updateShareSettings);
  const deleteShareLink = useMutation(api.sharing.deleteShareLink);

  const isPro = role?.permissions.includes('custom_urls');
  const shareUrl = shareSettings
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${shareSettings.customSlug || shareSettings.shareCode}`
    : null;

  useEffect(() => {
    if (shareSettings?.customSlug) {
      setCustomSlug(shareSettings.customSlug);
    }
  }, [shareSettings?.customSlug]);

  const handleCreateLink = async () => {
    try {
      setError(null);
      await createShareLink({ tripId });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublic = async () => {
    if (!shareSettings) return;
    try {
      setError(null);
      await updateShareSettings({
        tripId,
        isPublic: !shareSettings.isPublic,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdateSlug = async () => {
    try {
      setError(null);
      await updateShareSettings({
        tripId,
        customSlug: customSlug || undefined,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteShareLink({ tripId });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-xl shadow-xl border border-border-light overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <h2 className="text-lg font-semibold text-foreground">Share Trip</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-border-light transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
            >
              {error}
            </motion.div>
          )}

          {!shareSettings ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Link2 size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Share this trip with anyone
              </h3>
              <p className="text-muted mb-6 max-w-sm mx-auto">
                Create a public link that anyone can view, even without an account
              </p>
              <Button onClick={handleCreateLink} leftIcon={<Link2 size={16} />}>
                Create Share Link
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl || ''}
                    readOnly
                    className="flex-1 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Visibility Toggle */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 bg-border-light/50 rounded-xl border border-border-light"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    shareSettings.isPublic ? 'bg-secondary/10' : 'bg-muted/10'
                  }`}>
                    {shareSettings.isPublic ? (
                      <Globe size={20} className="text-secondary" />
                    ) : (
                      <Lock size={20} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {shareSettings.isPublic ? 'Public' : 'Private'}
                    </p>
                    <p className="text-sm text-muted">
                      {shareSettings.isPublic
                        ? 'Anyone with the link can view'
                        : 'Link is disabled'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={shareSettings.isPublic ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleTogglePublic}
                >
                  {shareSettings.isPublic ? 'Disable' : 'Enable'}
                </Button>
              </motion.div>

              {/* View Count */}
              <div className="flex items-center gap-2 text-muted">
                <Eye size={16} />
                <span className="text-sm">
                  {shareSettings.viewCount} {shareSettings.viewCount === 1 ? 'view' : 'views'}
                </span>
              </div>

              {/* Custom URL (Pro feature) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Custom URL
                  </label>
                  {!isPro && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <Crown size={10} />
                      Pro
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center">
                    <span className="px-3 py-2.5 bg-border-light text-muted rounded-l-lg border border-r-0 border-border text-sm">
                      /shared/
                    </span>
                    <Input
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder={shareSettings.shareCode}
                      disabled={!isPro}
                      className="rounded-l-none border-l-0"
                    />
                  </div>
                  {isPro && (
                    <Button variant="outline" onClick={handleUpdateSlug}>
                      Save
                    </Button>
                  )}
                </div>
                {!isPro && (
                  <p className="text-sm text-muted mt-2">
                    <a href="/pro" className="text-primary hover:underline">
                      Upgrade to Pro
                    </a>{' '}
                    for custom share URLs
                  </p>
                )}
              </div>

              {/* Delete Link */}
              <div className="pt-4 border-t border-border-light">
                <Button
                  variant="ghost"
                  className="text-error hover:bg-error/10"
                  onClick={handleDelete}
                  leftIcon={<Trash2 size={16} />}
                >
                  Remove Share Link
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatedModal>
  );
}

export default ShareTripModal;
