import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../../lib/hooks/useUserSync';
import { useOnboarding } from '../../lib/hooks/useOnboarding';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Avatar,
  useToast,
} from '../../components/ui';
import { RefreshCw } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
});

const SettingsPage = () => {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const { resetOnboarding } = useOnboarding();
  const toast = useToast();

  const [displayName, setDisplayName] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [saving, setSaving] = useState(false);

  // Update state when user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setTemperatureUnit(user.preferences?.temperatureUnit || 'celsius');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName || undefined });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences({ temperatureUnit });
      toast.success('Preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatarUrl || undefined}
                alt={user?.displayName || user?.email || 'User'}
                size="xl"
              />
              <div>
                <p className="font-medium text-foreground">
                  {user?.displayName || 'No display name'}
                </p>
                <p className="text-sm text-muted">{user?.email}</p>
              </div>
            </div>

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />

            <Button onClick={handleSaveProfile} isLoading={saving}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Temperature Unit
              </label>
              <div className="flex gap-2">
                <Button
                  variant={temperatureUnit === 'celsius' ? 'primary' : 'ghost'}
                  onClick={() => setTemperatureUnit('celsius')}
                >
                  Celsius
                </Button>
                <Button
                  variant={temperatureUnit === 'fahrenheit' ? 'primary' : 'ghost'}
                  onClick={() => setTemperatureUnit('fahrenheit')}
                >
                  Fahrenheit
                </Button>
              </div>
            </div>

            <Button onClick={handleSavePreferences} isLoading={saving}>
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Onboarding Tour</p>
              <p className="text-sm text-muted mb-3">
                View the welcome tour again to learn about Wanderlust features.
              </p>
              <Button
                variant="ghost"
                leftIcon={<RefreshCw size={16} />}
                onClick={resetOnboarding}
              >
                Restart Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
