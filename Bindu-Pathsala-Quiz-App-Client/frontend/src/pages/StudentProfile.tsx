import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ProfileForm } from '@/components/ui/ProfileForm';
import { PasswordForm } from '@/components/ui/PasswordForm';
import { Button } from '@/components/ui/Button';
import { Settings, Shield } from 'lucide-react';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  if (!user) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and security settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Update Information
          </Button>
          <Button
            variant={activeTab === 'password' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('password')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Update Password
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <ProfileForm
            title="Update Profile Information"
            description="Update your personal information including name, email, phone, and address."
            onSubmit={async (data) => {
              const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
              }
            }}
          />
        )}

        {activeTab === 'password' && (
          <PasswordForm
            onSubmit={async (data) => {
              const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update password');
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default StudentProfile;
