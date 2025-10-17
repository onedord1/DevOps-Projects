import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { attemptAPI } from '@/services/api';
import { QuizAttempt } from '@/types';
import { ArrowLeft, Eye, Award, Search, X } from 'lucide-react';

export const ViewResults: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    fetchAttempts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAttempts(attempts);
    } else {
      const filtered = attempts.filter(attempt =>
        attempt.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAttempts(filtered);
    }
  }, [attempts, searchTerm]);

  // Handle Escape key to collapse search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchExpanded) {
        setIsSearchExpanded(false);
        if (!searchTerm) {
          setSearchTerm('');
        }
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSearchExpanded, searchTerm]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptAPI.getAll();
      setAttempts(data);
      setFilteredAttempts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Results</h1>
          <p className="text-gray-600">View all quiz attempts and student performance</p>
        </div>

        {/* Collapsible Search Filter */}
        <div className="mb-6">
          <div className="relative flex items-start">
            {/* Collapsed State - Just Icon */}
            {!isSearchExpanded && (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className={`
                  p-3 rounded-xl bg-white border border-gray-200 shadow-sm
                  hover:shadow-md hover:border-gray-300 hover:bg-gray-50
                  transition-all duration-300 ease-in-out
                  group flex items-center justify-center
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
                aria-label="Open search"
              >
                <Search className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              </button>
            )}

            {/* Expanded State - Full Search Bar */}
            <div className={`
              relative overflow-hidden transition-all duration-300 ease-in-out ml-0
              ${isSearchExpanded ? 'w-[28rem] max-w-[calc(100vw-2rem)] opacity-100' : 'w-0 opacity-0'}
            `}>
              <div className={`
                relative rounded-xl bg-white border border-gray-200
                shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-blue-400
                transition-all duration-300 ease-in-out
                ${searchTerm ? 'ring-2 ring-blue-100 border-blue-400' : ''}
              `}>
                {/* Search Icon */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Search className={`
                    h-4 w-4 transition-colors duration-200 ease-in-out
                    ${searchTerm ? 'text-blue-500' : 'text-gray-400'}
                  `} />
                </div>

                {/* Input Field */}
                <Input
                  type="text"
                  placeholder="Search by Student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`
                    pl-10 pr-10 py-3 text-sm border-0 focus:ring-0 focus:outline-none
                    bg-transparent placeholder-gray-400 w-full
                  `}
                  onBlur={() => {
                    // Collapse if no search term after a delay
                    if (!searchTerm) {
                      setTimeout(() => setIsSearchExpanded(false), 150);
                    }
                  }}
                  autoFocus={isSearchExpanded}
                />

                {/* Clear Button */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`
                      absolute right-2 top-1/2 transform -translate-y-1/2
                      p-1 rounded-full bg-gray-100 hover:bg-gray-200
                      transition-all duration-200 ease-in-out
                      hover:scale-110 active:scale-95
                    `}
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>

              {/* Results Counter - positioned within search bar */}
              {!loading && (searchTerm || isSearchExpanded) && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
                  <p className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm">
                    {searchTerm.trim() === ''
                      ? `All ${attempts.length} attempts`
                      : `${filteredAttempts.length} of ${attempts.length} attempts`}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setIsSearchExpanded(false);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium
                                 transition-colors duration-200 underline-offset-2 hover:underline
                                 pointer-events-auto"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">Loading results...</div>
        ) : filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {attempts.length === 0 ? 'No Attempts Yet' : 'No Results Found'}
              </h3>
              <p className="text-gray-600">
                {attempts.length === 0
                  ? 'Student quiz attempts will appear here'
                  : 'Try adjusting your search criteria'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {filteredAttempts.map((attempt) => (
              <Card key={attempt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {attempt.quiz?.title || 'Quiz'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Student: {attempt.user?.name || 'Unknown'} ({attempt.user?.student_id})
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(attempt.status)}`}>
                      {attempt.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-lg font-semibold">
                        {attempt.score !== null ? `${attempt.score.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="text-lg font-semibold">
                        {attempt.quiz?.subject?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Started</p>
                      <p className="text-sm">{formatDate(attempt.started_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Finished</p>
                      <p className="text-sm">
                        {attempt.finished_at ? formatDate(attempt.finished_at) : 'In Progress'}
                      </p>
                    </div>
                  </div>
                  {attempt.status === 'graded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quiz/result/${attempt.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
