const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

// 1. GÜVENLİK
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

// 3. VERİTABANI MODELİ
const blogSchema = new mongoose.Schema({
    id: String,
    title: String,
    slug: String,
    category: String,
    summary: String,
    content: String,
    image: String,
    tags: [String],
    date: Date,
    likes: { type: Number, default: 0 },
    comments: [{ name: String, text: String, date: { type: Date, default: Date.now } }],
    views: { type: Number, default: 0 } 
});

const Blog = mongoose.model('Blog', blogSchema);

// --- AYARLAR ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- ÖZEL REHBER İÇERİKLERİ ---
const REHBERLER = {
    'vizesiz-ulkeler': {
        title: "Pasaportu Kap Gel: Vizesiz Gidilebilen En Popüler 5 Ülke",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Vize evraklarıyla uğraşmak yok! Sadece uçak biletini alıp gidebileceğin en güzel rotaları senin için derledik.</p>
            <hr>
            <h3>1. Sırbistan (Belgrad) 🇷🇸</h3>
            <p><strong>Giriş:</strong> Sadece Kimlik Yeterli! Tuna ve Sava nehirlerinin buluştuğu şehir.</p>
            <img src="/img/belgrad.jpg" alt="Belgrad">
            <hr>
            <h3>2. Karadağ (Montenegro) 🇲🇪</h3>
            <p><strong>Giriş:</strong> Pasaport (90 Gün). Adriyatik'in incisi Kotor ve Budva.</p>
            <img src="/img/kotor.jpg" alt="Kotor">
            <hr>
            <h3>3. Japonya 🇯🇵</h3>
            <p><strong>Giriş:</strong> Pasaport. Uzak Doğu'nun teknoloji ve kültür devi.</p>
            <img src="/img/japonya.jpg" alt="Japonya">
            <hr>
            <h3>4. Bosna Hersek 🇧🇦</h3>
            <p><strong>Giriş:</strong> Sadece Kimlik! Mostar Köprüsü ve Başçarşı.</p>
            <img src="/img/mostar.jpg" alt="Mostar">
        `
    },
    'kamp-rotalari': {
        title: "Yıldızların Altında: Türkiye'nin En İyi Kamp Rotaları",
        image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Doğayla iç içe bir tatil için en iyi lokasyonlar.</p>
            <h3>1. Kabak Koyu, Fethiye 🌊</h3>
            <p>Babadağ'ın eteklerinde, turkuaz denizin yanı başında.</p>
            <img src="/img/kabak-koyu.jpg" alt="Fethiye">
            <h3>2. Yedigöller, Bolu 🍂</h3>
            <p>Sonbaharda renk cümbüşü. Göl kenarında kamp keyfi.</p>
            <img src="/img/yedigoller.jpg" alt="Yedigöller">
            <h3>3. Kaçkar Dağları, Rize 🏔️</h3>
            <p>Bulutların üzerinde uyanmak isteyen profesyoneller için.</p>
            <img src="/img/kackar.jpg" alt="Kaçkar">
        `
    },
    'dunya-mutfagi': {
        title: "Lezzet Turu: Ölmeden Önce Denemeniz Gereken 5 Tat",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Dünya mutfağının ikonik lezzetleri.</p>
            <h3>1. Sushi (Japonya) 🍣</h3>
            <p>Çiğ balık ve pirincin sanatı.</p>
            <img src="/img/sushi.jpg" alt="Sushi">
            <h3>2. Pizza Napoletana (İtalya) 🍕</h3>
            <p>Odun ateşinde pişen incecik hamur.</p>
            <img src="/img/pizza.jpg" alt="Pizza">
            <h3>3. Tacos (Meksika) 🌮</h3>
            <p>Sokak lezzetlerinin kralı.</p>
            <img src="/img/tacos.jpg" alt="Tacos">
        `
    },
    'ucuz-ucak': {
        title: "Uçak Biletine Servet Ödemeyin: 5 Altın Kural",
        image: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80",
        content: `
            <h3>1. Gizli Sekme Kullanın 🕵️‍♂️</h3>
            <p>Siteler çerezlerinizi izler, fiyat artırır. Gizli sekme kullanın.</p>
            <h3>2. Salı ve Çarşamba Uçun 📅</h3>
            <p>Hafta ortası uçuşları her zaman daha ucuzdur.</p>
            <img src="/img/havalimani.jpg" alt="Havalimanı">
            <h3>3. "Her Yere" Arama Yapın 🌍</h3>
            <p>Skyscanner'da varış yerini boş bırakın, en ucuz ülkeyi bulun.</p>
        `
    },
    'interrail': {
        title: "Sırt Çantanı Hazırla: Interrail Başlangıç Rehberi",
        // Kapak Resmi: (Yeni ve Çalışan Link - Tren Rayları Manzarası)
        image: "https://images.unsplash.com/photo-1535535112387-56ffe8db21ff?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p class="guide-intro">Tek bir biletle Avrupa'nın 33 ülkesini gezmek hayal değil. Interrail, özgürlüğün diğer adıdır. İşte yola çıkmadan önce bilmen gereken en temel 4 kural:</p>
            
            <hr>

            <h3>1. Hangi Bileti Almalısın? 🎫</h3>
            <p>İki ana seçenek vardır:</p>
            <ul>
                <li><strong>Global Pass:</strong> Tüm Avrupa'da geçer. En popüler olan "1 ay içinde 5 gün" veya "1 ay içinde 7 gün" seyahat seçenekleridir.</li>
                <li><strong>One Country Pass:</strong> Sadece tek bir ülkeyi (Örn: Sadece İtalya) gezmek istiyorsan çok daha ekonomiktir.</li>
            </ul>

            <hr>

            <h3>2. "Rezervasyon" Tuzağına Düşme ⚠️</h3>
            <p>Interrail biletini aldığında her trene elini kolunu sallayarak binemezsin. Özellikle <strong>hızlı trenler (TGV, Eurostar)</strong> ve <strong>gece trenleri</strong> ek rezervasyon ücreti (10€ - 30€) ister ve yerler sınırlıdır. </p>
            <p><em>Taktik:</em> Rezervasyon ücretinden kaçmak için "Rail Planner" uygulamasından "Rezervasyon gerektirmeyen trenler" filtresini seçerek bölgesel trenlerle ücretsiz gezebilirsin.</p>

            <!-- İçerik Resmi (Trenin içi/penceresi) -->

            <hr>

            <h3>3. Konaklamayı Ucuza Getir 🌙</h3>
            <p>Avrupa'da oteller pahalıdır. Bütçeni korumak için:</p>
            <ul>
                <li><strong>Gece Trenleri:</strong> Uyurken yol alırsın, otel parası cebinde kalır.</li>
                <li><strong>Hosteller:</strong> Sadece uyumak için para öde, sosyalleşmek bedava.</li>
            </ul>

            <hr>

            <h3>4. Yanına Alman Gerekenler 🎒</h3>
            <p>Asla tekerlekli bavul alma! Arnavut kaldırımlı Avrupa sokaklarında pişman olursun. Mutlaka <strong>sırt çantası</strong> kullan. Yanına powerbank, çoklu priz ve rahat bir yürüyüş ayakkabısı almayı unutma.</p>
        `
    }
};

