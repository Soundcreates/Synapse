FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Hardhat network port
EXPOSE 8545

# Default command
CMD ["npx", "hardhat", "node"]