import http.server
import os
import socket
import socketserver
import subprocess
import sys
import threading
import time
import webbrowser

if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    DIRECTORY = sys._MEIPASS
else:
    DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_free_port(preferred=8000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(('127.0.0.1', preferred))
            return preferred
        except OSError:
            pass
    # If 8000 is occupied, bind to 0 to get an OS-assigned free port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

PORT = get_free_port(8000)

class AppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy console logs in standalone app mode
        pass

def start_server():
    with socketserver.TCPServer(("127.0.0.1", PORT), AppHandler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(0.3)

url = f"http://localhost:{PORT}"

# Try to launch Edge or Chrome in standalone borderless app window (native app look)
browser_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
]

launched = False
for ep in browser_paths:
    if os.path.exists(ep):
        try:
            subprocess.Popen([ep, f"--app={url}"])
            launched = True
            break
        except Exception:
            pass

if not launched:
    webbrowser.open(url)

# Keep background local server alive for the app session
while True:
    time.sleep(1)
