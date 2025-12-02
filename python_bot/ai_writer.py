import json
import os
import datetime
import uuid
import random
import re 
from openai import OpenAI
import urllib.parse 
import pymongo 
from dotenv import load_dotenv 

# --- AYARLARI YÜKLE ---
load_dotenv() 

# --- YARDIMCI DOSYA ---
from db_helper import get_available_cities

# --- API AYARLARI ---
API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=API_KEY)

# --- BÖLGELER ---
BOLGELER = {
    "Balkan Rüyası": [
        "Belgrad (Sırbistan)", "Saraybosna (Bosna Hersek)", "Kotor (Karadağ)", 
        "Üsküp (Makedonya)", "Dubrovnik (Hırvatistan)", "Tiran (Arnavutluk)", 
        "Budva (Karadağ)", "Mostar (Bosna Hersek)", "Ohrid (Makedonya)", 
        "Prizren (Kosova)", "Split (Hırvatistan)", "Sofya (Bulgaristan)", 
        "Bled (Slovenya)"
    ],
    "Doğu Avrupa": [
        "Prag (Çekya)", "Budapeşte (Macaristan)", "Krakow (Polonya)", 
        "Lviv (Ukrayna)", "Varşova (Polonya)", "Bratislava (Slovakya)", 
        "Bükreş (Romanya)", "Riga (Letonya)", "Tallinn (Estonya)", 
        "Vilnius (Litvanya)", "Zagreb (Hırvatistan)", "Ljubljana (Slovenya)"
    ],
    "Batı Avrupa Klasikleri": [
        "Paris (Fransa)", "Amsterdam (Hollanda)", "Berlin (Almanya)", 
        "Viyana (Avusturya)", "Zürih (İsviçre)", "Londra (İngiltere)", 
        "Brüksel (Belçika)", "Münih (Almanya)", "Cenevre (İsviçre)", 
        "Dublin (İrlanda)", "Edinburgh (İskoçya)", "Brugge (Belçika)", 
        "Strazburg (Fransa)", "Hamburg (Almanya)"
    ],
    "Akdeniz Esintisi": [
        "Roma (İtalya)", "Barselona (İspanya)", "Atina (Yunanistan)", 
        "Lizbon (Portekiz)", "Nice (Fransa)", "Venedik (İtalya)", 
        "Floransa (İtalya)", "Madrid (İspanya)", "Valensiya (İspanya)", 
        "Porto (Portekiz)", "Napoli (İtalya)", "Santorini (Yunanistan)", 
        "Valletta (Malta)", "Sevilla (İspanya)", "Marsilya (Fransa)"
    ],
    "Kuzey Amerika": [
        "New York (ABD)", "Los Angeles (ABD)", "Toronto (Kanada)", 
        "Miami (ABD)", "San Francisco (ABD)", "Las Vegas (ABD)", 
        "Chicago (ABD)", "Vancouver (Kanada)", "Montreal (Kanada)", 
        "Meksiko (Meksika)", "Cancun (Meksika)", "Boston (ABD)", 
        "Seattle (ABD)"
    ],
    "Güney Amerika": [
        "Rio de Janeiro (Brezilya)", "Buenos Aires (Arjantin)", "Machu Picchu (Peru)", 
        "Sao Paulo (Brezilya)", "Santiago (Şili)", "Bogota (Kolombiya)", 
        "Lima (Peru)", "Cartagena (Kolombiya)", "Cusco (Peru)", 
        "La Paz (Bolivya)", "Montevideo (Uruguay)", "Medellin (Kolombiya)"
    ],
    "Uzak Doğu": [
        "Tokyo (Japonya)", "Seul (Güney Kore)", "Bangkok (Tayland)", 
        "Bali (Endonezya)", "Kyoto (Japonya)", "Osaka (Japonya)", 
        "Pekin (Çin)", "Şanghay (Çin)", "Singapur (Singapur)", 
        "Hong Kong (Çin)", "Phuket (Tayland)", "Hanoi (Vietnam)", 
        "Ho Chi Minh (Vietnam)", "Kuala Lumpur (Malezya)"
    ],
    "Orta Doğu": [
        "Dubai (BAE)", "Marakeş (Fas)", "Kapadokya (Türkiye)", 
        "Petra (Ürdün)", "İstanbul (Türkiye)", "Kahire (Mısır)", 
        "Beyrut (Lübnan)", "Doha (Katar)", "Abu Dhabi (BAE)", 
        "Şarm El-Şeyh (Mısır)", "Maskat (Umman)", "Amman (Ürdün)", 
        "Tel Aviv (İsrail)", "Kazablanka (Fas)"
    ]
}

BOLGE_LISTESI = list(BOLGELER.keys())

# HTML temizleme fonksiyonu
def clean_html_tags(text):
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

# --- OTOMATİK SEÇİM FONKSİYONU ---
def bolge_sec_otomatik():
    print("\n--- 🤖 OTOMATİK MOD AKTİF ---")
    # Rastgele bir bölge seç
    secilen_bolge = random.choice(BOLGE_LISTESI)
    print(f"✅ Sistem Tarafından Seçilen Bölge: {secilen_bolge}")
    return secilen_bolge

