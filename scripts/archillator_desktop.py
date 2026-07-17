"""
ARCHILLATOR Desktop – Markierungstext-Übersetzer für Windows
Hotkey (Standard: Ctrl+Alt+T) → Clipboard lesen → Gemini Flash → Popup

Starten: python scripts/archillator_desktop.py
"""

import json
import os
import sys
import threading
import time
import tkinter as tk
from tkinter import scrolledtext, ttk
from pathlib import Path

import keyboard
import pyperclip
import requests

# ─── DPI-Skalierung ──────────────────────────────────────────────────────────

_SCREEN_DPI: int = 96  # Wird in main() auf echten Wert gesetzt


def _px(pt: float) -> int:
    """Konvertiert Punkt-Größe in physische Pixel (negativer tkinter-Wert = Pixel)."""
    return -int(pt * _SCREEN_DPI / 96)


def _sc(logical: int) -> int:
    """Skaliert einen logischen Pixelwert (96-DPI-Referenz) auf physische Pixel."""
    return int(logical * _SCREEN_DPI / 96)


# ─── Konfiguration ───────────────────────────────────────────────────────────

CONFIG_PATH = Path.home() / ".archillator_config.json"

DEFAULT_CONFIG = {
    "api_key": "",
    "hotkey": "ctrl+alt+c",
    "target_lang": "de",
    "style": "academic",
    "model": "gemini-2.5-flash",
    "auto_copy": False,
}

LANGUAGES = {
    "de": "Deutsch",
    "en": "Englisch",
    "fr": "Französisch",
    "es": "Spanisch",
    "it": "Italienisch",
    "la": "Latein",
    "el": "Griechisch (modern)",
    "grc": "Altgriechisch",
}

STYLES = {
    "academic": "Akademisch",
    "neutral": "Neutral",
    "simple": "Einfach",
    "literal": "Wörtlich",
}


def load_config() -> dict:
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            # Fehlende Keys mit Defaults auffüllen
            for k, v in DEFAULT_CONFIG.items():
                cfg.setdefault(k, v)
            return cfg
        except (json.JSONDecodeError, OSError):
            pass
    return DEFAULT_CONFIG.copy()


def save_config(cfg: dict) -> None:
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


# ─── Prompt-Logik (aus ARCHILLATOR HTML portiert) ────────────────────────────

def get_translation_prompt(text: str, target_lang: str, style: str) -> str:
    lang_name = LANGUAGES.get(target_lang, target_lang)

    style_instructions = {
        "academic": (
            f"Übersetze den folgenden Text ins {lang_name}. "
            "Verwende akademisch-wissenschaftliche Sprache, bewahre Fachterminologie "
            "und halte den formellen Ton des Originals. "
            "Gibt nur die Übersetzung aus, ohne Erklärungen oder Anmerkungen."
        ),
        "neutral": (
            f"Übersetze den folgenden Text ins {lang_name}. "
            "Verwende eine klare, neutrale Sprache. "
            "Gibt nur die Übersetzung aus, ohne Erklärungen oder Anmerkungen."
        ),
        "simple": (
            f"Übersetze den folgenden Text ins {lang_name} in einfacher, "
            "gut verständlicher Sprache. Vereinfache komplexe Ausdrücke wo möglich. "
            "Gibt nur die Übersetzung aus, ohne Erklärungen oder Anmerkungen."
        ),
        "literal": (
            f"Übersetze den folgenden Text so wörtlich wie möglich ins {lang_name}. "
            "Behalte die Satzstruktur des Originals so weit wie möglich bei. "
            "Gibt nur die Übersetzung aus, ohne Erklärungen oder Anmerkungen."
        ),
    }

    instruction = style_instructions.get(style, style_instructions["neutral"])
    return f"{instruction}\n\n{text}"


# ─── Gemini API ──────────────────────────────────────────────────────────────

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
    "/{model}:generateContent?key={api_key}"
)


def translate_with_gemini(text: str, config: dict) -> str:
    api_key = config.get("api_key", "").strip()
    if not api_key:
        raise ValueError("Kein API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.")

    model = config.get("model", "gemini-2.5-flash")
    prompt = get_translation_prompt(text, config["target_lang"], config["style"])

    url = GEMINI_URL.format(model=model, api_key=api_key)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192},
    }

    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unerwartete API-Antwort: {data}") from e


