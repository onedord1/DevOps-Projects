# app.py
from flask import Flask, send_from_directory, request
from flask_cors import CORS
import os
from config import Config
from models import db
from routes import register_routes

def create_app(config_class=Config):
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder='build')
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register all routes FIRST (before the catch-all route)
    register_routes(app)
    
    # Print registered routes for debugging
    with app.app_context():
        print("\n=== REGISTERED ROUTES ===")
        for rule in app.url_map.iter_rules():
            print(f"{rule.methods} {rule.rule}")
        print("========================\n")
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Serve React frontend in production - but only for non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Check if this is an API request
        if path.startswith(Config.DEPLOYMENT_NAME + '/'):
            return {'error': 'API endpoint not found'}, 404
        
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    
    return app

# Create a default application instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)