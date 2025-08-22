# routes/__init__.py
from .employee_routes import employee_bp

def register_routes(app):
    """Register all blueprint routes"""
    print(f"Registering blueprint with URL prefix: {employee_bp.url_prefix}")
    app.register_blueprint(employee_bp)
    print("Blueprint registered successfully")