# ─── Einstellungs-Dialog ─────────────────────────────────────────────────────

class SettingsDialog(tk.Toplevel):
    def __init__(self, parent, config: dict, on_save):
        super().__init__(parent)
        self.config_data = config.copy()
        self.on_save = on_save
        self.title("ARCHILLATOR – Einstellungen")
        self.resizable(False, False)
        self.grab_set()
        self._build()
        self._center()

    def _center(self):
        self.update_idletasks()
        w, h = self.winfo_width(), self.winfo_height()
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        self.geometry(f"+{(sw - w) // 2}+{(sh - h) // 2}")

    def _build(self):
        pad = {"padx": 10, "pady": 5}

        tk.Label(self, text="Gemini API-Key:").grid(row=0, column=0, sticky="w", **pad)
        self.api_var = tk.StringVar(value=self.config_data.get("api_key", ""))
        api_entry = tk.Entry(self, textvariable=self.api_var, width=40, show="*")
        api_entry.grid(row=0, column=1, **pad)

        tk.Label(self, text="Hotkey:").grid(row=1, column=0, sticky="w", **pad)
        self.hotkey_var = tk.StringVar(value=self.config_data.get("hotkey", "ctrl+alt+c"))
        tk.Entry(self, textvariable=self.hotkey_var, width=20).grid(row=1, column=1, sticky="w", **pad)

        tk.Label(self, text="Zielsprache:").grid(row=2, column=0, sticky="w", **pad)
        self.lang_var = tk.StringVar(value=self.config_data.get("target_lang", "de"))
        lang_cb = ttk.Combobox(
            self, textvariable=self.lang_var,
            values=list(LANGUAGES.keys()), state="readonly", width=10
        )
        lang_cb.grid(row=2, column=1, sticky="w", **pad)

        tk.Label(self, text="Stil:").grid(row=3, column=0, sticky="w", **pad)
        self.style_var = tk.StringVar(value=self.config_data.get("style", "academic"))
        style_cb = ttk.Combobox(
            self, textvariable=self.style_var,
            values=list(STYLES.keys()), state="readonly", width=12
        )
        style_cb.grid(row=3, column=1, sticky="w", **pad)

        tk.Label(self, text="Modell:").grid(row=4, column=0, sticky="w", **pad)
        self.model_var = tk.StringVar(value=self.config_data.get("model", "gemini-2.5-flash"))
        tk.Entry(self, textvariable=self.model_var, width=25).grid(row=4, column=1, sticky="w", **pad)

        self.autocopy_var = tk.BooleanVar(value=self.config_data.get("auto_copy", False))
        tk.Checkbutton(
            self, text="Übersetzung automatisch kopieren",
            variable=self.autocopy_var
        ).grid(row=5, column=0, columnspan=2, sticky="w", **pad)

        btn_frame = tk.Frame(self)
        btn_frame.grid(row=6, column=0, columnspan=2, pady=10)
        tk.Button(btn_frame, text="Speichern", command=self._save, width=12).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Abbrechen", command=self.destroy, width=12).pack(side="left", padx=5)

    def _save(self):
        self.config_data["api_key"] = self.api_var.get().strip()
        self.config_data["hotkey"] = self.hotkey_var.get().strip()
        self.config_data["target_lang"] = self.lang_var.get()
        self.config_data["style"] = self.style_var.get()
        self.config_data["model"] = self.model_var.get().strip()
        self.config_data["auto_copy"] = self.autocopy_var.get()
        self.on_save(self.config_data)
        self.destroy()


# ─── Übersetzungs-Popup ───────────────────────────────────────────────────────

