import { Mail, Phone, MapPin, Edit, Trash2, Calendar } from 'lucide-react';
import { Employee } from '../types/Employee';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      Engineering: 'bg-blue-100 text-blue-800',
      Marketing: 'bg-purple-100 text-purple-800',
      Sales: 'bg-green-100 text-green-800',
      HR: 'bg-orange-100 text-orange-800',
      Finance: 'bg-red-100 text-red-800',
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -translate-y-8 translate-x-8 opacity-30" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg relative z-10">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 relative z-10">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-sm text-gray-500 relative z-10">{employee.employee_id}</p>
          </div>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
          <button
            onClick={() => onEdit(employee)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-900">{employee.position}</div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>{employee.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          <span>{employee.phone}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{employee.location}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Hired: {formatDate(employee.hire_date)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(employee.department)} shadow-sm`}>
            {employee.department}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)} shadow-sm`}>
            { employee.status && employee?.status.charAt(0).toUpperCase() + employee.status.slice(1)}
          </span>
        </div>
        <div className="text-sm font-semibold text-gray-900 relative z-10">
          {formatSalary(employee.salary)}
        </div>
      </div>
    </div>
  );
}