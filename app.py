import os
import sys
import io
import time
import json
import csv
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from tkinter import ttk, scrolledtext
import threading
import fitz  # PyMuPDF
import docx
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import PIL.Image
import re
import uuid
import hashlib
import webbrowser
from datetime import datetime

# =========================================================================
# 1. KIỂM TRA THƯ VIỆN & XỬ LÝ LỖI GOOGLE GENAI MỚI NHẤT
# =========================================================================
try:
    from google import genai
    from google.genai import types
    USE_NEW_GENAI_SDK = True
except ImportError:
    import google.generativeai as genai_old
    import warnings
    warnings.filterwarnings("ignore", category=FutureWarning)
    USE_NEW_GENAI_SDK = False

try:
    from gtts import gTTS
    GTTS_READY = True
except ImportError:
    GTTS_READY = False

try:
    import cv2
    CV2_READY = True
except ImportError:
    CV2_READY = False

try:
    import pythoncom
    COM_SUPPORT = True
except ImportError:
    COM_SUPPORT = False

try:
    from docx2pdf import convert
    PDF_ENVIRONMENT_READY = True
except ImportError:
    PDF_ENVIRONMENT_READY = False

if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

chatbot_session = None
current_chat_key_idx = 0

# =========================================================================
# 2. HỆ THỐNG BẢO MẬT & BẢN QUYỀN (HARDWARE LOCK)
# =========================================================================
def get_hardware_id():
    mac = uuid.getnode()
    return hashlib.md5(str(mac).encode()).hexdigest()[:8].upper()

def verify_activation_key(hwid, user_key):
    user_key = user_key.strip().upper()
    if len(user_key) != 16: 
        return False, "Độ dài mã kích hoạt phải đúng 16 ký tự!"
    date_str = user_key[:6]
    checksum = user_key[6:]
    expected_checksum = hashlib.md5((hwid + date_str + "CANVANTRUONG_PRO").encode()).hexdigest()[:10].upper()
    
    if checksum != expected_checksum: 
        return False, "Mã kích hoạt sai cấu trúc mã hóa!"
    try:
        day = int(date_str[:2])
        month = int(date_str[2:4])
        year = int(date_str[4:6]) + 2000
        return True, f"{day:02d}/{month:02d}/{year}"
    except: 
        return False, "Mã ngày tháng trên Key bị lỗi!"

HWID = get_hardware_id()
LICENSE_FILE = "license.key"
PROFILE_FILE = "class_profiles.json"
SETTINGS_FILE = "settings.json"
AUTO_SAVE_FILE = "lich_su_cham_thi_autosave.csv"
exam_results_list = []

def load_settings():
    DEFAULT_PP = [
        "Hành trình Thám hiểm/Cốt truyện", "Dạy học Tích cực", "Dạy học theo Dự án", 
        "Lớp học Đảo ngược", "Dạy học theo Trạm", "Dạy học giải quyết vấn đề (PBL)",
        "Dạy học khám phá (Inquiry-based)", "Bàn tay nặn bột", "WebQuest", "Dạy học theo góc"
    ]
    DEFAULT_KT = [
        "Linh hoạt phối hợp", "Trò chơi hóa (Gamification)", "Khăn trải bàn", "Mảnh ghép", 
        "Động não (Brainstorming)", "Sơ đồ tư duy (Mindmap)", "Kĩ thuật KWL / KWLH",
        "Phòng tranh (Gallery Walk)", "Kĩ thuật Bể cá", "Kĩ thuật 3-2-1"
    ]
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f: 
                return json.load(f)
        except Exception: 
            pass
    return {"pp": DEFAULT_PP, "kt": DEFAULT_KT, "last_run": ""}

def save_settings(data):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f: 
        json.dump(data, f, ensure_ascii=False, indent=4)

if not os.path.exists(PROFILE_FILE):
    default_profiles = {
        "7A1": {
            "mon": "Khoa học Tự nhiên (THCS)", "phan_mon": "Chung", 
            "siso": "45", "nangluc": "Đại trà, nhiều trình độ", 
            "thoiluong": "45 phút (THCS / THPT)", "loaiga": "Giáo án Bài học chuẩn 5512"
        }
    }
    with open(PROFILE_FILE, "w", encoding="utf-8") as f: 
        json.dump(default_profiles, f, ensure_ascii=False, indent=4)

app_settings = load_settings()

def check_license():
    if not os.path.exists(LICENSE_FILE): 
        return False, "Chưa tìm thấy file kích hoạt!"
    try:
        with open(LICENSE_FILE, "r") as f: 
            key = f.read().strip().upper()
        is_valid, exp_str = verify_activation_key(HWID, key)
        if not is_valid: 
            return False, "Mã lưu trên máy không hợp lệ!"
            
        exp_date = datetime.strptime(exp_str, "%d/%m/%Y")
        curr_date = datetime.now()
        settings = load_settings()
        
        if settings.get("last_run"):
            last_run_date = datetime.strptime(settings["last_run"], "%Y-%m-%d").date()
            if curr_date.date() < last_run_date: 
                return False, "Phát hiện lùi thời gian hệ thống!"
                
        settings["last_run"] = curr_date.strftime("%Y-%m-%d")
        save_settings(settings)
        
        if curr_date.date() > exp_date.date(): 
            return False, f"HẾT HẠN vào {exp_str}!"
        return True, f"Bản quyền hợp lệ đến: {exp_str}"
    except Exception as e: 
        return False, str(e)

# =========================================================================
# 3. KHỞI TẠO CỬA SỔ TKINTER PYTHON
# =========================================================================
app = tk.Tk()
app.title("AI Lesson Planner Pro V48 - Bản quyền: Thầy Cấn Văn Trường")
app.geometry("1280x950")

BG_COLOR = "#18181E"
PANEL_COLOR = "#23232C"
TEXT_COLOR = "#E8EAED"
ACCENT_COLOR = "#00D2FF"
BTN_COLOR = "#007ACC"

app.configure(bg=BG_COLOR)

label_title = tk.Label(app, text="AI LESSON PLANNER PRO V48", font=("Segoe UI", 18, "bold"), fg=ACCENT_COLOR, bg=BG_COLOR)
label_title.pack(pady=20)

label_info = tk.Label(
    app, 
    text="Ứng dụng Python Tkinter Desktop\n\nĐể chạy trực tiếp file Python này trên máy tính Windows cá nhân:\n1. Tải toàn bộ thư mục về máy (Export ZIP)\n2. Mở CMD/Terminal và gõ: pip install google-genai pymupdf python-docx pillow opencv-python gTTS\n3. Chạy file bằng lệnh: python app.py", 
    font=("Segoe UI", 12), 
    fg="#FFFFFF", 
    bg=PANEL_COLOR,
    padx=20,
    pady=20,
    justify="left"
)
label_info.pack(padx=20, pady=20, fill="both")

if __name__ == "__main__":
    app.mainloop()
