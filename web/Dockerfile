FROM oven/bun:1

WORKDIR /app

# Copy package definitions
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start Vite development server with Hot Module Replacement (HMR)
CMD ["bun", "run", "dev"]
