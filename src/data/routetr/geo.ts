// ==========================================================================
// ROUTE TR — Geo koordinatları & Mutfak Güzergahları veritabanı
// Hava durumu (Open-Meteo) ve Google Maps yol tarifi entegrasyonu için
// her ilin merkez koordinatı + yöresel lezzet kültürü
// ==========================================================================

export interface ProvinceGeo {
  lat: number;
  lng: number;
}

/** İl plakası → merkez koordinatı (il merkezi) */
export const PROVINCE_GEO: Record<string, ProvinceGeo> = {
  "01": { lat: 37.0, lng: 35.3213 }, // Adana
  "02": { lat: 37.7648, lng: 38.2786 }, // Adıyaman
  "03": { lat: 38.7569, lng: 30.5387 }, // Afyonkarahisar
  "04": { lat: 39.7191, lng: 43.0503 }, // Ağrı
  "05": { lat: 40.6499, lng: 35.8353 }, // Amasya
  "06": { lat: 39.9334, lng: 32.8597 }, // Ankara
  "07": { lat: 36.8969, lng: 30.7133 }, // Antalya
  "08": { lat: 41.1828, lng: 41.8183 }, // Artvin
  "09": { lat: 37.856, lng: 27.8416 }, // Aydın
  "10": { lat: 39.6484, lng: 27.8826 }, // Balıkesir
  "11": { lat: 40.1426, lng: 29.9793 }, // Bilecik
  "12": { lat: 38.8854, lng: 40.4983 }, // Bingöl
  "13": { lat: 38.4006, lng: 42.1095 }, // Bitlis
  "14": { lat: 40.7392, lng: 31.6089 }, // Bolu
  "15": { lat: 37.7203, lng: 30.2908 }, // Burdur
  "16": { lat: 40.1826, lng: 29.0665 }, // Bursa
  "17": { lat: 40.1553, lng: 26.4142 }, // Çanakkale
  "18": { lat: 40.6013, lng: 33.6134 }, // Çankırı
  "19": { lat: 40.5506, lng: 34.9556 }, // Çorum
  "20": { lat: 37.7765, lng: 29.0864 }, // Denizli
  "21": { lat: 37.9144, lng: 40.2306 }, // Diyarbakır
  "22": { lat: 41.6819, lng: 26.5623 }, // Edirne
  "23": { lat: 38.681, lng: 39.2264 }, // Elazığ
  "24": { lat: 39.75, lng: 39.5 }, // Erzincan
  "25": { lat: 39.9, lng: 41.27 }, // Erzurum
  "26": { lat: 39.7767, lng: 30.5206 }, // Eskişehir
  "27": { lat: 37.0662, lng: 37.3833 }, // Gaziantep
  "28": { lat: 40.9128, lng: 38.3895 }, // Giresun
  "29": { lat: 40.4651, lng: 39.4781 }, // Gümüşhane
  "30": { lat: 37.5832, lng: 43.741 }, // Hakkari
  "31": { lat: 36.2023, lng: 36.1613 }, // Hatay
  "32": { lat: 37.7648, lng: 30.5566 }, // Isparta
  "33": { lat: 36.8121, lng: 34.6415 }, // Mersin
  "34": { lat: 41.0082, lng: 28.9784 }, // İstanbul
  "35": { lat: 38.4237, lng: 27.1428 }, // İzmir
  "36": { lat: 40.6013, lng: 43.0975 }, // Kars
  "37": { lat: 41.3887, lng: 33.7827 }, // Kastamonu
  "38": { lat: 38.7312, lng: 35.4787 }, // Kayseri
  "39": { lat: 41.7333, lng: 27.2167 }, // Kırklareli
  "40": { lat: 39.1467, lng: 34.1636 }, // Kırşehir
  "41": { lat: 40.8533, lng: 29.8815 }, // Kocaeli
  "42": { lat: 37.8746, lng: 32.4932 }, // Konya
  "43": { lat: 39.4242, lng: 29.9851 }, // Kütahya
  "44": { lat: 38.3552, lng: 38.3095 }, // Malatya
  "45": { lat: 38.6191, lng: 27.4289 }, // Manisa
  "46": { lat: 37.5858, lng: 36.9371 }, // Kahramanmaraş
  "47": { lat: 37.3127, lng: 40.7352 }, // Mardin
  "48": { lat: 37.2153, lng: 28.3636 }, // Muğla
  "49": { lat: 38.7334, lng: 41.4915 }, // Muş
  "50": { lat: 38.6247, lng: 34.7166 }, // Nevşehir
  "51": { lat: 37.9667, lng: 34.6833 }, // Niğde
  "52": { lat: 40.9839, lng: 37.8764 }, // Ordu
  "53": { lat: 41.0201, lng: 40.5234 }, // Rize
  "54": { lat: 40.7569, lng: 30.3783 }, // Sakarya
  "55": { lat: 41.2867, lng: 36.33 }, // Samsun
  "56": { lat: 37.9333, lng: 41.95 }, // Siirt
  "57": { lat: 42.0251, lng: 35.1535 }, // Sinop
  "58": { lat: 39.7477, lng: 37.0179 }, // Sivas
  "59": { lat: 40.9783, lng: 27.5114 }, // Tekirdağ
  "60": { lat: 40.3167, lng: 36.5544 }, // Tokat
  "61": { lat: 41.0015, lng: 39.7178 }, // Trabzon
  "62": { lat: 39.1079, lng: 39.5401 }, // Tunceli
  "63": { lat: 37.1591, lng: 38.7969 }, // Şanlıurfa
  "64": { lat: 38.6759, lng: 29.4082 }, // Uşak
  "65": { lat: 38.4891, lng: 43.4089 }, // Van
  "66": { lat: 39.8181, lng: 34.8147 }, // Yozgat
  "67": { lat: 41.4564, lng: 31.7987 }, // Zonguldak
  "68": { lat: 38.3687, lng: 34.037 }, // Aksaray
  "69": { lat: 40.2604, lng: 40.2281 }, // Bayburt
  "70": { lat: 37.1759, lng: 33.2227 }, // Karaman
  "71": { lat: 39.8433, lng: 33.5149 }, // Kırıkkale
  "72": { lat: 37.8812, lng: 41.1351 }, // Batman
  "73": { lat: 37.4187, lng: 42.4589 }, // Şırnak
  "74": { lat: 41.6344, lng: 32.3375 }, // Bartın
  "75": { lat: 41.1105, lng: 42.7022 }, // Ardahan
  "76": { lat: 39.9208, lng: 44.0448 }, // Iğdır
  "77": { lat: 40.6504, lng: 29.2769 }, // Yalova
  "78": { lat: 41.2061, lng: 32.6204 }, // Karabük
  "79": { lat: 36.7184, lng: 37.1212 }, // Kilis
  "80": { lat: 37.0742, lng: 36.2478 }, // Osmaniye
  "81": { lat: 40.8438, lng: 31.1565 }, // Düzce
};

