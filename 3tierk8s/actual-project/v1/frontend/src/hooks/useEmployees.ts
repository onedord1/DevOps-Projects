import { useState, useEffect } from 'react';
import { Employee } from '../types/Employee';
import { EmployeeAPI } from '../utils/api';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeAPI.getAllEmployees();
      // if (data.length > 0){
        setEmployees(data);
      // }
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
      // Fallback to mock data if API fails
      const { mockEmployees } = await import('../data/mockData');
      setEmployees(mockEmployees);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      setError(null);
      const newEmployee = await EmployeeAPI.createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError('Failed to add employee');
      console.error('Error adding employee:', err);
      // Fallback: add locally with generated ID
      const newEmployee: Employee = {
        ...employeeData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      setError(null);
      const updatedEmployee = await EmployeeAPI.updateEmployee(id, employeeData);
      setEmployees(prev => 
        prev.map(emp => emp.id === id ? updatedEmployee : emp)
      );
      return updatedEmployee;
    } catch (err) {
      setError('Failed to update employee');
      console.error('Error updating employee:', err);
      // Fallback: update locally
      setEmployees(prev => 
        prev.map(emp => emp.id === id ? { ...emp, ...employeeData } : emp)
      );
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      setError(null);
      await EmployeeAPI.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      setError('Failed to delete employee');
      console.error('Error deleting employee:', err);
      // Fallback: delete locally
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees
  };
}