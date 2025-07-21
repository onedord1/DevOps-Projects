from flask import Blueprint, request, jsonify
from services.employee_service import EmployeeService
from utils.helpers import handle_error

employee_bp = Blueprint('employee', __name__, url_prefix='/api')
employee_service = EmployeeService()

@employee_bp.route('/employees', methods=['GET'])
def get_employees():
    """Get all employees"""
    try:
        employees = employee_service.get_all_employees()
        return jsonify([employee.to_dict() for employee in employees])
    except Exception as e:
        return handle_error(e)

@employee_bp.route('/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    """Get a specific employee by ID"""
    try:
        employee = employee_service.get_employee_by_id(employee_id)
        return jsonify(employee.to_dict())
    except Exception as e:
        return handle_error(e)

@employee_bp.route('/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    try:
        data = request.get_json()
        employee = employee_service.create_employee(data)
        return jsonify(employee.to_dict()), 201
    except Exception as e:
        return handle_error(e)

@employee_bp.route('/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    """Update an existing employee"""
    try:
        data = request.get_json()
        employee = employee_service.update_employee(employee_id, data)
        return jsonify(employee.to_dict())
    except Exception as e:
        return handle_error(e)

@employee_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Delete an employee"""
    try:
        employee_service.delete_employee(employee_id)
        return jsonify({'message': f'Employee {employee_id} deleted successfully'})
    except Exception as e:
        return handle_error(e)