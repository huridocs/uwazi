# Cloud Development Environment

This guide explains how to develop Uwazi in remote cloud environments using GitHub Codespaces or VS Code/Cursor Dev Containers.

## Prerequisites

- [GitHub Codespaces](https://github.com/features/codespaces) account, or
- [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Docker Desktop (for local Dev Containers)

## Opening the Environment

### GitHub Codespaces

1. Navigate to the [Uwazi repository](https://github.com/huridocs/uwazi)
2. Click the green "Code" button
3. Select the "Codespaces" tab
4. Click "Create codespace on [branch]"

**Note:** Elasticsearch requires significant memory (2GB minimum, 4GB allocated in config). Use a Codespaces machine type with at least **8GB RAM** (4-core recommended).

### VS Code / Cursor Dev Containers

1. Clone the repository locally
2. Open the folder in VS Code or Cursor
3. When prompted, click "Reopen in Container"
   - Or use Command Palette: "Dev Containers: Reopen in Container"

## Starting the Application

Once the container finishes building and dependencies are installed:

### 1. Initialize the Database (First Time Only)

```bash
yarn blank-state
```

This creates a blank database state with default configuration. You'll see output from MongoDB and Elasticsearch initialization.

### 2. Start the Development Server

```bash
yarn hot
```

This starts:

- Nodemon dev server with hot reload (port 3000)
- Webpack dev server for frontend hot module replacement
- TypeScript watch mode for type checking

The application will be available at `http://localhost:3000`

### 3. Default Login

```
Username: admin
Password: change this password now
```

## Accessing Services

All infrastructure services are automatically started via Docker Compose and accessible through their published ports:

- **Uwazi App**: http://localhost:3000
- **Elasticsearch**: http://localhost:9200
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432 (user: admin, password: admin)
- **MinIO (S3)**: http://localhost:9000 (API), http://localhost:9001 (Console)
  - Credentials: minioadmin / minioadmin

## Resource Requirements

For smooth development:

- **Minimum**: 8GB RAM, 2 CPU cores, 20GB disk
- **Recommended**: 16GB RAM, 4 CPU cores, 40GB disk

Elasticsearch is the most resource-intensive service, requiring 2GB RAM minimum.

## Running Tests

```bash
# Unit and integration tests
yarn test

# Type checking
yarn check-types

# Lint
yarn lint --type-aware app/

# Format check
yarn prettier --check
```

## Troubleshooting

### Services Not Starting

Check service logs:

```bash
docker-compose logs elasticsearch
docker-compose logs mongo
```

### Out of Memory Errors

Increase Docker memory allocation:

- **Docker Desktop**: Settings → Resources → Memory (set to 8GB+)
- **Codespaces**: Use a larger machine type (8-core or higher)

### Port Already in Use

If you have Uwazi running locally, stop it before starting the dev container, or the ports will conflict.

## Additional Resources

- [Main README](../README.md)
- [Self-Hosted Production Deployment](../SELF_HOSTED_INSTRUCTIONS.md) (different from this dev setup)
- [Uwazi Documentation](https://docs.uwazi.io)
