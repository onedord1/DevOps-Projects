from flask import jsonify

class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def handle_error(error):
    """Handle and format errors for API responses"""
    if isinstance(error, ValidationError):
        response = jsonify({'error': error.message})
        response.status_code = error.status_code
    else:
        response = jsonify({'error': str(error)})
        response.status_code = 500
    return response