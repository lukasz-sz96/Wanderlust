import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { Globe, Lock, MapPin, Monitor, Moon, RefreshCw, Shield, Sun, Trash2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../../lib/hooks/useUserSync';
import { useOnboarding } from '../../lib/hooks/useOnboarding';
import { useTheme } from '../../lib/hooks/useTheme';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, useToast } from '../../components/ui';

const SettingsPage = () => {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const { resetOnboarding } = useOnboarding();
  const { theme, setTheme, mounted } = useTheme();
  const toast = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [dateFormat, setDateFormat] = useState<'mdy' | 'dmy' | 'ymd'>('mdy');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setHomeLocation(user.homeLocation || '');
      setTemperatureUnit(user.preferences?.temperatureUnit || 'celsius');
      setDistanceUnit(user.preferences?.distanceUnit || 'km');
      setDateFormat(user.preferences?.dateFormat || 'mdy');
      setProfileVisibility(user.preferences?.profileVisibility || 'public');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName || undefined,
        bio: bio || undefined,
        homeLocation: homeLocation || undefined,
      });
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
      await updatePreferences({ temperatureUnit, distanceUnit, dateFormat, profileVisibility });
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
              <Avatar src={user?.avatarUrl || undefined} alt={user?.displayName || user?.email || 'User'} size="xl" />
              <div>
                <p className="font-medium text-foreground">{user?.displayName || 'No display name'}</p>
                <p className="text-sm text-muted">{user?.email}</p>
              </div>
            </div>

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-colors"
              />
              <p className="text-xs text-muted mt-1">{bio.length}/300 characters</p>
            </div>

            <div className="relative">
              <Input
                label="Home Location"
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
              <MapPin size={16} className="absolute right-3 top-9 text-muted" />
            </div>

            <Button onClick={handleSaveProfile} isLoading={saving}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
              <p className="text-sm text-muted mb-3">Choose how Wanderlust looks to you</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  <Sun size={18} />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  <Moon size={18} />
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    theme === 'system'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  <Monitor size={18} />
                  System
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Temperature Unit</label>
              <div className="flex gap-2">
                <Button
                  variant={temperatureUnit === 'celsius' ? 'primary' : 'ghost'}
                  onClick={() => setTemperatureUnit('celsius')}
                >
                  Celsius (°C)
                </Button>
                <Button
                  variant={temperatureUnit === 'fahrenheit' ? 'primary' : 'ghost'}
                  onClick={() => setTemperatureUnit('fahrenheit')}
                >
                  Fahrenheit (°F)
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Distance Unit</label>
              <div className="flex gap-2">
                <Button variant={distanceUnit === 'km' ? 'primary' : 'ghost'} onClick={() => setDistanceUnit('km')}>
                  Kilometers (km)
                </Button>
                <Button variant={distanceUnit === 'mi' ? 'primary' : 'ghost'} onClick={() => setDistanceUnit('mi')}>
                  Miles (mi)
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date Format</label>
              <div className="flex gap-2">
                <Button variant={dateFormat === 'mdy' ? 'primary' : 'ghost'} onClick={() => setDateFormat('mdy')}>
                  MM/DD/YYYY
                </Button>
                <Button variant={dateFormat === 'dmy' ? 'primary' : 'ghost'} onClick={() => setDateFormat('dmy')}>
                  DD/MM/YYYY
                </Button>
                <Button variant={dateFormat === 'ymd' ? 'primary' : 'ghost'} onClick={() => setDateFormat('ymd')}>
                  YYYY-MM-DD
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
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Profile Visibility</label>
              <p className="text-sm text-muted mb-3">Control who can see your profile and travel activity</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setProfileVisibility('public')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    profileVisibility === 'public'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  <Globe size={18} />
                  Public
                </button>
                <button
                  onClick={() => setProfileVisibility('private')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    profileVisibility === 'private'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  <Lock size={18} />
                  Private
                </button>
              </div>
            </div>
            <Button onClick={handleSavePreferences} isLoading={saving}>
              Save Privacy Settings
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
              <p className="text-sm text-muted mb-3">View the welcome tour again to learn about Wanderlust features.</p>
              <Button variant="ghost" leftIcon={<RefreshCw size={16} />} onClick={resetOnboarding}>
                Restart Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-error/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <Trash2 size={20} />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Delete Account</p>
              <p className="text-sm text-muted mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="ghost" className="text-error hover:bg-error/10">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
});