class TranslationPopup(tk.Toplevel):
    AUTO_CLOSE_MS = 30_000  # 30 Sekunden

    def __init__(self, parent, x: int, y: int, source_text: str, config: dict):
        super().__init__(parent)
        self.config_data = config
        self.source_text = source_text
        self._auto_close_id = None
        self._result_text = ""

        self.title("ARCHILLATOR")
        self.overrideredirect(False)  # Titelleiste behalten für Verschieben
        self.attributes("-topmost", True)
        self.resizable(True, True)
        self.protocol("WM_DELETE_WINDOW", self.close)

        self._build()
        self._position(x, y)

        # Klick außerhalb schließt Popup
        self.bind("<FocusOut>", self._on_focus_out)
        self.bind("<Escape>", lambda e: self.close())

        # Übersetzung in Thread starten
        threading.Thread(target=self._run_translation, daemon=True).start()

    def _build(self):
        self.configure(bg="#1e1e2e")
        self.minsize(_sc(480), _sc(300))

        # Header
        header = tk.Frame(self, bg="#313244", pady=_sc(6))
        header.pack(fill="x")
        tk.Label(
            header, text="  ARCHILLATOR", bg="#313244", fg="#cdd6f4",
            font=("Segoe UI", _px(13), "bold")
        ).pack(side="left")
        tk.Button(
            header, text="×", bg="#313244", fg="#f38ba8",
            relief="flat", font=("Segoe UI", _px(14)), command=self.close,
            cursor="hand2", activebackground="#45475a", activeforeground="#f38ba8",
            borderwidth=0, padx=_sc(8)
        ).pack(side="right")

        # Statuszeile
        self.status_var = tk.StringVar(value="Übersetze…")
        self.status_label = tk.Label(
            self, textvariable=self.status_var,
            bg="#1e1e2e", fg="#a6e3a1",
            font=("Segoe UI", _px(11), "italic"), anchor="w", padx=_sc(10), pady=_sc(5)
        )
        self.status_label.pack(fill="x")

        # Trennlinie
        tk.Frame(self, bg="#45475a", height=_sc(1)).pack(fill="x")

        # Textbereich
        text_frame = tk.Frame(self, bg="#1e1e2e")
        text_frame.pack(fill="both", expand=True, padx=_sc(10), pady=_sc(8))

        self.text_widget = scrolledtext.ScrolledText(
            text_frame, wrap=tk.WORD, width=52, height=10,
            bg="#181825", fg="#cdd6f4", insertbackground="#cdd6f4",
            relief="flat", font=("Segoe UI", _px(13)),
            state="disabled"
        )
        self.text_widget.pack(fill="both", expand=True)

        # Footer
        footer = tk.Frame(self, bg="#313244", pady=_sc(8))
        footer.pack(fill="x")

        self.copy_btn = tk.Button(
            footer, text="Kopieren", command=self._copy,
            bg="#89b4fa", fg="#1e1e2e", relief="flat",
            font=("Segoe UI", _px(11), "bold"), padx=_sc(12), cursor="hand2",
            activebackground="#74c7ec", state="disabled"
        )
        self.copy_btn.pack(side="left", padx=_sc(10))

        # Sprache Dropdown
        self.lang_var = tk.StringVar(value=self.config_data.get("target_lang", "de"))
        lang_cb = ttk.Combobox(
            footer, textvariable=self.lang_var,
            values=list(LANGUAGES.keys()), state="readonly", width=6,
            font=("Segoe UI", _px(10))
        )
        lang_cb.pack(side="left", padx=_sc(5))
        lang_cb.bind("<<ComboboxSelected>>", self._retranslate)

        # Stil Dropdown
        self.style_var = tk.StringVar(value=self.config_data.get("style", "academic"))
        style_cb = ttk.Combobox(
            footer, textvariable=self.style_var,
            values=list(STYLES.keys()), state="readonly", width=10,
            font=("Segoe UI", _px(10))
        )
        style_cb.pack(side="left", padx=_sc(5))
        style_cb.bind("<<ComboboxSelected>>", self._retranslate)

    def _position(self, x: int, y: int):
        self.update_idletasks()
        w = self.winfo_reqwidth()
        h = self.winfo_reqheight()
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        px = min(x, sw - w - 10)
        py = min(y + 20, sh - h - 40)
        self.geometry(f"+{max(0, px)}+{max(0, py)}")

    def _set_text(self, text: str):
        self.text_widget.configure(state="normal")
        self.text_widget.delete("1.0", tk.END)
        self.text_widget.insert(tk.END, text)
        self.text_widget.configure(state="disabled")

    def _run_translation(self):
        cfg = self.config_data.copy()
        cfg["target_lang"] = self.lang_var.get()
        cfg["style"] = self.style_var.get()
        try:
            result = translate_with_gemini(self.source_text, cfg)
            self._result_text = result
            self.after(0, self._on_success, result)
        except Exception as e:
            self.after(0, self._on_error, str(e))

    def _on_success(self, text: str):
        self.status_var.set("Fertig")
        self.status_label.configure(fg="#a6e3a1")
        self._set_text(text)
        self.copy_btn.configure(state="normal")
        if self.config_data.get("auto_copy"):
            self._copy()

    def _on_error(self, msg: str):
        self.status_var.set("Fehler")
        self.status_label.configure(fg="#f38ba8")
        self._set_text(f"Fehler: {msg}")

    def _copy(self):
        text = self.text_widget.get("1.0", tk.END).strip()
        if text:
            pyperclip.copy(text)
            self.copy_btn.configure(text="Kopiert!")
            self.after(1500, lambda: self.copy_btn.configure(text="Kopieren"))

    def _retranslate(self, _event=None):
        self.status_var.set("Übersetze…")
        self.status_label.configure(fg="#a6e3a1")
        self._set_text("")
        self.copy_btn.configure(state="disabled")
        threading.Thread(target=self._run_translation, daemon=True).start()

    def _on_focus_out(self, event):
        # Nur schließen wenn Fokus wirklich außerhalb (nicht auf Child-Widget)
        if event.widget == self:
            self.after(100, self._check_focus)

    def _check_focus(self):
        try:
            focused = self.focus_get()
            if focused is None:
                self.close()
        except tk.TclError:
            pass

    def _start_auto_close(self):
        self._auto_close_id = self.after(self.AUTO_CLOSE_MS, self.close)

    def close(self):
        if self._auto_close_id:
            self.after_cancel(self._auto_close_id)
        try:
            self.destroy()
        except tk.TclError:
            pass


