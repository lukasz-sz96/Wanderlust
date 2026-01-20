# Build stage: Install dependencies and build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_CONVEX_URL=http://localhost:3210
ARG VITE_STADIA_API_KEY=
ARG VITE_MAPILLARY_ACCESS_TOKEN=

# Set as environment variables for the build
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_STADIA_API_KEY=$VITE_STADIA_API_KEY
ENV VITE_MAPILLARY_ACCESS_TOKEN=$VITE_MAPILLARY_ACCESS_TOKEN

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (TanStack Start + Nitro builds to .output/)
RUN npm run build

# Production stage: Create minimal runtime image
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 wanderlust

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage (TanStack Start + Nitro output)
COPY --from=builder /app/.output ./.output

# Copy Convex functions for deployment (needed if deploying from container)
COPY --from=builder /app/convex ./convex

# Set ownership to non-root user
RUN chown -R wanderlust:nodejs /app

# Switch to non-root user
USER wanderlust

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application (TanStack Start + Nitro server)
CMD ["node", ".output/server/index.mjs"]
