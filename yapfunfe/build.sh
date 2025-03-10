#!/bin/bash

# Clear yarn cache
yarn cache clean

# Install dependencies using yarn
yarn install --frozen-lockfile

# Explicitly install TypeScript dependencies if needed
yarn add --dev @types/node @types/react @types/react-dom typescript

# Build the Next.js application
yarn build 