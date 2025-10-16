import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentAPI } from '@/services/api';
import { User, StudentStats, UserStatus } from '@/types';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

// Modal Components
const StudentReviewModal: React.FC<{
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ student, isOpen, onClose, onApprove, onReject }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Review Student Registration</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Student ID</label>
            <p className="text-sm text-gray-900">{student.student_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-sm text-gray-900">{student.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-900">{student.email || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <p className="text-sm text-gray-900">{student.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Batch</label>
            <p className="text-sm text-gray-900">{student.batch || 'Not assigned'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Registration Date</label>
            <p className="text-sm text-gray-900">{new Date(student.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => onApprove(student.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            onClick={() => onReject(student.id)}
            variant="destructive"
            className="flex-1"
          >
            <UserX className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};

const UpdatePasswordModal: React.FC<{
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, password: string) => void;
}> = ({ student, isOpen, onClose, onUpdate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(student.id, password);
      onClose();
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
      alert('Failed to update password');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Update Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentViewModal: React.FC<{
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Student Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Student ID</label>
              <p className="text-sm text-gray-900">{student.student_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">{student.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{student.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="text-sm text-gray-900">{student.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Batch</label>
              <p className="text-sm text-gray-900">{student.batch || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center space-x-2 mt-1">
                {student.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                {student.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {student.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  student.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Registration Date</label>
              <p className="text-sm text-gray-900">{new Date(student.created_at).toLocaleDateString()}</p>
            </div>
            {student.address && (
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm text-gray-900">{student.address}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const StudentCard: React.FC<{
  student: User;
  onView: (student: User) => void;
  onApprove?: (student: User) => void;
  onReject?: (student: User) => void;
  onRevokeRejection?: (student: User) => void;
  onUpdatePassword?: (student: User) => void;
  onRevokePermission?: (student: User) => void;
  onDelete?: (student: User) => void;
}> = ({ student, onView, onApprove, onReject, onRevokeRejection, onUpdatePassword, onRevokePermission, onDelete }) => {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">{student.student_id}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
            {getStatusIcon(student.status)}
            <span className="capitalize">{student.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {student.email || 'Not provided'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Phone:</span> {student.phone || 'Not provided'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Batch:</span> {student.batch || 'Not assigned'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Registered:</span> {new Date(student.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={() => onView(student)} className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50">
            <Eye className="w-4 h-4 mr-3" />
            View Details
          </Button>

          {student.status === 'approved' && onUpdatePassword && (
            <Button
              size="sm"
              onClick={() => onUpdatePassword(student)}
              className="w-full justify-center text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <Edit className="w-4 h-4 mr-3" />
              Update Password
            </Button>
          )}

          {student.status === 'approved' && onRevokePermission && (
            <Button variant="destructive" size="sm" onClick={() => onRevokePermission(student)} className="w-full justify-center">
              <UserX className="w-4 h-4 mr-3" />
              Revoke Access
            </Button>
          )}

          {student.status === 'pending' && onApprove && (
            <Button size="sm" onClick={() => onApprove(student)} className="w-full justify-center bg-green-600 hover:bg-green-700">
              <UserCheck className="w-4 h-4 mr-3" />
              Approve Student
            </Button>
          )}

          {student.status === 'pending' && onReject && (
            <Button variant="destructive" size="sm" onClick={() => onReject(student)} className="w-full justify-center">
              <UserX className="w-4 h-4 mr-3" />
              Reject Student
            </Button>
          )}

          {student.status === 'rejected' && onRevokeRejection && (
            <Button size="sm" onClick={() => onRevokeRejection(student)} className="w-full justify-center bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-3" />
              Revoke Rejection
            </Button>
          )}

          {student.status === 'rejected' && onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(student)} className="w-full justify-center">
              <UserX className="w-4 h-4 mr-3" />
              Delete Student
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentAllowance: React.FC = () => {
  const [students, setStudents] = useState<{
    pending: User[];
    approved: User[];
    rejected: User[];
  }>({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserStatus>('pending');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allStudents, statsData] = await Promise.all([
        studentAPI.getAll(),
        studentAPI.getStats(),
      ]);

      // Categorize students by status
      const categorized = {
        pending: allStudents.filter(s => s.status === 'pending'),
        approved: allStudents.filter(s => s.status === 'approved'),
        rejected: allStudents.filter(s => s.status === 'rejected'),
      };

      setStudents(categorized);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      alert('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      await studentAPI.approve(studentId);
      await fetchData();
      // Close the review modal after successful approval
      setReviewModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Failed to approve student:', error);
      alert('Failed to approve student');
    }
  };

  const handleReject = async (studentId: string) => {
    try {
      await studentAPI.reject(studentId);
      await fetchData();
      // Close the review modal after successful rejection
      setReviewModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Failed to reject student:', error);
      alert('Failed to reject student');
    }
  };

  const handleRevokeRejection = async (studentId: string) => {
    try {
      await studentAPI.revokeRejection(studentId);
      await fetchData();
    } catch (error) {
      console.error('Failed to revoke rejection:', error);
      alert('Failed to revoke rejection');
    }
  };

  const handleRevokePermission = async (studentId: string) => {
    try {
      await studentAPI.reject(studentId);
      await fetchData();
      alert('Student permission revoked successfully');
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      alert('Failed to revoke permission');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentAPI.delete(studentId);
        await fetchData();
        alert('Student deleted successfully');
      } catch (error) {
        console.error('Failed to delete student:', error);
        alert('Failed to delete student');
      }
    }
  };

  const handleUpdatePassword = async (studentId: string, newPassword: string) => {
    try {
      await studentAPI.updatePassword(studentId, newPassword);
      alert('Password updated successfully');
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  };

  const openReviewModal = (student: User) => {
    setSelectedStudent(student);
    setReviewModalOpen(true);
  };

  const openPasswordModal = (student: User) => {
    setSelectedStudent(student);
    setPasswordModalOpen(true);
  };

  const openViewModal = (student: User) => {
    setSelectedStudent(student);
    setViewModalOpen(true);
  };

  const closeModals = () => {
    setReviewModalOpen(false);
    setPasswordModalOpen(false);
    setViewModalOpen(false);
    setSelectedStudent(null);
  };

  const getCurrentStudents = () => {
    switch (activeTab) {
      case 'pending': return students.pending;
      case 'approved': return students.approved;
      case 'rejected': return students.rejected;
      default: return [];
    }
  };

  const filteredStudents = getCurrentStudents().filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBatch = !filterBatch || student.batch === filterBatch;

    return matchesSearch && matchesBatch;
  });

  const getUniqueBatches = () => {
    const allBatches = students.pending.concat(students.approved, students.rejected)
      .map(s => s.batch)
      .filter((batch): batch is string => Boolean(batch));
    return Array.from(new Set(allBatches));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading student data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Management
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage student registrations, approvals, and access permissions with comprehensive control
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Pending Review</CardTitle>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</div>
                  <p className="text-sm text-gray-500">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Active Students</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</div>
                  <p className="text-sm text-gray-500">Approved & active</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Rejected</CardTitle>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.rejected}</div>
                  <p className="text-sm text-gray-500">Access denied</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Total Students</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
                  <p className="text-sm text-gray-500">All registered</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              {/* Tab Navigation */}
              <div className="mb-8">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-1">
                    {(['pending', 'approved', 'rejected'] as UserStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all duration-200 ${
                          activeTab === status
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="capitalize">{status}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {students[status].length}
                          </span>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mb-8 flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search students by name, ID, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[140px]"
                  >
                    <option value="">All Batches</option>
                    {getUniqueBatches().map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                  </select>
                  <Button onClick={fetchData} variant="outline" className="px-6 py-3">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Students Grid */}
              {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onView={openViewModal}
                      onApprove={activeTab === 'pending' ? openReviewModal : undefined}
                      onReject={activeTab === 'pending' ? openReviewModal : undefined}
                      onRevokeRejection={activeTab === 'rejected' ? () => handleRevokeRejection(student.id) : undefined}
                      onUpdatePassword={activeTab === 'approved' ? openPasswordModal : undefined}
                      onRevokePermission={activeTab === 'approved' ? () => handleRevokePermission(student.id) : undefined}
                      onDelete={activeTab === 'rejected' ? () => handleDelete(student.id) : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || filterBatch
                      ? 'Try adjusting your search criteria or filters to find students.'
                      : `No students in the ${activeTab} category yet.`
                    }
                  </p>
                </div>
              )}

              {/* Modals */}
              <StudentReviewModal
                student={selectedStudent}
                isOpen={reviewModalOpen}
                onClose={closeModals}
                onApprove={handleApprove}
                onReject={handleReject}
              />

              <UpdatePasswordModal
                student={selectedStudent}
                isOpen={passwordModalOpen}
                onClose={closeModals}
                onUpdate={handleUpdatePassword}
              />

              <StudentViewModal
                student={selectedStudent}
                isOpen={viewModalOpen}
                onClose={closeModals}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
