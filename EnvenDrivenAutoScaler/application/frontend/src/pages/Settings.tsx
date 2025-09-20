import React, { useState } from 'react';
import { User, Bell, Palette, Globe, Shield, Save } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { config } from '../config';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [preferences, setPreferences] = useState({
    currency: user?.preferences?.currency || config.DEFAULT_CURRENCY,
    locale: user?.preferences?.locale || 'en-US',
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? false,
      budgetAlerts: user?.preferences?.notifications?.budgetAlerts ?? true,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsLoading(true);
    try {
      await updateUser({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        preferences: {
          ...user?.preferences,
          currency: preferences.currency,
          locale: preferences.locale,
          notifications: preferences.notifications,
        },
      } as any);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              error={errors.firstName}
              placeholder="John"
              required
            />

            <Input
              label="Last Name"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              error={errors.lastName}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            placeholder="john@example.com"
            required
          />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {config.SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language & Region
              </label>
              <select
                value={preferences.locale}
                onChange={(e) => setPreferences(prev => ({ ...prev, locale: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
                <option value="de-DE">Deutsch</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose your preferred theme: {theme}
              </p>
            </div>
            <Button onClick={toggleTheme} variant="outline">
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Receive email updates about your expenses and budgets
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    email: e.target.checked,
                  },
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get notified about important activity in your browser
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    push: e.target.checked,
                  },
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Budget Alerts
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get alerts when you're approaching or exceeding your budgets
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications.budgetAlerts}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    budgetAlerts: e.target.checked,
                  },
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Change Password
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Update your password to keep your account secure
                </p>
              </div>
              <Button variant="outline">
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveProfile} 
          isLoading={isLoading}
          className="min-w-[120px]"
        >
          <Save size={16} className="mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};