def generate_content(secilen_sehir):
    prompt = f"""
    GÖREV: Sen Türkiye'nin en sevilen seyahat yazarlarından birisin. 
    KONU: {secilen_sehir} Gezi Rehberi.

    ZORUNLU FORMAT (Buna birebir uy):
    [BAŞLIK]
    |||
    [İNGİLİZCE KAPAK GÖRSEL PROMPTU (Sadece burası İngilizce olacak)]
    |||
    [HTML İÇERİK]

    İÇERİK AKIŞI:
    1. (BAŞLIK ATMA) Direkt olarak Slogandan sonra şehrin atmosferini anlatan akıcı bir giriş paragrafı yaz.
    2. {secilen_sehir} Gezilecek En İyi 5 Yer (H3 başlıkları kullan)
    3. Yerel Lezzetler ve Restoran Önerileri
    4. Konaklama ve Ulaşım İpuçları
    5. Yazarın Notu (Kapanış)

    KURALLAR:
    - DİL KURALI: Yazının tamamı, başlıklar, slogan ve maddeler %100 TÜRKÇE olmalıdır.
    - SLOGAN: İçeriğin en başına, o şehri anlatan havalı bir sloganı <p><strong>"Slogan Buraya"</strong></p> etiketiyle TÜRKÇE olarak ekle.
    - BAŞLIKSIZ GİRİŞ: Slogandan sonra hemen <p> etiketiyle metne başla. "Giriş" diye başlık atma.
    - BAŞLIK KURALI: En üstteki [BAŞLIK] kısmına HTML etiketi koyma, sadece düz metin ve TÜRKÇE yaz.
    - GÖRSEL KURALI: Yazının akışı içinde 3 ADET görsel kodu ekle. [IMG: description in english]
    - UZUNLUK: İdeal blog uzunluğunda (1000 kelime civarı) olsun.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": "Sen sadece Türkçe içerik üreten, HTML formatında uzman bir seyahat editörüsün."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("API Hatası:", e)
        return None

def process_inline_images(content):
    matches = re.findall(r'\[IMG: (.*?)\]', content)
    for prompt in matches:
        encoded_prompt = urllib.parse.quote(prompt)
        seed = random.randint(0, 99999)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=500&nologo=true&seed={seed}&model=flux"
        html_img = f'<figure class="inline-image"><img src="{image_url}" alt="{prompt}"><figcaption>{prompt}</figcaption></figure>'
        content = content.replace(f'[IMG: {prompt}]', html_img)
    return content

def blog_yazdir(bolge):
    musait_sehirler = get_available_cities(bolge, BOLGELER[bolge])
    
    if not musait_sehirler:
        print(f"\n⚠️  DİKKAT: '{bolge}' kategorisindeki TÜM şehirler zaten yazılmış!")
        return None
    
    secilen_sehir = random.choice(musait_sehirler)
    print(f"\n📍 Hedef: {secilen_sehir}")

    max_deneme = 3
    deneme = 0
    
    while deneme < max_deneme:
        deneme += 1
        print(f"⏳ İçerik hazırlanıyor... (Deneme {deneme}/{max_deneme})")
        
        full_text = generate_content(secilen_sehir)
        
        if not full_text: continue

        full_text = full_text.replace("```html", "").replace("```", "")
        parts = full_text.split("|||")

        if len(parts) < 3:
            print("⚠️ Format hatası, tekrar deneniyor...")
            continue
        
        content = parts[2].strip()
        
        if len(content) < 2500:
            print(f"❌ Yazı kısa oldu ({len(content)}). Tekrar deneniyor...")
            continue
        
        print(f"✅ Yazı başarıyla üretildi! Uzunluk: {len(content)} karakter.")
        print("🎨 Görseller işleniyor...")
        
        raw_title = parts[0].strip().replace('"', '').replace("Başlık:", "").replace("#", "").replace("[", "").replace("]", "").strip()
        title = clean_html_tags(raw_title) 
        image_prompt = parts[1].strip()

        content = process_inline_images(content)
        content = re.sub(r'^[\s|]+', '', content)
        content = re.sub(r'\[.*?\]', '', content) 
        content = content.replace("Giriş:", "").replace("Özet:", "").replace("Slogan:", "")
        content = re.sub(r'<h[23]>.*?Giriş.*?</h[23]>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'<strong>.*?Giriş.*?</strong>', '', content, flags=re.IGNORECASE)
        content = content.strip()

        encoded_prompt = urllib.parse.quote(image_prompt)
        seed = random.randint(0,99999)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&seed={seed}&model=flux"

        tr_map = str.maketrans("çğıöşüÇĞIÖŞÜİ", "cgiosuCGIOSUI")
        clean_slug = title.translate(tr_map).lower()
        clean_slug = "".join([c if c.isalnum() or c == " " else "" for c in clean_slug])
        slug = clean_slug.strip().replace(" ", "-") + "-" + str(uuid.uuid4())[:4]

        plain_summary = clean_html_tags(content).replace('"', '')[:180] + "..."

        sehir_sade = secilen_sehir.split('(')[0].strip()
        tags = [bolge.lower(), sehir_sade.lower(), "gezi", "blog", "seyahat"]
        tags = [t.replace(" ", "-").replace("ç","c").replace("ı","i").replace("ü","u") for t in tags]

        new_blog = {
            "id": str(uuid.uuid4()),
            "title": title,
            "slug": slug,
            "category": bolge,
            "summary": plain_summary,
            "content": content,
            "image": image_url,
            "tags": tags,
            "date": datetime.datetime.now()
        }
        return new_blog

    print("❌ Başarısız oldu.")
    return None

def save_to_db(blog):
    if not blog: return
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        print("❌ HATA: .env dosyasında MONGO_URI bulunamadı!")
        return
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client['TravelLogDB']
        collection = db['blogs']
        collection.insert_one(blog)
        print(f"\n✅ YAZI MONGODB VERİTABANINA KAYDEDİLDİ!")
        print(f"📝 {blog['title']}")
    except Exception as e:
        print("❌ Veritabanı Kayıt Hatası:", e)

if __name__ == "__main__":
    # ARTIK SORU SORMA YOK, DİREKT OTOMATİK SEÇİYORUZ
    secilen_bolge = bolge_sec_otomatik()
    blog = blog_yazdir(secilen_bolge)
    save_to_db(blog)