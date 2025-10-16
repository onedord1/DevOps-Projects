import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ProfileForm } from '@/components/ui/ProfileForm';
import { ProfileOverview } from '@/components/ui/ProfileOverview';
import { PasswordForm } from '@/components/ui/PasswordForm';
import { Button } from '@/components/ui/Button';
import { Settings, Eye, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  student_id: string;
  role: string;
  batch?: string | null;
  created_at: string;
}

const AdminProfile: React.FC = () => {
  const { user, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'password'>('overview');
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Fetch admin profile if needed
    if (user && user.role === 'admin') {
      setAdminProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        student_id: user.student_id,
        role: user.role,
        batch: user.batch || undefined,
        created_at: user.created_at,
      });
    }
  }, [user]);

  if (!user) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Profile</h1>
          <p className="text-gray-600">Manage your admin account and view your profile information</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Profile Overview
          </Button>
          <Button
            variant={activeTab === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('edit')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Update Profile
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
        {activeTab === 'overview' && (
          <ProfileOverview
            key={`overview-${adminProfile?.phone}-${adminProfile?.address}`}
            userProfile={adminProfile || undefined}
            onEdit={() => setActiveTab('edit')}
          />
        )}

        {activeTab === 'edit' && (
          <ProfileForm
            title="Update Admin Profile"
            description="Update your admin profile information including name, email, phone, and address."
            initialData={{
              name: adminProfile?.name || user?.name || '',
              email: adminProfile?.email || user?.email || '',
              phone: adminProfile?.phone || user?.phone || '',
              address: adminProfile?.address || user?.address || '',
            }}
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

              // Refresh user data from AuthContext
              await refresh();

              // Update local adminProfile state with the submitted data immediately
              // This ensures the overview shows the updated data even if refresh fails
              setAdminProfile(prev => prev ? {
                ...prev,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
              } : null);

              // Also update with refreshed user data if available
              if (user) {
                console.log('AdminProfile: Updating adminProfile with refreshed user data:', user);
                setAdminProfile({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '',
                  address: user.address || '',
                  student_id: user.student_id,
                  role: user.role,
                  batch: user.batch || undefined,
                  created_at: user.created_at,
                });
              }

              console.log('AdminProfile: Updated adminProfile state:', adminProfile);
              console.log('AdminProfile: Current AuthContext user:', user);

              // Force re-render of ProfileOverview by updating the key with current timestamp
              setActiveTab('overview');

              // Also trigger another refresh to ensure AuthContext is fully updated
              setTimeout(async () => {
                await refresh();
              }, 100);
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

              setActiveTab('overview');
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminProfile;
