# YapFun Web Deployment Guide

This repository contains the YapFun web application, which consists of a Next.js frontend and a Node.js/Express backend with GraphQL. This guide will help you deploy the application on Render.

## Project Structure

- `yapfunfe/`: Next.js frontend application
- `yapfunbe/`: Node.js/Express backend with GraphQL
- `ob_v2/`, `obfactory_v2/`, `oracle_v2/`, `yap_escrow_v2/`: Subgraph projects

## Deployment on Render

### Prerequisites

1. A [Render](https://render.com) account
2. Your code pushed to a GitHub repository
3. Access to the necessary API keys and environment variables

### Deployment Steps

#### 1. Backend Deployment

1. Log in to your Render account and navigate to the dashboard
2. Click on "New" and select "Blueprint" to deploy using the render.yaml configuration
3. Connect your GitHub repository
4. Select the repository and click "Apply"
5. Render will automatically detect the `render.yaml` file in the `yapfunbe` directory
6. Review the services to be created:
   - `yapfun-backend`: The Node.js backend service
   - `yapfun-redis`: The Redis service for caching and data storage
7. Click "Apply" to start the deployment

#### 2. Frontend Deployment

1. After the backend is deployed, deploy the frontend using the same process
2. Click on "New" and select "Blueprint"
3. Select the same repository
4. Navigate to the `yapfunfe` directory
5. Render will detect the `render.yaml` file
6. Review the service to be created: `yapfun-frontend`
7. Click "Apply" to start the deployment

#### 3. Environment Variables

The `render.yaml` files include the necessary environment variables, but you may need to update some values:

**Backend Environment Variables:**

- `NODE_ENV`: Set to "production"
- `PORT`: Set to 4000
- `REDIS_URL`: Automatically set by Render
- `RPC_URL`: Blockchain provider URL
- `DEPLOYER_PRIVATE_KEY`: Private key for blockchain interactions
- `ORDERBOOK_SUBGRAPH_URL`, `ORACLE_SUBGRAPH_URL`, `FACTORY_SUBGRAPH_URL`: Subgraph URLs
- `SUPABASE_URL`, `SUPABASE_KEY`: Supabase configuration
- `KAITO_API_URL`: Kaito API URL

**Frontend Environment Variables:**

- `NEXT_PUBLIC_GRAPHQL_URL`: URL of the backend GraphQL endpoint
- `NEXT_PUBLIC_WS_URL`: WebSocket URL for subscriptions
- `NEXT_PUBLIC_SUBGRAPH_URL`: Subgraph URL

### Post-Deployment Configuration

1. **Custom Domains**: If you want to use custom domains, configure them in the Render dashboard for each service.
2. **SSL**: Render automatically provides SSL certificates for all services.
3. **Continuous Deployment**: Render automatically deploys when you push changes to your repository.

## Local Development

To run the application locally:

1. Backend:

   ```bash
   cd yapfunbe
   npm install
   npm run dev
   ```

2. Frontend:
   ```bash
   cd yapfunfe
   npm install
   npm run dev
   ```

## Troubleshooting

- **Redis Connection Issues**: Ensure the Redis URL is correctly configured in the environment variables.
- **CORS Errors**: The backend is configured to allow requests from Render domains. If you're using custom domains, update the CORS configuration.
- **WebSocket Connection Issues**: Ensure the WebSocket URL is correctly configured in the frontend.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Express.js Deployment Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