# ─── Systemtray ──────────────────────────────────────────────────────────────

def create_tray_icon(app):
    """Systemtray-Icon mit pystray erstellen (läuft in eigenem Thread)."""
    try:
        import pystray
        from PIL import Image, ImageDraw
    except ImportError:
        print("[ARCHILLATOR] pystray/Pillow nicht verfügbar – kein Systemtray.", flush=True)
        return None

    # Kleines blaues "A"-Icon generieren (32×32)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([2, 2, 30, 30], fill="#89b4fa")
    draw.text((9, 6), "A", fill="#1e1e2e")

    def on_settings(_icon, _item):
        app.root.after(0, app.open_settings)

    def on_quit(_icon, _item):
        _icon.stop()
        app.root.after(0, app.quit)

    hotkey_label = f"Hotkey: {app.config['hotkey'].upper()}"
    menu = pystray.Menu(
        pystray.MenuItem("Einstellungen…", on_settings),
        pystray.MenuItem(hotkey_label, None, enabled=False),
        pystray.MenuItem("Beenden", on_quit),
    )
    icon = pystray.Icon("ARCHILLATOR", img, "ARCHILLATOR Desktop", menu)
    threading.Thread(target=icon.run, daemon=True).start()
    return icon


# ─── Haupt-App ───────────────────────────────────────────────────────────────

