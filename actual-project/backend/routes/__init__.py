# routes/__init__.py
from .employee_routes import employee_bp

def register_routes(app):
    """Register all blueprint routes"""
    app.register_blueprint(employee_bp)