# Synapse Docker Setup

This Docker Compose configuration sets up the complete Synapse application stack including:

- **PostgreSQL Database** (Port 5432)
- **Go Backend API** (Port 8080)
- **Next.js Frontend** (Port 3000)
- **Hardhat Blockchain Development** (Port 8545)
- **Redis Cache** (Port 6379)
- **pgAdmin Database Management** (Port 5050)

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Clone the repository and navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Start all services:**

   ```bash
   docker-compose up -d
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Services Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Hardhat Network**: http://localhost:8545
- **pgAdmin**: http://localhost:5050 (admin@synapse.com / admin123)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Development Commands

### Start specific services:

```bash
# Start only database
docker-compose up postgres -d

# Start backend and database
docker-compose up backend postgres -d

# Start all except hardhat
docker-compose up postgres backend frontend redis pgadmin -d
```

### View service logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild services after code changes:

```bash
# Rebuild and restart backend
docker-compose up --build backend -d

# Rebuild and restart frontend
docker-compose up --build frontend -d

# Rebuild all services
docker-compose up --build -d
```

### Database Management:

```bash
# Connect to PostgreSQL directly
docker-compose exec postgres psql -U postgress -d SynapseDB

# Run database migrations (if you have migration files)
docker-compose exec backend ./main migrate

# Backup database
docker-compose exec postgres pg_dump -U postgress SynapseDB > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgress -d SynapseDB
```

### Development Tips:

1. **Hot Reload**: The volumes are mounted for live development. Changes to your code will be reflected without rebuilding the containers.

2. **Environment Variables**: All environment variables are defined in the docker-compose.yml file. You can override them by creating a `.env` file in the same directory.

3. **Database Persistence**: Database data is persisted in Docker volumes, so your data will survive container restarts.

4. **Health Checks**: The services include health checks to ensure they start in the correct order.

## Troubleshooting

### Common Issues:

1. **Port Conflicts**: If you get port binding errors, make sure the ports (3000, 8080, 5432, etc.) are not being used by other applications.

2. **Database Connection Issues**: Wait for the database to be fully initialized before starting dependent services. The health checks should handle this automatically.

3. **Out of Memory**: If builds fail due to memory issues, try increasing Docker's memory allocation.

4. **Permission Issues**: On Linux/Mac, you might need to adjust file permissions:
   ```bash
   sudo chown -R $USER:$USER .
   ```

### Reset Everything:

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up --build -d
```

## Production Deployment

For production deployment, consider:

1. Using environment-specific configuration files
2. Setting up proper secrets management
3. Configuring reverse proxy (nginx)
4. Setting up SSL certificates
5. Implementing monitoring and logging
6. Using Docker Swarm or Kubernetes for orchestration

## Environment Variables

Key environment variables you can customize:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database configuration
- `PINATA_API`, `PINATA_API_SECRET`, `PINATA_JWT_SECRET_ACCESS`: Pinata IPFS configuration
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend

Create a `.env` file in the backend directory to override any variables.
