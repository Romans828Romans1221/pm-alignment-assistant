# --- STAGE 1: Build Environment (Guarantees clean install) ---
FROM node:20 AS builder 

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install 

COPY . .
RUN npm run build
    
# --- STAGE 2: Production Environment (Minimal runtime) ---
FROM node:20-slim
    
WORKDIR /usr/src/app
    
# Copies ONLY the successfully installed dependencies from Stage 1
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy the built frontend assets
COPY --from=builder /usr/src/app/dist ./dist
    
# Copy application source code (your index.js)
COPY . .
    
ENTRYPOINT [ "node", "index.js" ]