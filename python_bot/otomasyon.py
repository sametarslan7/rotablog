import schedule
import time
import os
import subprocess
import sys

# --- AYARLAR ---
# Test etmek istediğin saati buraya yaz (Örn: "12:45")
HEDEF_SAAT = "12:42" 

def dosya_yolunu_bul():
    """
    ai_writer.py dosyasının nerede olduğunu otomatik bulur.
    Böylece 'dosya bulunamadı' hatası almazsın.
    """
    # Bu dosyanın (otomasyon.py) bulunduğu klasör
    mevcut_klasor = os.path.dirname(os.path.abspath(__file__))
    
    # 1. İhtimal: ai_writer.py ile yan yanalar mı?
    yol_1 = os.path.join(mevcut_klasor, "ai_writer.py")
    
    # 2. İhtimal: python_bot klasörünün içinde mi?
    yol_2 = os.path.join(mevcut_klasor, "python_bot", "ai_writer.py")
    
    # 3. İhtimal: Bir üst klasördeki python_bot içinde mi?
    yol_3 = os.path.join(os.path.dirname(mevcut_klasor), "python_bot", "ai_writer.py")

    if os.path.exists(yol_1):
        return yol_1
    elif os.path.exists(yol_2):
        return yol_2
    elif os.path.exists(yol_3):
        return yol_3
    else:
        return None

def gorev():
    print("\n-------------------------------------------")
    print(f"⏰ SAAT GELDİ: {time.strftime('%H:%M')}")
    print("🚀 Blog yazarı botu başlatılıyor...")
    
    script_path = dosya_yolunu_bul()
    
    if script_path:
        print(f"📂 Dosya bulundu: {script_path}")
        print("-------------------------------------------\n")
        # Python botunu çalıştır
        subprocess.run([sys.executable, script_path])
        print("\n✅ Görev tamamlandı! Yarın aynı saatte tekrar çalışacak.")
    else:
        print("❌ HATA: ai_writer.py dosyası bulunamadı!")
        print("Lütfen otomasyon.py dosyasını projenin ana klasörüne koyduğundan emin ol.")

def main():
    print("--- 🤖 TRAVELLOG OTOMASYON SİSTEMİ ---")
    
    # Dosya kontrolü (Başlarken kontrol edelim ki sürpriz olmasın)
    yol = dosya_yolunu_bul()
    if yol:
        print(f"✅ Bot dosyası doğrulandı: {os.path.basename(yol)}")
    else:
        print("❌ UYARI: ai_writer.py bulunamadı. Lütfen dosya yerlerini kontrol et.")
        return

    print(f"⏳ Sistem kuruldu. Saat {HEDEF_SAAT} bekleniyor...")
    
    # Zamanlayıcıyı kur
    schedule.every().day.at(HEDEF_SAAT).do(gorev)
    
    # Bekleme döngüsü
    while True:
        schedule.run_pending()
        time.sleep(1) 

if __name__ == "__main__":
    main()