from models import db, Employee
from utils.helpers import ValidationError

class EmployeeService:
    """Service class for employee operations"""
    
    def get_all_employees(self):
        """Get all employees"""
        return Employee.query.all()
    
    def get_employee_by_id(self, employee_id):
        """Get an employee by ID"""
        employee = Employee.query.get(employee_id)
        if not employee:
            raise ValidationError(f"Employee with ID {employee_id} not found", 404)
        return employee
    
    def create_employee(self, data):
        """Create a new employee"""
        # Validate required fields
        if not data.get('first_name') or not data.get('last_name') or not data.get('email'):
            raise ValidationError("First name, last name, and email are required", 400)
        
        # Check if email already exists
        if Employee.query.filter_by(email=data['email']).first():
            raise ValidationError("Email already exists", 400)
        
        # Create new employee
        new_employee = Employee(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            email=data.get('email'),
            phone=data.get('phone', ''),
            position=data.get('position', ''),
            department=data.get('department', ''),
            salary=data.get('salary'),
            hire_date=data.get('hire_date', ''),
            location=data.get('location', ''),
            active=data.get('active', True),
            employee_id=data.get('employee_id', '')
        )
        
        db.session.add(new_employee)
        db.session.commit()
        
        return new_employee
    
    def update_employee(self, employee_id, data):
        """Update an existing employee"""
        employee = self.get_employee_by_id(employee_id)
        
        # Update fields if provided
        if 'first_name' in data:
            employee.first_name = data['first_name']
        if 'last_name' in data:
            employee.last_name = data['last_name']
        if 'email' in data and employee.email != data['email']:
            # Check if new email already exists for another employee
            existing = Employee.query.filter_by(email=data['email']).first()
            if existing and existing.id != employee_id:
                raise ValidationError("Email already exists", 400)
            employee.email = data['email']
        if 'phone' in data:
            employee.phone = data['phone']
        if 'position' in data:
            employee.position = data['position']
        if 'department' in data:
            employee.department = data['department']
        if 'salary' in data:
            employee.salary = data['salary']
        if 'hire_date' in data:
            employee.hire_date = data['hire_date']
        if 'active' in data:
            employee.active = data['active']
        if 'employee_id' in data:
            employee.employee_id = data['employee_id']
        
        db.session.commit()
        
        return employee
    
    def delete_employee(self, employee_id):
        """Delete an employee"""
        employee = self.get_employee_by_id(employee_id)
        db.session.delete(employee)
        db.session.commit()
        return True