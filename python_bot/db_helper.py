import pymongo
import os
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv()

def turkish_to_slug(text):
    """Şehir ismini etikete çevirir (ai_writer ile aynı mantıkta)"""
    tr_map = str.maketrans("çğıöşüÇĞIÖŞÜİ", "cgiosuCGIOSUI")
    text = text.translate(tr_map).lower()
    return text.replace(" ", "-").replace("(", "").replace(")", "")

def get_available_cities(bolge_adi, sehir_listesi):
    """
    MongoDB'ye bağlanır, yazılmış şehirleri kontrol eder.
    Geriye sadece yazılmamış (müsait) şehirleri döndürür.
    """
    
    # 1. MongoDB Bağlantısı (.env dosyasından alıyoruz)
    MONGO_URI = os.getenv("MONGO_URI")
    
    if not MONGO_URI:
        print("❌ HATA: .env dosyasında MONGO_URI bulunamadı!")
        return []

    used_tags = set()
    
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client['TravelLogDB']
        collection = db['blogs']
        
        # Sadece 'tags' alanını çekiyoruz (Hız için optimize edildi)
        cursor = collection.find({}, {'tags': 1, '_id': 0})
        
        for doc in cursor:
            if 'tags' in doc:
                for tag in doc['tags']:
                    used_tags.add(tag)
                    
    except Exception as e:
        print("❌ Veritabanı Okuma Hatası:", e)
        return []

    # 2. Şehirleri Kontrol Et
    musait_sehirler = []
    print("\n🔍 Şehir kontrolü yapılıyor (MongoDB)...")

    for sehir in sehir_listesi:
        # Şehir adını sadeleştir (Örn: "Belgrad (Sırbistan)" -> "Belgrad")
        sehir_sade = sehir.split('(')[0].strip()
        # Slug'a çevir (Örn: "Belgrad" -> "belgrad")
        sehir_slug = turkish_to_slug(sehir_sade)

        # Kontrol et: Bu slug daha önce kullanılmış mı?
        if sehir_slug in used_tags:
            print(f"   ❌ Atlandı (Zaten Var): {sehir}")
        else:
            musait_sehirler.append(sehir)
            print(f"   ✅ Müsait: {sehir}")

    return musait_sehirler