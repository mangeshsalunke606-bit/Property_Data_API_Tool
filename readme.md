# Property API Tool

## Overview

Property API Tool is a Python-based Flask application designed to provide API endpoints for property management operations. This tool offers a scalable, easy-to-deploy solution for managing property-related data and transactions.

## Features

- RESTful API endpoints for property operations
- SQLite database for data persistence
- Environment-based configuration
- Easy setup and deployment
- Comprehensive logging for debugging

## Project Structure

```
property-api-tool/
├── README.md                 # Project documentation
├── .gitignore               # Git ignore rules
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── app.py                   # Flask application entry point
├── config.py                # Configuration management
├── venv/                    # Virtual environment (auto-created)
├── instance/                # Flask instance folder (auto-created)
│   └── property.db          # SQLite database (auto-created)
├── logs/                    # Application logs (auto-created)
│   └── app.log              # Application log file
├── src/                     # Source code modules
│   ├── __init__.py
│   ├── models.py            # Database models
│   ├── routes.py            # API routes
│   ├── utils.py             # Utility functions
│   └── services.py          # Business logic
└── tests/                   # Test files (optional)
    └── test_api.py
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git
- Virtual environment (recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/property-api-tool.git
cd property-api-tool
```

### 2. Create Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Example .env file:**
```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/property.db
DEBUG=True
LOG_LEVEL=INFO
```

### 5. Run the Application

```bash
flask run
# Application will be available at http://localhost:5000
```

## How It Works

### Application Flow

1. **Initialization**: Flask app initializes with configuration from `.env`
2. **Database Setup**: SQLite database is created/connected in the `instance/` folder
3. **Routes Registration**: API routes are registered from `src/routes.py`
4. **Request Handling**: Incoming requests are processed through Flask routing
5. **Logging**: All operations are logged to `logs/app.log`

### Key Components

- **app.py**: Main Flask application setup
- **config.py**: Environment and configuration management
- **src/models.py**: Database schema and ORM models
- **src/routes.py**: API endpoints definition
- **src/services.py**: Business logic and data operations

## API Usage

### Example Endpoints

```bash
# Get all properties
GET /api/properties

# Get property by ID
GET /api/properties/<id>

# Create new property
POST /api/properties
Content-Type: application/json

{
  "name": "Property Name",
  "address": "123 Main St",
  "price": 500000
}

# Update property
PUT /api/properties/<id>

# Delete property
DELETE /api/properties/<id>
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Virtual Environment Not Activating

**Error**: `'venv' is not recognized` (Windows) or `command not found: venv` (macOS/Linux)

**Solution**:
```bash
# Verify Python installation
python --version

# Recreate virtual environment
rm -rf venv  # or rmdir venv /s on Windows
python -m venv venv

# Activate it
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
```

#### 2. Dependencies Installation Fails

**Error**: `ModuleNotFoundError` or `pip install` fails

**Solution**:
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Reinstall requirements
pip install -r requirements.txt --force-reinstall

# Check installed packages
pip list
```

#### 3. Database Connection Error

**Error**: `sqlite3.OperationalError: unable to open database file`

**Solution**:
```bash
# Ensure instance folder exists
mkdir instance

# Delete corrupted database and restart app
rm instance/property.db

# Reinitialize database (app will recreate it)
flask run
```

#### 4. Port Already in Use

**Error**: `Address already in use` on port 5000

**Solution**:
```bash
# Run on different port
flask run --port 5001

# Or kill process using port 5000
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000 | kill -9 <PID>
```

#### 5. Import Errors

**Error**: `ModuleNotFoundError: No module named 'src'`

**Solution**:
```bash
# Verify you're in the project root directory
pwd  # or cd on Windows

# Verify src/__init__.py exists
ls src/__init__.py

# Reinstall package in development mode
pip install -e .
```

#### 6. Environment Variables Not Loading

**Error**: Configuration values are None or defaults

**Solution**:
```bash
# Verify .env file exists and is in project root
ls -la .env

# Check .env syntax (no spaces around =)
# Correct: KEY=value
# Wrong: KEY = value

# Restart Flask application
# Ctrl+C then run: flask run
```

### Debug Mode

Enable detailed logging and debugging:

```bash
# Set environment variables
export FLASK_ENV=development
export FLASK_DEBUG=1
export LOG_LEVEL=DEBUG

# Run app
flask run
```

Check logs for detailed information:
```bash
tail -f logs/app.log  # macOS/Linux
type logs\app.log     # Windows (or use Notepad)
```

### Useful Debug Commands

```bash
# Test API endpoint
curl http://localhost:5000/api/properties

# Check database
sqlite3 instance/property.db ".tables"

# Verify Python paths
python -c "import sys; print('\n'.join(sys.path))"

# Test module imports
python -c "from src import models; print('Import successful')"
```

## Development

### Running Tests

```bash
pytest tests/ -v
```

### Code Style

```bash
# Format code
black src/

# Lint code
pylint src/
```

## Deployment

### Production Setup

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Use environment-based secrets management
4. Enable HTTPS/SSL
5. Configure logging to external service

### Example with Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Contributing

1. Create a feature branch
2. Make changes and test
3. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review logs in `logs/app.log`

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [REST API Best Practices](https://restfulapi.net/)