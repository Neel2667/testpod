from flask import Flask, send_from_directory, request, jsonify
import os
import hashlib
import requests
import json
import asyncio
import edge_tts
import threading
import subprocess
import time
import sys
import shutil
import pytchat

app = Flask(__name__, static_folder="static")

# Ensure static and audio directories exist
os.makedirs(os.path.join(app.static_folder, "audio"), exist_ok=True)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route("/audio/<path:path>")
def serve_audio(path):
    return send_from_directory(os.path.join(app.static_folder, "audio"), path)

@app.route("/<path:path>")
def static_files(path):
    # If path exists in static, serve it
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/config", methods=["GET"])
def api_get_config():
    return jsonify({
        "geminiApiKeyConfigured": bool(os.environ.get("GEMINI_API_KEY")),
        "groqApiKeyConfigured": bool(os.environ.get("GROQ_API_KEY"))
    })

@app.route("/api/research", methods=["POST"])
def api_research():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    # Fetch summary from Wikipedia API
    search_url = "https://en.wikipedia.org/w/api.php"
    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": topic,
        "format": "json",
        "utf8": 1
    }
    headers = {
        "User-Agent": "TheHiddenVaultBroadcastEngine/1.0 (contact: info@thehiddenvault.example)"
    }
    try:
        res = requests.get(search_url, params=search_params, headers=headers, timeout=10).json()
        search_results = res.get("query", {}).get("search", [])
        if search_results:
            title = search_results[0]["title"]
            content_params = {
                "action": "query",
                "prop": "extracts",
                "exintro": True,
                "explaintext": True,
                "redirects": 1,
                "titles": title,
                "format": "json"
            }
            content_res = requests.get(search_url, params=content_params, headers=headers, timeout=10).json()
            pages = content_res.get("query", {}).get("pages", {})
            for page_id in pages:
                extract = pages[page_id].get("extract", "")
                if extract:
                    return jsonify({
                        "title": title,
                        "research": extract
                    })
        return jsonify({
            "title": topic,
            "research": f"No declassified logs or detailed documents found in online archives for: {topic}. Relying on internal synthesis database."
        })
    except Exception as e:
        print("Research fetch error:", e)
        return jsonify({
            "title": topic,
            "research": f"Failed to connect to online databases for {topic}. Error: {str(e)}"
        })


