#!/bin/bash
set -e

echo "[System] Initializing environment services..."

# Start dbus if run as root, otherwise run session-wide dbus or ignore
if [ "$(id -u)" = "0" ]; then
    echo "[System] Starting system-wide DBUS..."
    mkdir -p /var/run/dbus
    dbus-uuidgen --ensure
    dbus-daemon --system --fork --readonly || true
else
    echo "[System] Running as non-root user. Starting session DBUS..."
    dbus-launch --sh-syntax --exit-with-session || true
fi

# Start PulseAudio
echo "[System] Starting PulseAudio daemon..."
# Clean up any leftover pulse state/locks
rm -rf /tmp/pulse-* || true
pulseaudio -D --exit-idle-time=-1 --disallow-exit=yes --system=false || true

# Wait for pulseaudio to initialize
sleep 2

# Load null sink module if pulseaudio is running
if pactl info >/dev/null 2>&1; then
    echo "[System] PulseAudio is active. Setting up virtual null-sink..."
    pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=Virtual_Sink || true
    pactl set-default-sink virtual_sink || true
else
    echo "[System] [Warning] PulseAudio is not running. Audio capture may fail."
fi

# Start the Flask app
echo "[System] Starting Flask Application..."
exec python server.py
