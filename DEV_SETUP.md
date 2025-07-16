# Development Setup

This guide explains how to set up the RepVolunteers application for development with hot reload functionality.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example` if available)

## Quick Start

### Option 1: Using the batch file (Easiest)

```bash
# Start development environment
.\dev.bat
```

### Option 2: Using PowerShell script (More options)

```powershell
# Start development environment
.\dev.ps1 up

# Other commands
.\dev.ps1 down      # Stop environment
.\dev.ps1 build     # Rebuild image
.\dev.ps1 logs      # View logs
.\dev.ps1 restart   # Restart application
.\dev.ps1 shell     # Open shell in container
```

### Option 3: Direct Docker Compose

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

## Development Features

### Hot Reload

The development environment includes hot reload functionality:

- Changes to files in `src/`, `views/`, `db/`, and `scripts/` directories will automatically restart the server
- No need to rebuild the Docker image for code changes
- Fast feedback loop for development

### Volume Mounts

The following directories are mounted as volumes for hot reload:

- `./src` → `/app/src` (Source code)
- `./views` → `/app/views` (HTML templates)
- `./db` → `/app/db` (Database scripts)
- `./scripts` → `/app/scripts` (Utility scripts)
- `./deno.json` → `/app/deno.json` (Deno configuration)
- `./deno.lock` → `/app/deno.lock` (Dependency lock file)

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Volume Mounts | ✅ Source code mounted | ❌ Code baked into image |
| Auto Restart | ❌ Manual restart only | ✅ `unless-stopped` |
| Watch Mode | ✅ `--watch` flag enabled | ❌ Standard run |
| Image Rebuild | ❌ Not needed for code changes | ✅ Required for updates |

## Troubleshooting

### Port Already in Use

If port 8044 is already in use:

```bash
# Check what's using the port
netstat -ano | findstr :8044

# Stop any existing containers
docker-compose -f docker-compose.dev.yml down
```

### File Permission Issues

If you encounter file permission issues on Windows:

1. Ensure Docker Desktop is running with proper permissions
2. Check that the project directory is accessible to Docker

### Hot Reload Not Working

1. Verify that files are being mounted correctly:

   ```bash
   .\dev.ps1 shell
   ls -la /app/src
   ```

2. Check container logs:

   ```bash
   .\dev.ps1 logs
   ```

### Environment Variables

Make sure your `.env` file is properly configured. The development environment uses the same environment file as production but adds development-specific variables.

## Development Workflow

1. **Start the development environment:**

   ```bash
   .\dev.bat
   ```

2. **Make changes to your code** - The server will automatically restart when you save files.

3. **View logs** to see the restart happening:

   ```bash
   .\dev.ps1 logs
   ```

4. **Access the application** at <http://localhost:8044>

5. **Stop the environment** when done:

   ```bash
   .\dev.ps1 down
   ```

## Performance Tips

- The development image is optimized for fast rebuilds
- Dependencies are cached in Docker layers
- Only source code changes trigger hot reloads, not dependency changes
- If you add new dependencies, rebuild the image: `.\dev.ps1 build`
