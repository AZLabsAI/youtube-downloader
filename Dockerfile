FROM node:18-bookworm

# Install system dependencies (Python 3.11, pip, ffmpeg)
# Bookworm (Debian 12) comes with Python 3.11 by default
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verify Python version (should be 3.11+)
RUN python3 --version

# Upgrade pip to latest version
RUN python3 -m pip install --upgrade pip

# Install yt-dlp with latest version
RUN pip3 install --upgrade yt-dlp

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build Next.js application
RUN pnpm build

# Expose port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]

