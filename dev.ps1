# Development Docker Compose Script
# This script helps manage the development environment

param(
    [Parameter(Position = 0)]
    [ValidateSet("up", "down", "build", "logs", "restart", "shell")]
    [string]$Action = "up"
)

$dockerComposeFile = "docker-compose.dev.yml"

switch ($Action) {
    "up" {
        Write-Host "Starting development environment with hot reload..." -ForegroundColor Green
        docker-compose -f $dockerComposeFile up --build
    }
    "down" {
        Write-Host "Stopping development environment..." -ForegroundColor Yellow
        docker-compose -f $dockerComposeFile down
    }
    "build" {
        Write-Host "Rebuilding development image..." -ForegroundColor Blue
        docker-compose -f $dockerComposeFile build --no-cache
    }
    "logs" {
        Write-Host "Showing logs..." -ForegroundColor Cyan
        docker-compose -f $dockerComposeFile logs -f
    }
    "restart" {
        Write-Host "Restarting development environment..." -ForegroundColor Magenta
        docker-compose -f $dockerComposeFile restart
    }
    "shell" {
        Write-Host "Opening shell in container..." -ForegroundColor White
        docker-compose -f $dockerComposeFile exec theatreapp sh
    }
    default {
        Write-Host "Usage: .\dev.ps1 [up|down|build|logs|restart|shell]" -ForegroundColor Red
        Write-Host "  up      - Start development environment (default)"
        Write-Host "  down    - Stop development environment"
        Write-Host "  build   - Rebuild development image"
        Write-Host "  logs    - Show container logs"
        Write-Host "  restart - Restart the application"
        Write-Host "  shell   - Open shell in container"
    }
}
