@echo off
echo Starting RepVolunteers Development Environment...
echo.
echo Hot reload is enabled - changes to source files will automatically restart the server.
echo Press Ctrl+C to stop the development server.
echo.
docker-compose -f docker-compose.dev.yml up --build