/** Yöresel mutfak veritabanı — her il için meşhur lezzetler */
export interface ProvinceFood {
  dish: string;
  desc: string;
}

export const PROVINCE_FOODS: Record<string, ProvinceFood[]> = {
  "01": [
    { dish: "Adana Kebabı", desc: "Zırh kıyma, acılı el açması kebap" },
    { dish: "Şalgam Suyu", desc: "Fermente turp ve bulgurdan yapılan yerel içecek" },
    { dish: "Bici Bici Tatlısı", desc: "Muzlu, nişastalı serinletici tatlı" },
  ],
  "02": [
    { dish: "Çiğ Köfte", desc: "Adıyaman usulü isotlu, el yoğurması çiğ köfte" },
    { dish: "Adıyaman Çiğ Köftesi", desc: "Nar ekşisi ve isotla harmanlanmış" },
    { dish: "Peynirli Künefe", desc: "Antep fıstığı şerbetli tatlı" },
  ],
  "03": [
    { dish: "Afyon Kebabı", desc: "Tandırda pişen süt kuzusu" },
    { dish: "Lokum", desc: "Dünyaca ünlü Afyon lokumu" },
    { dish: "Sikma Peynir", desc: "Kaymağın tereyağında pişirilmesi" },
  ],
  "04": [
    { dish: "Ağrı Kebabı", desc: "Odun ateşinde tandır usulü" },
    { dish: "Haşıl", desc: "Tereyağlı bulgur yahnisi" },
    { dish: "Abdigör Köftesi", desc: "Nohutlu köfte çorbası" },
  ],
  "05": [
    { dish: "Keşkek", desc: "Düğün pilavının ana yemeği" },
    { dish: "Bakla Dolması", desc: "Amasya'ya özgü zeytinyağlı" },
    { dish: "Çatal Aşure", desc: "Osmanlı'dan kalan şifa tatlısı" },
  ],
  "06": [
    { dish: "Ankara Tavası", desc: "Etli, soğanlı yerel pirinç yemeği" },
    { dish: "Ali Nazik", desc: "Patlıcanlı yoğurtlu kebap" },
    { dish: "Alacahanım Çorbası", desc: "Yöresel nohutlu sıcak çorba" },
  ],
  "07": [
    { dish: "Piyaz", desc: "Tahinli, kuru fasulyeli Antalya piyazı" },
    { dish: "Hibeş", desc: "Tahin, nohut ve baharatlı meze" },
    { dish: "Gül Tatlısı", desc: "Isparta gülü aromalı şerbetli" },
  ],
  "08": [
    { dish: "Karalahana Çorbası", desc: "Karadeniz'in yeşil bereketi" },
    { dish: "Anchovy (Hamsi) Tava", desc: "Artvin kıyı usulü hamsi" },
    { dish: "Kaymaklı Börek", desc: "El açması tereyağlı" },
  ],
  "09": [
    { dish: "Çöp Şiş", desc: "Marine edilmiş küçük kuşbaşı şiş" },
    { dish: "Sümeşit Çorbası", desc: "Nohut ve bulgurlu yöresel çorba" },
    { dish: "Zeytinyağlı Enginar", desc: "Aydın'ın meşhur enginarı" },
  ],
  "10": [
    { dish: "Balıkesir Höşmerim", desc: "Peynir helvası tatlısı" },
    { dish: "Ayvalık Tostu", desc: "Kızarmış ekmek arası sucuklu peynirli" },
    { dish: "Kızarmış Succuk", desc: "Kelle peyniri ve sucuk kahvaltısı" },
  ],
  "11": [
    { dish: "Bilecik Köftesi", desc: "Etli bulgurlu köfte" },
    { dish: "Şibit Tatlısı", desc: "Cevizli, şerbetli hamur tatlısı" },
    { dish: "Oğlak Çevirmesi", desc: "Geleneksel düğün yemeği" },
  ],
  "12": [
    { dish: "Bingöl Helvası", desc: "Tereyağlı un helvası" },
    { dish: "Kavurtma", desc: "Etli bulgur kavurması" },
    { dish: "Sırın", desc: "Yufkalı, peynirli gözleme" },
  ],
  "13": [
    { dish: "Bitlis Büryan", desc: "Tandırda pişen kuzu eti" },
    { dish: "Kaplıca Böreği", desc: "Haşlanmış hamur ve yoğurt" },
    { dish: "Avrat Çorbası", desc: "Nohutlu, domatesli yöresel çorba" },
  ],
  "14": [
    { dish: "Bolu Köftesi", desc: "Yumuşak ekmekli et köftesi" },
    { dish: "Abdurrahman Çarşaşı", desc: "Bolu'ya özgü tatlı" },
    { dish: "Yarpuzlu Köfte", desc: "Yarpuz otlu köfte" },
  ],
  "15": [
    { dish: "Burdur Şiş", desc: "Kuşbaşı döner tarzı şiş" },
    { dish: "Cevizli Köfte", desc: "Cevizli bulgur köftesi" },
    { dish: "Burdur Guveç", desc: "Testi kebabı" },
  ],
  "16": [
    { dish: "İskender Kebabı", desc: "Tereyağlı yoğurtlu döner" },
    { dish: "İnegöl Köftesi", desc: "Köfte diyarının efsanesi" },
    { dish: "Cantık", desc: "Kıymalı lahmacun benzeri" },
  ],
  "17": [
    { dish: "Deniz Börülcesi", desc: "Çanakkale boğazının otu" },
    { dish: "Kadınbudu Köfte", desc: "Pirinçli, yumurtalı köfte" },
    { dish: "Peynir Helvası", desc: "Taze peynirli tatlı" },
  ],
  "18": [
    { dish: "Çankırı Mantısı", desc: "Yoğurtlu küçük mantı" },
    { dish: "Helva Tatlısı", desc: "Tahin helvası usulü" },
    { dish: "Etli Kapuska", desc: "Lahana yahnisi" },
  ],
  "19": [
    { dish: "Çorum Çiğdem Aşi", desc: "Tandır ekmeğiyle servis" },
    { dish: "Keşkek", desc: "Buğday ve et yahnisi" },
    { dish: "Hingel", desc: "Çorum mantısı benzeri hamur" },
  ],
  "20": [
    { dish: "Denizli Tavas Kebabı", desc: "Sebzeli tandır kebabı" },
    { dish: "Süllü Çorbası", desc: "Yoğurtlu nohut çorbası" },
    { dish: "Kuyu Kebabı", desc: "Kuyuda pişen kuzu" },
  ],
  "21": [
    { dish: "Kaburga Dolması", desc: "Fırında baharatlı kuzu kaburga" },
    { dish: "Meftune", desc: "Acılı et yahnisi" },
    { dish: "Diyarbakır Ciğeri", desc: "Acılı kuzu ciğeri kebabı" },
  ],
  "22": [
    { dish: "Mırra", desc: "Koyu Türk kahvesi benzeri acı kahve" },
    { dish: "Edirne Ciğeri", desc: "Çıtır kuzu ciğeri" },
    { dish: "Mamzana", desc: "Patlıcan-biber sıcak mezesi" },
  ],
  "23": [
    { dish: "Orblo", desc: "Elazığ'ın meşhur köfte çorbası" },
    { dish: "Harput Köftesi", desc: "Nohutlu köfte" },
    { dish: "İşkembeli Dolma", desc: "Elazığ usulü dolma" },
  ],
  "24": [
    { dish: "Erzincan Tava", desc: "Et ve tereyağlı pilav" },
    { dish: "Kığı Köftesi", desc: "Etli bulgurlu köfte" },
    { dish: "Sürü Çorbası", desc: "Yoğurtlu buğday çorbası" },
  ],
  "25": [
    { dish: "Cağ Kebabı", desc: "Yatay döner, Erzurum'un meşhuru" },
    { dish: "Ayran Çorbası", desc: "Soğuk yoğurt çorbası" },
    { dish: "Kadayıf Dolması", desc: "Cevizli kadayıf tatlısı" },
  ],
  "26": [
    { dish: "Çibörek", desc: "Çıtır yağlı hamur işi" },
    { dish: "Balaban Köfte", desc: "Yoğurt soslu köfte" },
    { dish: "Haşhaşlı Çörek", desc: "Eskişehir haşhaş ekmeği" },
  ],
  "27": [
    { dish: "Antep Kebabı", desc: "Acılı, fıstıklı kebap" },
    { dish: "Künefe", desc: "Antep fıstıklı, kaymaklı" },
    { dish: "Beyran Çorbası", desc: "Sabah içilen acılı kuzu çorbası" },
  ],
  "28": [
    { dish: "Karadeniz Pidesi", desc: "Giresun usulü pide" },
    { dish: "Kuzu İncik", desc: "Tereyağlı kuzu but" },
    { dish: "Kara Lahana Sarması", desc: "Karalahana yaprağında sarma" },
  ],
  "29": [
    { dish: "Gümüşhane Baklavası", desc: "İnce yufkalı fıstıklı" },
    { dish: "Kaymaklı Tatlı", desc: "Taze kaymak ve bal" },
    { dish: "Pestil", desc: "Meyve pestili" },
  ],
  "30": [
    { dish: "Hakkari Kebabı", desc: "Odun ateşinde kuzu" },
    { dish: "Zırh Kebabı", desc: "El kıyması et" },
    { dish: "Serukevş", desc: "Yöresel süt tatlısı" },
  ],
  "31": [
    { dish: "Hatay Tava", desc: "Et ve patlıcan tava" },
    { dish: "Humus", desc: "Nohutlu tahin mezesi" },
    { dish: "Künefe", desc: "Antakya usulü ince künefe" },
  ],
  "32": [
    { dish: "Isparta Kebabı", desc: "Gül yağında et yemeği" },
    { dish: "Tandır Çorbası", desc: "Yoğurtlu, etli çorba" },
    { dish: "Güllü Lokum", desc: "Isparta gülü aromalı" },
  ],
  "33": [
    { dish: "Tarsus Kebabı", desc: "Tarsus usulü acılı kebap" },
    { dish: "Şalgam", desc: "Meşhur Mersin şalgamı" },
    { dish: "Cezerye", desc: "Havuç cevizli tatlı" },
  ],
  "34": [
    { dish: "Balık Ekmek", desc: "Eminönü'nün klasiği" },
    { dish: "İskender", desc: "Bursa kökenli ama İstanbul usulü" },
    { dish: "Midye Dolma", desc: "Baharatlı midye" },
  ],
  "35": [
    { dish: "İzmir Kumru", desc: "Susamlı, sucuklu sandviç" },
    { dish: "Boyoz", desc: "Sefarad mutfağından hamur işi" },
    { dish: "Şevket-i Bostan", desc: "Dikenli ot yemeği" },
  ],
  "36": [
    { dish: "Kars Kazı", desc: "Kars kaz eti pilavı" },
    { dish: "Kaşar Peyniri", desc: "Meşhur Kars kaşarı" },
    { dish: "Hangel", desc: "Yoğurtlu hamur çorbası" },
  ],
  "37": [
    { dish: "Kastamonu Mendesi", desc: "Bulgur ve et pilavı" },
    { dish: "Taş Çorbası", desc: "Taş fırında pişen çorba" },
    { dish: "Pidesi", desc: "Kastamonu pidesi" },
  ],
  "38": [
    { dish: "Kayseri Yağ Mantısı", desc: "Dünyaca ünlü mantı" },
    { dish: "Pastırmalı Faz", desc: "Pastırmalı pideli yemek" },
    { dish: "Kavurmalı Çörek", desc: "Sucuk/kavurma çöreği" },
  ],
  "39": [
    { dish: "Kırklareli Tava", desc: "Kavurma ve pilav" },
    { dish: "Kaşar Peyniri", desc: "Yöresel taze kaşar" },
    { dish: "Cızıbzık", desc: "Sucuklu yumurta tavası" },
  ],
  "40": [
    { dish: "Kırşehir Tandırı", desc: "Tandır ekmeği ve et" },
    { dish: "Sıkma Peynir", desc: "Taze çiftlik peyniri" },
    { dish: "Bulgur Pilavı", desc: "Kırşehir usulü bulgur" },
  ],
  "41": [
    { dish: "Kocaeli Cıvıklı Pide", desc: "Kıymasız peynirli pide" },
    { dish: "Pişi", desc: "Kızarmış hamur" },
    { dish: "Kandira Çorbası", desc: "Yoğurtlu buğday çorbası" },
  ],
  "42": [
    { dish: "Etli Ekmek", desc: "Konya'nın efsane uzun pidesi" },
    { dish: "Fırın Kebabı", desc: "Tandır usulü fırın kebabı" },
    { dish: "Tirit", desc: "Et suyu ve ekmek yemeği" },
  ],
  "43": [
    { dish: "Kütahya Tavası", desc: "Et ve sebze tava" },
    { dish: "Haşhaşlı Çörek", desc: "Kütahya haşhaş ekmeği" },
    { dish: "Oğmaç Çorbası", desc: "Tarhana benzeri çorba" },
  ],
  "44": [
    { dish: "Malatya Köftesi", desc: "İçli köfte diyarı" },
    { dish: "Kayısı Yemeği", desc: "Taze kayısı ve et" },
    { dish: "Analı Kızlı", desc: "Nohutlu köfte çorbası" },
  ],
  "45": [
    { dish: "Manisa Kebabı", desc: "Acılı, tereyağlı kebap" },
    { dish: "Sultaniye", desc: "Üzüm yaprağında sarma" },
    { dish: "Tarhana Çorbası", desc: "Fermente yoğurt çorbası" },
  ],
  "46": [
    { dish: "Maraş Tarhana", desc: "Dünyaca ünlü tarhana" },
    { dish: "Maraş Dondurması", desc: "Kekikli, dövme dondurma" },
    { dish: "Ekşili Köfte", desc: "Ekşi soslu köfte" },
  ],
  "47": [
    { dish: "Mardin Kaburga", desc: "Fırında kuzu kaburga" },
    { dish: "İkbebet", desc: "Etli köfte" },
    { dish: "Sembosek", desc: "Kıymalı hamur poğaçası" },
  ],
  "48": [
    { dish: "Muğla Kebabı", desc: "Yöresel odun kebabı" },
    { dish: "Sura", desc: "Kuzu etli dolma" },
    { dish: "Ballı Yogurt", desc: "Muğla balı ve çam balı" },
  ],
  "49": [
    { dish: "Muş Köftesi", desc: "Etli bulgurlu köfte" },
    { dish: "Herse", desc: "Buğday ve et yahnisi" },
    { dish: "Kesk Çorbası", desc: "Yoğurtlu buğday çorbası" },
  ],
  "50": [
    { dish: "Nevşehir Testi Kebabı", desc: "Testide pişen et kebabı" },
    { dish: "Ürgüp Köftesi", desc: "Yöresel köfte" },
    { dish: "Kabak Tatlısı", desc: "Cevizli kabak tatlısı" },
  ],
  "51": [
    { dish: "Niğde Tavası", desc: "Et ve sebze tava" },
    { dish: "Köfte Çorbası", desc: "Nohutlu köfte çorbası" },
    { dish: "Elma Tatlısı", desc: "Niğde elmas elması" },
  ],
  "52": [
    { dish: "Ordu Pidesi", desc: "Karadeniz usulü pide" },
    { dish: "Fındık Lahmacunu", desc: "Fındık yağlı lahmacun" },
    { dish: "Mıhlama", desc: "Peynir ve tereyağlı mısır ekmeği" },
  ],
  "53": [
    { dish: "Rize Mıhlama", desc: "Kaşar, tereyağ ve mısır unu" },
    { dish: "Karalahana Çorbası", desc: "Yeşil ot çorbası" },
    { dish: "Laz Böreği", desc: "Tatlı muhallebili börek" },
  ],
  "54": [
    { dish: "Sakarya Cızlak", desc: "Peynirli gözleme" },
    { dish: "Adapazarı Köftesi", desc: "Yumuşak et köftesi" },
    { dish: "Isıtan Çorba", desc: "Kış çorbası" },
  ],
  "55": [
    { dish: "Samsun Bafra Pidesi", desc: "İnce hamurlu meşhur pide" },
    { dish: "Samsun Çağla Kebabı", desc: "Çağla ile et yemeği" },
    { dish: "Nohutlu Pilav", desc: "Tavuklu nohut pilav" },
  ],
  "56": [
    { dish: "Siirt Büryan", desc: "Tandırda kuzu eti" },
    { dish: "Perde Pilavı", desc: "Hamur kaplı bademli pilav" },
    { dish: "Büryan Pidesi", desc: "Büryan eti ile pide" },
  ],
  "57": [
    { dish: "Sinop Makarna", desc: "Cevizli yerel makarna" },
    { dish: "Nokul", desc: "Cevizli tatlı poğaça" },
    { dish: "Hamsi Böreği", desc: "Hamsili karalahana böreği" },
  ],
  "58": [
    { dish: "Sivas Keşkek", desc: "Düğün yemeği keşkek" },
    { dish: "Sivas Köftesi", desc: "Etli bulgurlu köfte" },
    { dish: "Madımak", desc: "Sivas'ın efsane ot yemeği" },
  ],
  "59": [
    { dish: "Tekirdağ Köftesi", desc: "Meşhur Tekirdağ köfte" },
    { dish: "Hardaliye", desc: "Fermente kiraz suyu" },
    { dish: "Hayrabolu Tatlısı", desc: "Peynirli şerbetli tatlı" },
  ],
  "60": [
    { dish: "Tokat Kebabı", desc: "Sebzeli tandır kebabı" },
    { dish: "Tokat Batı", desc: "Yoğurtlu bulgur yemeği" },
    { dish: "Zeytinyağlı Dolma", desc: "Tokat usulü dolma" },
  ],
  "61": [
    { dish: "Trabzon Akçaabat Köftesi", desc: "Meşhur Akçaabat köfte" },
    { dish: "Karadeniz Mıhlama", desc: "Kaşar ve tereyağ" },
    { dish: "Hamsi Pilavı", desc: "Hamsili pirinç pilavı" },
  ],
  "62": [
    { dish: "Tunceli Pilavı", desc: "Karadeniz safran pilavı" },
    { dish: "Munzur Balı", desc: "Munzur vadisi balı" },
    { dish: "Kavurma", desc: "Düzce yöresel kavurma" },
  ],
  "63": [
    { dish: "Şanlıurfa Çiğ Köfte", desc: "İsotun memleketinden" },
    { dish: "Urfa Kebabı", desc: "Acısız soğanlı kebap" },
    { dish: "Sıra Gecesi Yemekleri", desc: "Geleneksel sofra" },
  ],
  "64": [
    { dish: "Uşak Taglap", desc: "Etli bulgur pilavı" },
    { dish: "Alacatene Çorbası", desc: "Yoğurtlu çorba" },
    { dish: "Küçük Kına Kebabı", desc: "Düğün yemeği" },
  ],
  "65": [
    { dish: "Van Kahvaltı Sofrası", desc: "Murtuğa, kavurt, bal, kaymak" },
    { dish: "Van Köftesi", desc: "Nohutlu köfte" },
    { dish: "Otlu Peynir", desc: "Otlu Van peyniri" },
  ],
  "66": [
    { dish: "Yozgat Arpa Şehriye", desc: "Etli şehriye pilavı" },
    { dish: "Yozgat Tavası", desc: "Et ve sebze yahnisi" },
    { dish: "Pancar Çorbası", desc: "Yoğurtlu pancar çorbası" },
  ],
  "67": [
    { dish: "Zonguldak Etli Kuru Fasulye", desc: "Madenci yemeği" },
    { dish: "Kestane Tatlısı", desc: "Şekerli kestane" },
    { dish: "Çörtü", desc: "Karalahana yemeği" },
  ],
  "68": [
    { dish: "Aksaray Tava", desc: "Et ve sebze tava" },
    { dish: "Tandır Çorbası", desc: "Yoğurtlu çorba" },
    { dish: "Silleli Mantı", desc: "Yöresel mantı" },
  ],
  "69": [
    { dish: "Bayburt Çorbası", desc: "Yoğurtlu buğday çorbası" },
    { dish: "Helva", desc: "Tereyağlı un helvası" },
    { dish: "Kavurma", desc: "Etli kavurma" },
  ],
  "70": [
    { dish: "Karaman Arbaşı", desc: "Etli hamur yahnisi" },
    { dish: "Toyga Çorbası", desc: "Yoğurtlu nohut çorbası" },
    { dish: "Bulamaç", desc: "Unlu sıcak çorba" },
  ],
  "71": [
    { dish: "Kırıkkale Tavası", desc: "Et ve sebze tava" },
    { dish: "Sıkma Çorbası", desc: "Yoğurtlu çorba" },
    { dish: "Kesme Çorba", desc: "Hamurlu çorba" },
  ],
  "72": [
    { dish: "Batman Kebabı", desc: "Acılı kebap" },
    { dish: "Kavurtma", desc: "Etli bulgur kavurması" },
    { dish: "Sırın", desc: "Yufkalı peynirli gözleme" },
  ],
  "73": [
    { dish: "Şırnak Büryan", desc: "Tandır kuzu eti" },
    { dish: "Şırnak Kebabı", desc: "Odun ateşi kebap" },
    { dish: "Zırh Köftesi", desc: "El kıyması köfte" },
  ],
  "74": [
    { dish: "Bartın Pidesi", desc: "Karadeniz usulü pide" },
    { dish: "Kara Lahana Sarması", desc: "Karalahana dolması" },
    { dish: "Balık Buğulama", desc: "Taze balık buğulama" },
  ],
  "75": [
    { dish: "Ardahan Kazısı", desc: "Kaz eti yemeği" },
    { dish: "Koyunlu Pilav", desc: "Etli pilav" },
    { dish: "Hanghel", desc: "Yoğurtlu hamur" },
  ],
  "76": [
    { dish: "Iğdır Kebabı", desc: "Azeri usulü kebap" },
    { dish: "Pilav", desc: "Iğdır pilavı" },
    { dish: "Zırh Köfte", desc: "El kıyması köfte" },
  ],
  "77": [
    { dish: "Yalova Köftesi", desc: "Yumuşak et köftesi" },
    { dish: "Termal Kaplıca Çorbası", desc: "Yoğurtlu çorba" },
    { dish: "Zeytinyağlı Enginar", desc: "Yalova enginarı" },
  ],
  "78": [
    { dish: "Karabük Pidesi", desc: "Yöresel pide" },
    { dish: "Safranlı Pilav", desc: "Safranbolu safranlı pilav" },
    { dish: "Etli Kapuska", desc: "Lahana yahnisi" },
  ],
  "79": [
    { dish: "Kilis Tavası", desc: "Et ve patlıcan tava" },
    { dish: "Orbı", desc: "Yoğurtlu köfte çorbası" },
    { dish: "Kilis Kebabı", desc: "Acılı kebap" },
  ],
  "80": [
    { dish: "Osmaniye Kebabı", desc: "Acılı yerel kebap" },
    { dish: "Osmaniye Tavası", desc: "Et ve sebze tava" },
    { dish: "Şalgam", desc: "Meşhur şalgam suyu" },
  ],
  "81": [
    { dish: "Düzce Köftesi", desc: "Yumuşak et köftesi" },
    { dish: "Cızlak", desc: "Peynirli gözleme" },
    { dish: "Kestane Tatlısı", desc: "Şekerli kestane" },
  ],
};

/** Türkiye'nin 7 coğrafi bölgesi */
export const REGIONS = [
  "Marmara",
  "Ege",
  "Akdeniz",
  "İç Anadolu",
  "Karadeniz",
  "Doğu Anadolu",
  "Güneydoğu Anadolu",
] as const;

export type RegionName = (typeof REGIONS)[number];
