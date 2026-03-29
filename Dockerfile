# --- STAGE 1: Build ---
FROM node:20 AS builder
WORKDIR /usr/src/app

# Install all dependencies (including devDependencies like TypeScript)
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the React frontend (Outputs to /dist)
RUN npm run build

# Build the Node/Express backend (Outputs to /build)
RUN npx tsc

# --- STAGE 2: Production ---
FROM node:20-slim
WORKDIR /usr/src/app

# Install ONLY production dependencies to keep the server lightweight and fast
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built React frontend
COPY --from=builder /usr/src/app/dist ./dist

# Copy the compiled TypeScript backend
COPY --from=builder /usr/src/app/build ./build

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server using the compiled JavaScript
ENTRYPOINT ["node", "build/index.js"]