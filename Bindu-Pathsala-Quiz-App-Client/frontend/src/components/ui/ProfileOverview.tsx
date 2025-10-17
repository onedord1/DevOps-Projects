import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit } from 'lucide-react';

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

interface ProfileOverviewProps {
  userProfile?: UserProfile;
  onEdit?: () => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  userProfile,
  onEdit,
}) => {
  const { user } = useAuth();

  // Use userProfile if provided (for admin profile page), otherwise use AuthContext user
  const currentProfile = userProfile || user;

  // Debug logging to track when data changes
  console.log('ProfileOverview render:', {
    userProfile: userProfile,
    user: user,
    currentProfile: currentProfile,
    phone: currentProfile?.phone,
    address: currentProfile?.address
  });

  // Track when userProfile prop changes
  React.useEffect(() => {
    console.log('ProfileOverview: userProfile prop changed:', userProfile);
  }, [userProfile]);

  // Track when AuthContext user changes
  React.useEffect(() => {
    console.log('ProfileOverview: AuthContext user changed:', user);
  }, [user]);

  // Track when currentProfile changes
  React.useEffect(() => {
    console.log('ProfileOverview: currentProfile changed:', currentProfile);
  }, [currentProfile]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (!currentProfile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No profile data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Overview
        </CardTitle>
        <CardDescription>
          Your complete profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg font-semibold">{currentProfile.name}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Student ID</label>
            <p className="text-lg font-semibold">{currentProfile.student_id}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-lg">{currentProfile.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Role</label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentProfile.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentProfile.role === 'admin' ? 'Administrator' : 'Student'}
              </span>
            </div>
          </div>

          {currentProfile.phone && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-lg">{currentProfile.phone}</p>
              </div>
            </div>
          )}

          {currentProfile.batch && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Batch</label>
              <p className="text-lg">{currentProfile.batch}</p>
            </div>
          )}

          {currentProfile.address && (
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <p className="text-lg">{currentProfile.address}</p>
              </div>
            </div>
          )}

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-500">Member Since</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <p className="text-lg">{formatDate(currentProfile.created_at)}</p>
            </div>
          </div>
        </div>

        {onEdit && (
          <div className="flex justify-end pt-4">
            <Button onClick={onEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
