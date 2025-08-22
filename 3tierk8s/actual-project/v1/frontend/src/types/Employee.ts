export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hire_date: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  location: string;
  employee_id: string;
}

export interface Department {
  id: string;
  name: string;
  employeeCount: number;
  color: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  onLeave: number;
}