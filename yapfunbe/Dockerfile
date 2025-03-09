FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build with TypeScript
RUN npm run build || (echo "Build failed. Check TypeScript errors above." && exit 1)

EXPOSE 4000

CMD ["npm", "start"]
