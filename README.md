# 🛣️ Route TR — Türkiye Granüler Seyahat & Keşif Haritası

**Route TR**, seyahatlerinizi sadece *"Gittim / Gitmedim"* ikiliğine sıkıştırmayan; **İl**, **İlçe** ve **Önemli Noktalar (POI)** düzeyinde derinlemesine kayıt altına alan modern bir seyahat günlüğü, rozet sistemi ve interaktif ısı haritası (heatmap) web uygulamasıdır.

Geliştirici: [Aydın Aydemir (@cyberQbit)](https://github.com/cyberQbit)  
Proje Deposu: [RouteTR](https://github.com/cyberQbit/RouteTR)  
Canlı Sayfa: [cyberqbit.github.io/RouteTR](https://cyberqbit.github.io/RouteTR/)

---

## 🌟 Öne Çıkan Özellikler (Yol Haritası Kapsamı)

1. **81 İl & Gerçek İlçe Sınırları**:
   - Türkiye'nin dış sınırları ve il sınırları kalın çizgilerle, ilçe sınırları ise zarif ince çizgilerle harita üzerinde işlenmiştir.
   - [tr-svg-maps](https://github.com/aakutlu/tr-svg-maps) dosyaları (`TR-adm2-with-city-borders.svg` / `TR-adm1.svg`) eklendiğinde otomatik algılanıp yüklenir.
2. **🏆 Rozet ve Başarı (Achievements) Sistemi**:
   - 22 farklı başarı rozeti (İlk Adım, 7 Bölge Fatihi, Marmara Ustası, Ege Ruhu, Karadeniz Sevdalısı, Sınır Boyu Avcısı, Büyük Üçlü, İlçe Kaşifi vb.).
   - Canlı ilerleme çubuğu ve kazanılan rozetlerin takibi.
3. **🎯 Seyahat Hedefleri (Bucket List)**:
   - Kişisel seyahat hedefleri oluşturma (Örn: "Bu yıl 5 yeni il gez", "Ege bölgesini bitir", "50 ilçe sınırını aş").
   - Gerçek zamanlı ilerleme yüzdesi hesabı.
4. **💡 "Yakınında Gitmediğin Şehirler" Akıllı Öneri Motoru**:
   - Ziyaret ettiğiniz illerin sınır komşularını analiz ederek sıradaki en mantıklı rota durağını önerir.
   - Bölgeyi tamamlamaya en yakın olduğunuz illeri otomatik tespit eder.
5. **📊 Skor & Bölgesel Analiz (Analytics)**:
   - 7 Coğrafi bölgenin tamamlanma yüzdeleri, il/ilçe oranları ve puanlama metodolojisi şeffaf dökümü.
6. **İlçe Bazlı İşaretleme & POI Checklisti**:
   - Türkiye'nin tüm ilçeleri ve her ilin öne çıkan 5-10 tarihi/doğal durağı (Örn: Sazova Parkı, Odunpazarı Evleri, Mihalıççık Yunus Emre Türbesi, Han Yazılıkaya vb.).
   - Kullanıcıların kendi gittikleri özel köy, yayla veya lezzet durağını ekleyebilme desteği.
7. **📸 Sosyal Medya Seyahat Kartı (Canvas PNG Export)**:
   - "Seyahat Kartı Al" butonu ile haritanızı, genel keşif yüzdenizi, kazanılan rozet sayısını ve unvanınızı yüksek çözünürlüklü bir kartpostal olarak tek tıkla indirme.
8. **Veri Yönetimi & Yerel Kayıt**:
   - `localStorage` ile otomatik anlık kayıt.
   - Seyahat verilerini ve hedefleri `.json` formatında yedekleme (export) ve başka cihazlara geri yükleme (import).
9. **Mobil ve Tüm Ekranlara Tam Uyumlu (Responsive)**:
   - Akıllı telefonlar, tabletler ve masaüstü bilgisayarlarda kusursuz çalışan esnek arayüz.

---

## 🚀 GitHub Pages Üzerinde Yayınlama

1. Dosyaları deponuzun ana dizinine (`root`) ekleyin (`index.html`, `styles.css`, `data.js`, `app.js`, `README.md`, `LICENSE`).
2. Deponuzun **Settings** > **Pages** sekmesine gidin.
3. **Branch** kısmından `main` (veya `master`) dalını ve `/ (root)` seçip **Save** butonuna tıklayın.

---

## 📄 Lisans
Bu proje [GNU General Public License v3.0 (GPL-3.0)](LICENSE) altında lisanslanmıştır.
