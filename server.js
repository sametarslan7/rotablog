const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

// 1. GÜVENLİK: .env dosyasını oku
require('dotenv').config(); 

const app = express();

// 2. MONGODB BAĞLANTISI
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ HATA: .env dosyası bulunamadı veya MONGO_URI eksik!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Bağlantısı Başarılı!"))
    .catch(err => console.error("❌ MongoDB Bağlantı Hatası:", err));

// 3. VERİTABANI MODELİ (ŞEMA)
const blogSchema = new mongoose.Schema({
    id: String,
    title: String,
    slug: String,
    category: String,
    summary: String,
    content: String,
    image: String,
    tags: [String],
    date: Date
});

const Blog = mongoose.model('Blog', blogSchema);

// --- AYARLAR ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// --- ÖZEL REHBER İÇERİKLERİ (KAPAKLAR ONLINE, İÇERİK YEREL) ---
const REHBERLER = {
    'vizesiz-ulkeler': {
        title: "Pasaportu Kap Gel: Vizesiz Gidilebilen En Popüler 5 Ülke",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Vize evraklarıyla uğraşmak, banka hesapları dökmek yok! Sadece uçak biletini alıp, pasaportunu (bazıları için sadece kimliğini) cebine koyup gidebileceğin en güzel rotaları senin için derledik.</p>
            <hr>
            <h3>1. Sırbistan (Belgrad) 🇷🇸</h3>
            <p><strong>Giriş Şartı:</strong> Sadece Yeni Tip Kimlik Kartı Yeterli!</p>
            <p>Tuna ve Sava nehirlerinin buluştuğu, hem hüzünlü tarihi hem de sabaha kadar süren gece hayatıyla ünlü Belgrad, Türk gezginlerin bir numaralı gözdesi. Kalemegdan'da gün batımını izlemeden dönmeyin.</p>
            <img src="/img/belgrad.jpg" alt="Belgrad Manzarası">
            <hr>
            <h3>2. Karadağ (Montenegro) 🇲🇪</h3>
            <p><strong>Giriş Şartı:</strong> Pasaport (Vizesiz 90 Gün)</p>
            <p>Adriyatik'in incisi. Kotor körfezi manzarası karşısında nefesiniz kesilecek. Orta çağdan kalma sokakları, muhteşem plajları ve yeşil doğasıyla tam bir cennet.</p>
            <img src="/img/kotor.jpg" alt="Kotor Karadağ">
            <hr>
            <h3>3. Japonya 🇯🇵</h3>
            <p><strong>Giriş Şartı:</strong> Pasaport (Vizesiz 90 Gün)</p>
            <p>Uzak Doğu'nun teknoloji ve kültür devi. Tokyo'nun neon ışıkları, Kyoto'nun tapınakları ve kiraz çiçekleri... Vizesiz gidilebilecek en uzak ve en büyüleyici rota.</p>
            <img src="/img/japonya.jpg" alt="Japonya Sokakları">
            <hr>
            <h3>4. Bosna Hersek 🇧🇦</h3>
            <p><strong>Giriş Şartı:</strong> Sadece Yeni Tip Kimlik Kartı Yeterli!</p>
            <p>Mostar Köprüsü'nün altından akan nehrin sesini dinleyin. Başçarşı'da Türk kahvesi için ve börek yiyin. Kendinizi evinizde hissedeceğiniz en sıcak ülke.</p>
            <img src="/img/mostar.jpg" alt="Mostar Köprüsü">
        `
    },
    'kamp-rotalari': {
        title: "Yıldızların Altında: Türkiye'nin En İyi Kamp Rotaları",
        image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Şehirden kaçıp doğaya sığınmak isteyenler için Türkiye bir cennet. İşte çadırınızı kurup huzuru bulabileceğiniz en iyi lokasyonlar.</p>
            <h3>1. Kabak Koyu, Fethiye 🌊</h3>
            <p>Babadağ'ın eteklerinde, turkuaz denizin hemen yanı başında. Ulaşımı biraz zor olsa da, vardığınızda karşılaşacağınız manzara ve sessizlik her şeye değer.</p>
            <img src="/img/kabak-koyu.jpg" alt="Fethiye Kamp">
            <h3>2. Yedigöller Milli Parkı, Bolu 🍂</h3>
            <p>Özellikle sonbaharda tam bir renk cümbüşü. Kırmızı, sarı ve turuncunun her tonunu görebilirsiniz. Göl kenarında kamp ateşi yakmak (belirlenen alanlarda) serbest.</p>
            <img src="/img/yedigoller.jpg" alt="Yedigöller">
            <h3>3. Kaçkar Dağları, Rize 🏔️</h3>
            <p>Bulutların üzerinde uyanmak ister misiniz? Yayla havası almak ve gerçek doğa ile buluşmak isteyen profesyonel kampçılar için zirve noktası.</p>
            <img src="/img/kackar.jpg" alt="Kaçkar Dağları">
        `
    },
    'dunya-mutfagi': {
        title: "Lezzet Turu: Ölmeden Önce Denemeniz Gereken 5 Tat",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Seyahat etmenin yarısı görmekse, diğer yarısı tatmaktır. İşte dünya mutfağının ikonik lezzetleri.</p>
            <h3>1. Sushi (Japonya) 🍣</h3>
            <p>Sadece çiğ balık değil, pirincin sanatla buluşmasıdır. Gerçek Wasabi ve soya sosu ile deneyimlenmeli.</p>
            <img src="/img/sushi.jpg" alt="Sushi">
            <h3>2. Pizza Napoletana (İtalya) 🍕</h3>
            <p>Odun ateşinde pişen, kenarları kabarık, ortası incecik. Üzerinde sadece kaliteli domates sosu, mozzarella ve fesleğen.</p>
            <img src="/img/pizza.jpg" alt="Napoli Pizzası">
            <h3>3. Tacos (Meksika) 🌮</h3>
            <p>Küçük mısır ekmeği üzerinde et, salsa sos, avokado ve limon. Sokak lezzetlerinin kralı.</p>
            <img src="/img/tacos.jpg" alt="Tacos">
        `
    },
    'ucuz-ucak': {
        title: "Uçak Biletine Servet Ödemeyin: 5 Altın Kural",
        image: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80",
        content: `
            <h3>1. Gizli Sekme Dostunuzdur 🕵️‍♂️</h3>
            <p>Havayolu siteleri çerezlerinizi izler. Aynı bilete defalarca bakarsanız fiyat artar. Her zaman "Gizli Sekme"den arama yapın.</p>
            <h3>2. Salı ve Çarşamba Uçun 📅</h3>
            <p>İstatistiklere göre haftanın en ucuz uçuşları genellikle hafta ortasında gerçekleşir. Cuma ve Pazar en pahalı günlerdir.</p>
            <img src="/img/havalimani.jpg" alt="Havalimanı">
            <h3>3. "Her Yere" Arama Yapın 🌍</h3>
            <p>Skyscanner gibi sitelerde varış noktasını "Her Yere" seçerek o tarihteki en ucuz ülkeyi bulabilir, sürpriz rotalar keşfedebilirsiniz.</p>
        `
    },
    'interrail': {
        title: "Sırt Çantanı Hazırla: Interrail Başlangıç Rehberi",
        image: "https://images.unsplash.com/photo-1515165592879-1849b8896089?auto=format&fit=crop&w=1200&q=80",
        content: `
            <h3>Tek Biletle Tüm Avrupa</h3>
            <p>Interrail, tek bir tren biletiyle Avrupa'nın 33 ülkesini gezmenizi sağlayan efsanevi bir sistemdir. Otel masrafından kurtulmak için gece trenlerini kullanabilirsiniz.</p>
            <img src="/img/tren.jpg" alt="Avrupa Tren">
            <h3>Rotanızı Önceden Çizin 🗺️</h3>
            <p>Her ne kadar spontane gezmek güzel olsa da, popüler hatlarda (Örn: Paris-Amsterdam) yer bulmak zor olabilir. Rezervasyon şartlarını kontrol edin.</p>
        `
    }
};

// --- ROTALAR (MONGODB & ASYNC/AWAIT) ---

// 1. ANASAYFA
app.get('/', async (req, res) => {
    try {
        let searchQuery = req.query.search || '';
        let categoryQuery = req.query.category || '';
        
        // Veritabanı Sorgusu Hazırla
        let query = {};
        
        // Kategori Filtresi
        if (categoryQuery) {
            query.category = categoryQuery;
        }

        // Arama Filtresi (Başlık veya Etiketlerde Ara)
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { tags: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Sayfalama Ayarları
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const totalBlogs = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalBlogs / limit);

        // Blogları Getir
        const blogs = await Blog.find(query)
                                .sort({ date: -1 }) // En yeniden eskiye
                                .skip((page - 1) * limit)
                                .limit(limit);

        // Slider İçin Rastgele 3 Yazı (Sadece anasayfada ve arama yoksa)
        let featured = [];
        if (!searchQuery && !categoryQuery && page === 1) {
            // MongoDB'den rastgele 3 kayıt seç
            featured = await Blog.aggregate([{ $sample: { size: 3 } }]);
        }

        // Sidebar için Etiketler (Son 50 yazıdan alıp biriktir)
        const recentBlogs = await Blog.find().limit(50).select('tags');
        const allTags = new Set();
        recentBlogs.forEach(b => b.tags.forEach(t => allTags.add(t)));

        res.render('index', {
            title: "TravelLog | Dünyayı Keşfet",
            featured: featured,
            blogs: blogs,
            searchQuery: searchQuery,
            activeCategory: categoryQuery,
            currentPage: page,
            totalPages: totalPages,
            tags: Array.from(allTags).slice(0, 10) 
        });

    } catch (error) {
        console.error("Anasayfa Hatası:", error);
        res.status(500).send("Sunucu hatası oluştu.");
    }
});

// 2. DETAY SAYFASI
app.get('/blog/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });

        if (blog) {
            res.render('post', {
                title: `${blog.title} - Gezi Rehberi`,
                blog: blog,
                searchQuery: '',
                activeCategory: '',
                currentPage: 1
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error("Detay Sayfası Hatası:", error);
        res.redirect('/');
    }
});

// 3. REHBER SAYFALARI (Statik Veri - REHBERLER objesinden)
app.get('/rehber/:page', (req, res) => {
    const pageKey = req.params.page;
    const guideData = REHBERLER[pageKey];

    if (guideData) {
        res.render('guide', {
            title: guideData.title + " | Gezginin Çantası",
            guide: guideData,
            searchQuery: '',
            activeCategory: '',
            currentPage: 1
        });
    } else {
        res.redirect('/');
    }
});

// 4. SABİT SAYFALAR (Hakkımda, İletişim)
app.get('/sayfa/:page', (req, res) => {
    const pageName = req.params.page; 
    res.render('page', { 
        title: pageName.toUpperCase() + " | TravelLog", 
        page: pageName,
        searchQuery: '',
        activeCategory: '',
        currentPage: 1
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✈️  Seyahat Blogu Yayında: http://localhost:${PORT}`);
});