// --- ROTALAR ---

// 1. ANASAYFA
app.get('/', async (req, res) => {
    try {
        let searchQuery = req.query.search || '';
        let categoryQuery = req.query.category || '';
        
        let query = {};
        if (categoryQuery) query.category = categoryQuery;
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { tags: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const totalBlogs = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalBlogs / limit);

        // Blog Listesi (Normal akış - Tarihe göre)
        const blogs = await Blog.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);

        // --- ÖNE ÇIKANLAR (SLIDER) ---
        // DEĞİŞİKLİK: Rastgele DEĞİL, En Çok Tıklanan (Views) 3 Yazı
        let featured = [];
        if (!searchQuery && !categoryQuery && page === 1) {
            featured = await Blog.find().sort({ views: -1 }).limit(3);
        }

        // Sidebar Etiketleri
        const recentBlogs = await Blog.find().limit(50).select('tags');
        const allTags = new Set();
        recentBlogs.forEach(b => b.tags.forEach(t => allTags.add(t)));

        res.render('index', {
            title: "RotaBlog | Dünyayı Keşfet",
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
        // Görüntülenmeyi 1 artır
        const blog = await Blog.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (blog) {
            // Benzer Yazılar
            const relatedPosts = await Blog.find({ category: blog.category, _id: { $ne: blog._id } }).limit(3).sort({ date: -1 });
            
            res.render('post', {
                title: `${blog.title} - Gezi Rehberi`,
                blog: blog,
                relatedPosts: relatedPosts,
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

// 3. YORUM YAPMA
app.post('/blog/:slug/comment', async (req, res) => {
    try {
        const { name, comment } = req.body;
        if (!name || !comment) return res.redirect(`/blog/${req.params.slug}`);

        const blog = await Blog.findOne({ slug: req.params.slug });
        if (blog) {
            blog.comments.push({ name: name, text: comment });
            await blog.save();
        }
        res.redirect(`/blog/${req.params.slug}#comments-section`);
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// 4. BEĞENİ YAPMA
app.post('/api/blog/:slug/like', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (blog) {
            blog.likes += 1;
            await blog.save();
            res.json({ success: true, newLikes: blog.likes });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 5. RASTGELE ROTA
app.get('/random', async (req, res) => {
    try {
        const randomBlog = await Blog.aggregate([{ $sample: { size: 1 } }]);
        if (randomBlog.length > 0) {
            res.redirect('/blog/' + randomBlog[0].slug);
        } else {
            res.redirect('/');
        }
    } catch (error) {
        res.redirect('/');
    }
});

// 6. REHBER SAYFALARI
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

// 7. SABİT SAYFALAR
app.get('/sayfa/:page', (req, res) => {
    const pageName = req.params.page; 
    res.render('page', { 
        title: pageName.toUpperCase() + " | RotaBlog", 
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