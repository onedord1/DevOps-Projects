import { useState } from 'react';
import Dashboard from './components/Dashboard';
import { useEmployees } from './hooks/useEmployees';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import NotificationToast from './components/NotificationToast';

function App() {
  const { 
    employees, 
    loading, 
    error, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    refetch 
  } = useEmployees();
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message, isVisible: true });
  };

  const handleAddEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      await addEmployee(employeeData);
      showNotification('success', 'Employee added successfully!');
    } catch (err) {
      showNotification('error', 'Failed to add employee. Please try again.');
    }
  };

  const handleUpdateEmployee = async (id: string, updatedEmployee: Employee) => {
    try {
      await updateEmployee(id, updatedEmployee);
      showNotification('success', 'Employee updated successfully!');
    } catch (err) {
      showNotification('error', 'Failed to update employee. Please try again.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      showNotification('success', 'Employee deleted successfully!');
    } catch (err) {
      showNotification('error', 'Failed to delete employee. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading employee data..." />
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <>
      <Dashboard
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
      />
      <NotificationToast
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}

export default App;