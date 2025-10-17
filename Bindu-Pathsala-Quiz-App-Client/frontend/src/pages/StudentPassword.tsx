import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { PasswordForm } from '@/components/ui/PasswordForm';

const StudentPassword: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Update Password</h1>
          <p className="text-gray-600">Change your account password</p>
        </div>

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
      </div>
    </Layout>
  );
};

export default StudentPassword;