class TranslatorApp:
    def __init__(self):
        self.config = load_config()
        self.root = tk.Tk()
        self.root.withdraw()  # Hauptfenster unsichtbar
        self._popup: TranslationPopup | None = None
        self._tray = None
        self._setup()

    def _setup(self):
        # Beim ersten Start API-Key abfragen
        if not self.config.get("api_key"):
            self.root.after(200, self._first_run_dialog)
        else:
            self._register_hotkey()
            self._tray = create_tray_icon(self)
            print(
                f"[ARCHILLATOR] Bereit. Hotkey: {self.config['hotkey'].upper()} | "
                f"Sprache: {self.config['target_lang'].upper()} | "
                f"Stil: {self.config['style']}",
                flush=True,
            )
            print("[ARCHILLATOR] Beenden: Ctrl+C oder Tray-Menü → Beenden", flush=True)

    def _first_run_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("ARCHILLATOR – Ersteinrichtung")
        dialog.resizable(False, False)
        dialog.attributes("-topmost", True)

        tk.Label(dialog, text="Willkommen bei ARCHILLATOR Desktop!", font=("Segoe UI", 11, "bold")).pack(padx=20, pady=(15, 5))
        tk.Label(dialog, text="Bitte Gemini API-Key eingeben:").pack(padx=20, pady=5)

        api_var = tk.StringVar()
        entry = tk.Entry(dialog, textvariable=api_var, width=45, show="*")
        entry.pack(padx=20, pady=5)
        entry.focus()

        def save():
            key = api_var.get().strip()
            if key:
                self.config["api_key"] = key
                save_config(self.config)
                dialog.destroy()
                self._register_hotkey()
                self._tray = create_tray_icon(self)
                print(f"[ARCHILLATOR] API-Key gespeichert. Hotkey: {self.config['hotkey'].upper()}", flush=True)
            else:
                tk.Label(dialog, text="API-Key darf nicht leer sein.", fg="red").pack()

        tk.Button(dialog, text="Speichern & Starten", command=save, width=20).pack(pady=10)
        dialog.bind("<Return>", lambda e: save())

        # Fenster zentrieren
        dialog.update_idletasks()
        w, h = dialog.winfo_width(), dialog.winfo_height()
        sw, sh = dialog.winfo_screenwidth(), dialog.winfo_screenheight()
        dialog.geometry(f"+{(sw - w) // 2}+{(sh - h) // 2}")

    def _register_hotkey(self):
        try:
            keyboard.add_hotkey(self.config["hotkey"], self._on_hotkey, suppress=True)
        except Exception as e:
            print(f"[ARCHILLATOR] Hotkey-Fehler: {e}", flush=True)

    def _unregister_hotkey(self):
        try:
            keyboard.remove_all_hotkeys()
        except Exception:
            pass

    def _on_hotkey(self):
        """Wird im keyboard-Thread aufgerufen – Clipboard hier lesen, Fokus liegt noch auf Quellfenster."""
        # Modifier-Tasten des Hotkeys explizit loslassen, damit Ctrl+C sauber ankommt
        for key in ("ctrl", "alt", "shift"):
            try:
                keyboard.release(key)
            except Exception:
                pass
        time.sleep(0.05)
        keyboard.send("ctrl+c")
        time.sleep(0.2)
        try:
            text = pyperclip.paste().strip()
        except Exception:
            text = ""
        if text:
            self.root.after(0, self._show_popup, text)
        else:
            print("[ARCHILLATOR] Kein Text im Clipboard.", flush=True)

    def _show_popup(self, text: str):
        if self._popup and self._popup.winfo_exists():
            self._popup.close()
        try:
            mx, my = self.root.winfo_pointerxy()
        except Exception:
            mx, my = 100, 100
        self._popup = TranslationPopup(self.root, mx, my, text, self.config)

    def open_settings(self):
        def on_save(new_cfg):
            old_hotkey = self.config.get("hotkey")
            self.config = new_cfg
            save_config(self.config)
            if old_hotkey != new_cfg.get("hotkey"):
                self._unregister_hotkey()
                self._register_hotkey()
                print(f"[ARCHILLATOR] Neuer Hotkey: {self.config['hotkey'].upper()}", flush=True)

        SettingsDialog(self.root, self.config, on_save)

    def quit(self):
        self._unregister_hotkey()
        try:
            self.root.quit()
            self.root.destroy()
        except tk.TclError:
            pass
        sys.exit(0)

    def run(self):
        import signal
        # tkinter blockiert SIGINT auf Windows – über Flag + after()-Polling lösen
        self._stop = False

        def _sigint(_sig, _frame):
            self._stop = True

        signal.signal(signal.SIGINT, _sigint)

        def _poll():
            if self._stop:
                self.quit()
            else:
                self.root.after(200, _poll)

        self.root.after(200, _poll)
        self.root.mainloop()


# ─── Einstiegspunkt ──────────────────────────────────────────────────────────

def main():
    global _SCREEN_DPI

    # DPI-Awareness aktivieren damit GetDeviceCaps physische DPI zurückgibt
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass

    # Echten Bildschirm-DPI messen und global speichern
    try:
        import ctypes
        dc = ctypes.windll.user32.GetDC(0)
        _SCREEN_DPI = ctypes.windll.gdi32.GetDeviceCaps(dc, 88)  # LOGPIXELSX
        ctypes.windll.user32.ReleaseDC(0, dc)
        print(f"[ARCHILLATOR] Bildschirm-DPI: {_SCREEN_DPI} ({_SCREEN_DPI * 100 // 96}%)", flush=True)
    except Exception:
        _SCREEN_DPI = 96

    app = TranslatorApp()
    app.run()


if __name__ == "__main__":
    main()
