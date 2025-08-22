from flask import Blueprint, request, jsonify
from services.employee_service import EmployeeService
from utils.helpers import handle_error
from config import Config
from datetime import datetime

# Use root path with slash instead of empty string
employee_bp = Blueprint('employee', __name__, url_prefix='/')
employee_service = EmployeeService()

# Add a root route for debugging - use '/' instead of ''
@employee_bp.route('/', methods=['GET'])
def index():
    """Root endpoint for the employee API"""
    return jsonify({
        'message': 'Employee API is working',
        'deployment': Config.DEPLOYMENT_NAME,
        'url_prefix': employee_bp.url_prefix,
        'endpoints': [
            '/employees',
            '/employees/<id>',
            '/health',
            '/debug'
        ]
    })

# Add a health check endpoint
@employee_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'deployment': Config.DEPLOYMENT_NAME,
        'timestamp': datetime.utcnow().isoformat()
    })

# Add a debug endpoint
@employee_bp.route('/debug', methods=['GET'])
def debug():
    """Debug endpoint to check configuration"""
    return jsonify({
        'deployment_name': Config.DEPLOYMENT_NAME,
        'url_prefix': employee_bp.url_prefix,
        'environment_variables': {
            'DEPLOYMENT_NAME': Config.DEPLOYMENT_NAME
        }
    })

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