def query_gemini(prompt, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print("Gemini API error:", response.status_code, response.text)
            return None
    except Exception as e:
        print("Gemini query exception:", e)
        return None

def query_groq(prompt, api_key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "response_format": { "type": "json_object" },
        "messages": [
            {
                "role": "system",
                "content": "You are a podcast scriptwriter. You must output a JSON object with a single root key 'script' containing a list of script entries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            print("Groq API error:", response.status_code, response.text)
            return None
    except Exception as e:
        print("Groq query exception:", e)
        return None

def parse_script_json(raw_text):
    if not raw_text:
        return None
    try:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
            
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            for key in ["script", "lines", "dialogue"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
            return list(data.values())[0] if data.values() else []
        return []
    except Exception as e:
        print("Failed to parse script JSON:", e)
        print("Raw text was:", raw_text)
        return None

@app.route("/api/generate-script", methods=["POST"])
def api_generate_script():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    research = data.get("research", "").strip()
    guest_name = data.get("guestName", "Dr. Vasquez")
    
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
        
    prompt = f"""
Write a professional, dramatic, declassified-style podcast dialogue script of 8 to 12 lines between 'Host' (Marcus Blackwell) and 'Guest' ({guest_name}) about the topic: "{topic}".
Research notes to base dialogue on:
{research}

You MUST output your response strictly as a JSON array of dialogue lines. No introduction or markdown blocks. Each dialogue line must follow this schema:
{{
  "speaker": "Host" or "Guest",
  "text": "Detailed dialog spoken by the host or guest.",
  "ticker_text": "Short scrolling ticker line (e.g. BREAKING: ... or REPORT: ...).",
  "info_card": "Summary of points separated by newlines (e.g., 'Point A\\nPoint B\\nPoint C').",
  "segment": 2, 3, 4, or 5 (Do NOT use 1. Increment this naturally from 2 to 5 across the script lines),
  "center_visual": {{
    "type": "bullets", "stat", "quote", "diagram", "timeline", or "comparison",
    "title": "A short visual card title",
    "bullets": ["Point 1", "Point 2", ...] (only if type is bullets or diagram),
    "stat": {{ "value": "e.g. 85%", "label": "e.g. Growth Rate", "sub": "e.g. Since 2020" }} (only if type is stat),
    "quote": {{ "text": "A powerful quote text", "author": "e.g. Marcus Blackwell" }} (only if type is quote),
    "comparison": {{ "left": "Fact", "leftLabel": "description", "right": "Myth", "rightLabel": "description" }} (only if type is comparison),
    "timeline": [ {{ "year": "2024", "event": "Observation" }} ] (only if type is timeline),
    "accent": "blue", "purple", "green", "orange", or "red"
  }}
}}

Make sure the dialogue matches a TV broadcast script:
- Segment 2: Episode Hook / Promo (Host introduces the topic and gives a sneak peek)
- Segment 3: Main Discussion (Host and Guest discuss the research notes in detail)
- Segment 4: Outro Credits (Host wraps up, thanks the guest, and gives credits)
- Segment 5: End Channel Promo (Host asks listeners to subscribe and promos next week's episode)
Keep the dialogue concise but filled with facts from the research. Ensure all 4 segments (2 to 5) are covered chronologically. Do NOT output a segment 1 line.
"""
    # Check for keys in payload or environment variables
    gemini_key = data.get("geminiApiKey", "").strip() or os.environ.get("GEMINI_API_KEY")
    groq_key = data.get("groqApiKey", "").strip() or os.environ.get("GROQ_API_KEY")
    
    raw_response = None
    if gemini_key:
        print("[AI Backend] Generating script using Gemini 2.5 Flash...")
        raw_response = query_gemini(prompt, gemini_key)
    elif groq_key:
        print("[AI Backend] Generating script using Groq Llama 3.3...")
        raw_response = query_groq(prompt, groq_key)
    else:
        print("[AI Backend] No API keys set. Returning status to trigger client-side fallback.")
        return jsonify({"fallback": True, "message": "No API keys (geminiApiKey / groqApiKey) provided. Triggering mock fallback."})
        
    script = parse_script_json(raw_response)
    if script:
        return jsonify({"script": script})
    else:
        return jsonify({"fallback": True, "message": "Failed to generate or parse script from AI API. Triggering fallback."})

async def run_tts(text, voice, rate, pitch, filepath):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(filepath)

@app.route("/api/tts", methods=["POST"])
def api_tts():
    data = request.json or {}
    text = data.get("text", "").strip()
    voice = data.get("voice", "en-US-GuyNeural")
    rate = data.get("rate", "+0%")
    pitch = data.get("pitch", "+0Hz")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    # Generate unique hash for cache
    hash_input = f"{text}_{voice}_{rate}_{pitch}"
    filename = hashlib.md5(hash_input.encode("utf-8")).hexdigest() + ".mp3"
    filepath = os.path.join(app.static_folder, "audio", filename)
    audio_url = f"/audio/{filename}"
    
    # If already exists and is non-empty, return cached path.
    # Otherwise delete 0-byte file and regenerate it.
    if os.path.exists(filepath):
        if os.path.getsize(filepath) > 0:
            return jsonify({"audioUrl": audio_url})
        else:
            try:
                os.remove(filepath)
            except Exception as rm_ex:
                print("Failed to remove 0-byte audio file:", rm_ex)
        
    # Otherwise run edge-tts to generate it
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            import threading
            exception_holder = []
            def thread_target():
                try:
                    asyncio.run(run_tts(text, voice, rate, pitch, filepath))
                except Exception as ex:
                    exception_holder.append(ex)
            t = threading.Thread(target=thread_target)
            t.start()
            t.join()
            if exception_holder:
                raise exception_holder[0]
        else:
            loop.run_until_complete(run_tts(text, voice, rate, pitch, filepath))
            
        # Verify that the generated file is actually non-empty
        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            raise RuntimeError("Generated audio file is missing or empty")
            
        return jsonify({"audioUrl": audio_url})
    except Exception as e:
        print("TTS Generation failed:", e)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as rm_ex:
                print("Failed to clean up failed audio file:", rm_ex)
        return jsonify({"error": "TTS synthesis failed", "details": str(e)}), 500

# ═══════════ YOUTUBE LIVE CHAT SCRAPER ═══════════
chat_lock = threading.Lock()
chat_comments = []
chat_active = False
chat_thread = None

def chat_scrape_worker(video_id):
    global chat_comments, chat_active
    print(f"[Chat Worker] Starting live chat scraper for video: {video_id}")
    try:
        chat = pytchat.create(video_id=video_id)
        while chat_active and chat.is_alive():
            for c in chat.get().sync_items():
                comment = {
                    "id": c.id,
                    "user": c.author.name,
                    "text": c.message,
                    "avatarColor": "#0071E3"
                }
                with chat_lock:
                    chat_comments.append(comment)
            time.sleep(1)
    except Exception as e:
        print(f"[Chat Worker] Error: {e}")
    finally:
        print("[Chat Worker] Scraper thread terminated")

@app.route("/api/youtube-chat/start", methods=["POST"])
def api_chat_start():
    global chat_thread, chat_comments, chat_active
    data = request.json or {}
    video_id = data.get("videoId", "").strip()
    if not video_id:
        return jsonify({"error": "No Video ID provided"}), 400
        
    with chat_lock:
        chat_comments = []
        chat_active = True
        if chat_thread and chat_thread.is_alive():
            # Already running, do not restart
            return jsonify({"status": "active", "videoId": video_id})
            
        chat_thread = threading.Thread(target=chat_scrape_worker, args=(video_id,), daemon=True)
        chat_thread.start()
        
    return jsonify({"status": "active", "videoId": video_id})

@app.route("/api/youtube-chat/poll", methods=["GET"])
def api_chat_poll():
    global chat_comments
    with chat_lock:
        comments = list(chat_comments)
        chat_comments = []  # Clear buffer on poll
    return jsonify({"comments": comments})

@app.route("/api/youtube-chat/stop", methods=["POST"])
def api_chat_stop():
    global chat_active
    with chat_lock:
        chat_active = False
    return jsonify({"status": "stopped"})


# ═══════════ DIRECT HEADLESS STREAMING ═══════════
stream_lock = threading.Lock()
stream_state = {
    "active": False,
    "start_time": None,
    "xvfb_proc": None,
    "chromium_proc": None,
    "ffmpeg_proc": None,
    "rtmp_url": "",
    "stream_key": ""
}
ffmpeg_log_buffer = []
ffmpeg_log_lock = threading.Lock()

def monitor_ffmpeg_output(proc):
    global ffmpeg_log_buffer
    # Keep reading from ffmpeg output
    for line in iter(proc.stdout.readline, ""):
        cleaned = line.strip()
        if cleaned:
            with ffmpeg_log_lock:
                ffmpeg_log_buffer.append(cleaned)
                if len(ffmpeg_log_buffer) > 100:
                    ffmpeg_log_buffer.pop(0)

def stop_stream_headless():
    global stream_state
    print("[Streaming] Shutting down headless stream...")
    
    # 1. Terminate FFmpeg
    if stream_state["ffmpeg_proc"]:
        try:
            stream_state["ffmpeg_proc"].terminate()
            stream_state["ffmpeg_proc"].wait(timeout=2)
        except Exception:
            try:
                stream_state["ffmpeg_proc"].kill()
            except Exception:
                pass
        stream_state["ffmpeg_proc"] = None

    # 2. Terminate Chromium
    if stream_state["chromium_proc"]:
        try:
            stream_state["chromium_proc"].terminate()
            stream_state["chromium_proc"].wait(timeout=2)
        except Exception:
            try:
                stream_state["chromium_proc"].kill()
            except Exception:
                pass
        stream_state["chromium_proc"] = None

    # 3. Terminate Xvfb
    if stream_state["xvfb_proc"]:
        try:
            stream_state["xvfb_proc"].terminate()
            stream_state["xvfb_proc"].wait(timeout=2)
        except Exception:
            try:
                stream_state["xvfb_proc"].kill()
            except Exception:
                pass
        stream_state["xvfb_proc"] = None

    # Clean display lock if exists
    if os.path.exists("/tmp/.X11-unix/X99"):
        try:
            os.remove("/tmp/.X11-unix/X99")
        except Exception:
            pass

    stream_state["active"] = False
    stream_state["start_time"] = None
    stream_state["rtmp_url"] = ""
    stream_state["stream_key"] = ""
    print("[Streaming] Headless stream stopped cleanly.")

@app.route("/api/stream/start", methods=["POST"])
def api_stream_start():
    global stream_state, ffmpeg_log_buffer
    data = request.json or {}
    rtmp_url = data.get("rtmpUrl", "").strip()
    stream_key = data.get("streamKey", "").strip()
    
    if not rtmp_url or not stream_key:
        return jsonify({"error": "rtmpUrl and streamKey are required"}), 400

    with stream_lock:
        if stream_state["active"]:
            return jsonify({"error": "Stream is already running"}), 400

        print(f"[Streaming] Initializing stream to {rtmp_url}...")
        with ffmpeg_log_lock:
            ffmpeg_log_buffer = []

        # 1. Start Xvfb (Display :99)
        if not os.path.exists("/tmp/.X11-unix/X99"):
            try:
                stream_state["xvfb_proc"] = subprocess.Popen(
                    ["Xvfb", ":99", "-screen", "0", "1920x1080x24", "-ac", "+extension", "GLX", "+render", "-noreset"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                time.sleep(2)
            except Exception as e:
                print(f"[Streaming] Failed to start Xvfb: {e}")
                return jsonify({"error": f"Failed to start Xvfb: {str(e)}"}), 500
        else:
            print("[Streaming] Xvfb already running on :99")

        # 2. Setup PulseAudio Null-Sink
        try:
            subprocess.run(["pactl", "load-module", "module-null-sink", "sink_name=virtual_sink"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["pactl", "set-default-sink", "virtual_sink"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"[Streaming] PulseAudio null-sink setup warning: {e}")

        # 3. Locate and launch Chromium
        chrome_bin = shutil.which("chromium") or shutil.which("chromium-browser") or shutil.which("google-chrome")
        if not chrome_bin and sys.platform == "darwin":
            chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            if not os.path.exists(chrome_bin):
                chrome_bin = None

        if not chrome_bin:
            print("[Streaming] Error: Chromium browser not found.")
            stop_stream_headless()
            return jsonify({"error": "Chromium browser executable not found"}), 500

        playout_url = "http://localhost:7860/?stream_mode=true"
        chrome_cmd = [
            chrome_bin,
            "--no-sandbox",
            "--disable-gpu",
            "--window-size=1920,1080",
            "--window-position=0,0",
            "--kiosk",
            "--user-data-dir=/tmp/chrome-profile-stream",
            "--autoplay-policy=no-user-gesture-required",
            playout_url
        ]

        print(f"[Streaming] Starting Chromium: {playout_url}")
        env = os.environ.copy()
        env["DISPLAY"] = ":99"
        env["PULSE_SINK"] = "virtual_sink"
        try:
            stream_state["chromium_proc"] = subprocess.Popen(
                chrome_cmd,
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            time.sleep(3)
        except Exception as e:
            print(f"[Streaming] Failed to launch Chromium: {e}")
            stop_stream_headless()
            return jsonify({"error": f"Failed to launch Chromium: {str(e)}"}), 500

        # 4. Start FFmpeg
        target_rtmp = f"{rtmp_url}/{stream_key}"
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-f", "x11grab",
            "-draw_mouse", "0",
            "-video_size", "1920x1080",
            "-framerate", "30",
            "-i", ":99.0",
            "-f", "pulse",
            "-i", "virtual_sink.monitor",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-b:v", "4000k",
            "-maxrate", "4000k",
            "-bufsize", "8000k",
            "-pix_fmt", "yuv420p",
            "-g", "60",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-f", "flv",
            target_rtmp
        ]

        if sys.platform == "darwin":
            print("[Streaming] Darwin detected. Using simulation loopback for FFmpeg.")
            ffmpeg_cmd = [
                "ffmpeg",
                "-f", "lavfi", "-i", "testsrc=size=640x360:rate=30",
                "-f", "lavfi", "-i", "sine=frequency=1000",
                "-c:v", "libx264", "-b:v", "1000k",
                "-c:a", "aac", "-b:a", "64k",
                "-f", "flv",
                target_rtmp
            ]

        try:
            stream_state["ffmpeg_proc"] = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            # Start FFmpeg log monitoring thread
            t = threading.Thread(target=monitor_ffmpeg_output, args=(stream_state["ffmpeg_proc"],), daemon=True)
            t.start()
            
            # Check if FFmpeg is alive after 1 second
            time.sleep(1)
            if stream_state["ffmpeg_proc"].poll() is not None:
                stop_stream_headless()
                return jsonify({"error": "FFmpeg died immediately. Check stream key and RTMP URL."}), 500

        except Exception as e:
            print(f"[Streaming] Failed to launch FFmpeg: {e}")
            stop_stream_headless()
            return jsonify({"error": f"Failed to start FFmpeg: {str(e)}"}), 500

        stream_state["active"] = True
        stream_state["start_time"] = time.time()
        stream_state["rtmp_url"] = rtmp_url
        stream_state["stream_key"] = stream_key

        return jsonify({
            "active": True,
            "message": "Direct cloud stream started successfully."
        })

@app.route("/api/stream/stop", methods=["POST"])
def api_stream_stop():
    with stream_lock:
        stop_stream_headless()
    return jsonify({"active": False, "message": "Stream stopped."})

@app.route("/api/stream/status", methods=["GET"])
def api_stream_status():
    global stream_state, ffmpeg_log_buffer
    with stream_lock:
        active = stream_state["active"]
        uptime = 0
        if active and stream_state["start_time"]:
            uptime = int(time.time() - stream_state["start_time"])
            
        # Check if processes are actually still running
        ffmpeg_alive = stream_state["ffmpeg_proc"] is not None and stream_state["ffmpeg_proc"].poll() is None
        chrome_alive = stream_state["chromium_proc"] is not None and stream_state["chromium_proc"].poll() is None
        
        if active and (not ffmpeg_alive or not chrome_alive):
            # Something died! Auto stop
            print("[Streaming] Detected process crash. Stopping stream.")
            stop_stream_headless()
            active = False
            uptime = 0

        with ffmpeg_log_lock:
            recent_logs = list(ffmpeg_log_buffer[-15:])

        return jsonify({
            "active": active,
            "uptime": uptime,
            "rtmpUrl": stream_state["rtmp_url"],
            "ffmpegRunning": ffmpeg_alive,
            "chromeRunning": chrome_alive,
            "logs": recent_logs
        })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)
