# DriveMetrics — Python Backend Kurulum Scripti
# Bu dosyayı backend/ klasöründe çalıştırın:
#   python start_backend.py

import subprocess
import sys
import os

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    req_file = os.path.join(backend_dir, "requirements.txt")

    print("=== DriveMetrics Python Backend ===")
    print(f"Python: {sys.executable}")
    print()

    print("[1/2] Bağımlılıklar yükleniyor...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
    print()

    print("[2/2] FastAPI sunucusu başlatılıyor -> http://localhost:8000")
    print("      Durdurmak için Ctrl+C\n")
    os.chdir(backend_dir)
    subprocess.call([sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()
