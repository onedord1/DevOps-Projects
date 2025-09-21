// Settings.tsx - Enhanced version
import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  Save, 
  Lock,
  Smartphone,
  CreditCard,
  Moon,
  Sun,
  CheckCircle,
  XCircle
} from 'lucide-react';
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

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
    setSaveSuccess(false);
    setSaveError(false);
    
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
      
      setSaveSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveError(true);
      // Reset error message after 3 seconds
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom toggle component for better UX
  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: () => void; 
    label: string; 
    description: string; 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {description}
        </p>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  // Security action button component
  const SecurityAction = ({ 
    icon: Icon, 
    title, 
    description 
  }: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
  }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm">
        Manage
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage your account and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          {saveSuccess && (
            <div className="flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Saved!</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
              <XCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Error!</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-4">
          <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              error={errors.firstName}
              placeholder="John"
              required
              className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20"
            />

            <Input
              label="Last Name"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              error={errors.lastName}
              placeholder="Doe"
              required
              className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20"
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
            className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20"
          />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 pb-4">
          <CardTitle className="flex items-center text-green-700 dark:text-green-300">
            <Globe className="h-5 w-5 mr-2" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency
              </label>
              <div className="relative">
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 transition-colors appearance-none"
                >
                  {config.SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language & Region
              </label>
              <div className="relative">
                <select
                  value={preferences.locale}
                  onChange={(e) => setPreferences(prev => ({ ...prev, locale: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 transition-colors appearance-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Español</option>
                  <option value="fr-FR">Français</option>
                  <option value="de-DE">Deutsch</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 pb-4">
          <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
            <Palette className="h-5 w-5 mr-2" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                {theme === 'light' ? (
                  <Sun className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Theme
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </p>
              </div>
            </div>
            <Button 
              onClick={toggleTheme} 
              variant="outline"
              className="flex items-center"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Switch to Dark
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Switch to Light
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 pb-4">
          <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-1">
            <ToggleSwitch
              checked={preferences.notifications.email}
              onChange={() => setPreferences(prev => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  email: !prev.notifications.email,
                },
              }))}
              label="Email Notifications"
              description="Receive email updates about your expenses and budgets"
            />

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <ToggleSwitch
              checked={preferences.notifications.push}
              onChange={() => setPreferences(prev => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  push: !prev.notifications.push,
                },
              }))}
              label="Push Notifications"
              description="Get notified about important activity in your browser"
            />

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <ToggleSwitch
              checked={preferences.notifications.budgetAlerts}
              onChange={() => setPreferences(prev => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  budgetAlerts: !prev.notifications.budgetAlerts,
                },
              }))}
              label="Budget Alerts"
              description="Get alerts when you're approaching or exceeding your budgets"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 pb-4">
          <CardTitle className="flex items-center text-red-700 dark:text-red-300">
            <Shield className="h-5 w-5 mr-2" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <SecurityAction
            icon={Lock}
            title="Change Password"
            description="Update your password to keep your account secure"
          />

          <SecurityAction
            icon={Smartphone}
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
          />
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSaveProfile} 
          isLoading={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[140px]"
        >
          <Save size={16} className="mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};