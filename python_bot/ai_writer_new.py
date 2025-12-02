import json
import os
import datetime
import uuid
import requests
import random

# --- AYARLAR ---
# newsapi.org API Key'ini buraya tekrar yaz:
NEWS_API_KEY = "5514d75aea914e23a986882dfe6fdafe" 

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'blogs.json')

# Aranacak Kelimeler (Daha fazla sonuç için)
KEYWORDS = ["teknoloji", "yapay zeka", "bilim", "yazılım", "internet", "dijital", "uzay"]

def fetch_news():
    # Rastgele bir konu seç
    query = random.choice(KEYWORDS)
    print(f"NewsAPI'de aranıyor: '{query}'...")

    # YÖNTEM DEĞİŞİKLİĞİ: 'top-headlines' yerine 'everything' kullanıyoruz.
    # language=tr : Türkçe haberler
    # sortBy=publishedAt : En yeniler
    url = f"https://newsapi.org/v2/everything?q={query}&language=tr&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
    except Exception as e:
        print(f"Bağlantı hatası: {e}")
        return None

    # Hata Kontrolü
    if data.get("status") != "ok":
        print(f"API Hatası: {data.get('message')}")
        return None

    articles = data.get("articles", [])
    
    if not articles:
        print(f"'{query}' kelimesiyle ilgili haber bulunamadı. Başka kelime deneniyor...")
        # Eğer bulamazsa rekürsif olarak tekrar dene (farklı kelimeyle)
        return fetch_news()

    # İlk uygun haberi seç (Bazen silinmiş haberler gelebilir, kontrol edelim)
    article = None
    for item in articles:
        if item['title'] and item['description'] and item['urlToImage']:
            if "removed" not in item['title'].lower(): # Silinmiş haberleri ele
                article = item
                break
    
    if not article:
        print("Uygun formatta haber bulunamadı.")
        return None

    print(f"HABER BULUNDU: {article['title']}")

    # --- İçerik Düzenleme ---
    # NewsAPI tam metni vermez, özet verir. O yüzden 'Devamını Oku' butonu ekliyoruz.
    content_html = f"""
    <p class="lead"><strong>{article['description']}</strong></p>
    <hr>
    <p>Bu haberin detayları şu an dış kaynaklardan çekilmektedir. Gelişmeler ve haberin tamamı için aşağıdaki kaynağı ziyaret edebilirsiniz.</p>
    
    <h3>Haber Özeti</h3>
    <p>{article['content'] if article['content'] else article['description']}</p>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2563eb;">
        <p><strong>Kaynak:</strong> {article['source']['name']}</p>
        <p><strong>Yazar:</strong> {article['author'] if article['author'] else 'Bilinmiyor'}</p>
        <a href="{article['url']}" target="_blank" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Haberin Kaynağına Git &rarr;</a>
    </div>
    """

    # Kategori belirleme (Aranan kelimeye göre)
    category = "Teknoloji"
    if query in ["uzay", "bilim"]: category = "Bilim"
    elif query == "yapay zeka": category = "Yapay Zeka"

    # Slug oluştur
    clean_title = "".join([c if c.isalnum() else "-" for c in article['title'].lower()])
    slug = clean_title[:60] + "-" + str(uuid.uuid4())[:4]

    new_blog = {
        "id": str(uuid.uuid4()),
        "title": article['title'],
        "slug": slug,
        "category": category,
        "summary": article['description'][:200] + "...",
        "content": content_html,
        "image": article['urlToImage'],
        "tags": [query, "haber", "gündem", "teknoloji"],
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    }

    return new_blog

def save_to_db(blog):
    if not blog: return

    if os.path.exists(DB_PATH):
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                data = []
    else:
        data = []

    # Çift kayıt engelleme (Aynı başlık var mı?)
    if any(b['title'] == blog['title'] for b in data):
        print("Bu haber zaten veritabanında mevcut.")
        return

    data.append(blog)

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("✅ Haber başarıyla siteye eklendi!")

if __name__ == "__main__":
    blog = fetch_news()
    save_to_db(blog)