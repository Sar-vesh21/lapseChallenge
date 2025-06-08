# Getting Started

This guide will help you set up and run the application locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- TypeScript (TS)
- Node.js
- Docker
- Redis

## Setup Instructions

1. **Install npm packages**

   cd into both the `web` and `api` directories:
   ```bash
   npm install
   ```

1. **Start the Docker Services**
   ```bash
   docker compose up
   ```
   This will start all required services including Redis.

2. **Set Up the Database and Cache**
   Navigate to the API directory:
   ```bash
   cd api
   ```
   Run the setup script to populate the database and warm up the cache:
   ```bash
   npm run setup
   ```

3. **Start the API Server**
   In the API directory, run:
   ```bash
   npm run dev
   ```
   This will start the API server in development mode.

4. **Access the Frontend**
   The frontend application is available at:
   ```
   http://localhost:5173/
   ```

## Troubleshooting

If you encounter any issues:

1. Ensure all Docker containers are running properly
2. Check that Redis is accessible
3. Verify that the API server is running without errors
4. Make sure all required ports are available and not in use

## Additional Information

- The API server runs on the default port
- Redis is configured to run on the standard port
- The frontend development server runs on port 5173
