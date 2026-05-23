FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.html vite.config.ts tsconfig.json ./
COPY public/ public/
COPY src/ src/
RUN npm run build

FROM python:3.11-slim

# Install system dependencies for headless browser capture and audio loopback
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    pulseaudio \
    pulseaudio-utils \
    dbus-x11 \
    dbus \
    ffmpeg \
    chromium \
    fonts-dejavu \
    fonts-freefont-ttf \
    fonts-liberation \
    fonts-noto \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
RUN pip install --no-cache-dir flask requests edge-tts pytchat

WORKDIR /app

# Copy built frontend static files
COPY --from=build /app/dist /app/static

# Copy server files and startup script
COPY server.py .
COPY start_services.sh .

# Make startup script executable
RUN chmod +x start_services.sh

EXPOSE 7860

# Run services startup script
CMD ["./start_services.sh"]
