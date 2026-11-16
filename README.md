# 🎮 GameKey TR - Dijital Oyun & Key Satış Platformu

Türkiye pazarına özel olarak geliştirilmiş; **Steam, Valorant VP, Riot Points, Epic Games, Xbox ve PlayStation** gibi popüler dijital oyun anahtarlarını **anında otomatik teslimat** ile satabileceğiniz modern e-ticaret sitesi.

---

## 🚀 Hızlı Başlangıç

Site şu anda yerel sunucunuzda çalışmaktadır:
* 🛒 **Mağaza Vitrini:** [http://localhost:3000](http://localhost:3000)
* 👑 **Yönetici (Admin) Paneli:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
  * **Varsayılan Yönetici PIN:** `admin123`
* 🔍 **Müşteri Key Sorgulama:** [http://localhost:3000/orders.html](http://localhost:3000/orders.html)

Sunucuyu daha sonra yeniden başlatmak istediğinizde proje klasöründeki **`BASLAT.bat`** dosyasına çift tıklamanız yeterlidir.

---

## ⚡ Temel Özellikler

1. **Otomatik Key Havuzu & Anında Teslimat:**
   * Müşteri siparişi tamamladığı salise ilgili oyunun key havuzundan bir lisans kodu çekilir ve durumu `SATILDI` olarak işaretlenir.
   * Key müşterinin karşısına özel animasyonlu **Key Kasası** ekranında çıkar.
   * Tek tıkla kopyalama butonu ve her platforma özel **Aktivasyon Rehberi** (Steam'de nasıl aktif edilir vb.) yer alır.
   * Stokta key kalmadığında vitrinde otomatik olarak **"Tükendi"** uyarısı çıkar.

2. **Gelişmiş Yönetici (Admin) Paneli:**
   * **Toplu Key Yükleme:** İstediğiniz oyunu seçip alt alta 50-100 adet key yapıştırarak saniyeler içinde stok yükleyebilirsiniz.
   * **Ürün Yönetimi:** Yeni oyun ekleme, fiyat/indirim belirleme, kapak görseli ve açıklama düzenleme.
   * **Sipariş Takibi:** Tüm müşteri siparişleri, ödeme durumları ve kime hangi keyin verildiğinin dökümü.
   * **İstatistikler:** Toplam ciro (₺), sipariş adedi ve stokta kalan key sayıları.

3. **Ödeme Altyapısı:**
   * **Kredi / Banka Kartı (3D Secure Test):** Simüle edilmiş güvenli ödeme ekranı.
   * **Shopier Entegrasyonu:** Bireysel veya kurumsal Shopier API entegrasyonuna hazır altyapı.
   * **Havale / FAST:** 7/24 anında banka transferi ve IBAN bildirim ekranı.

4. **Kullanıcı Key Kasası:**
   * Müşteriler e-posta adreslerini yazarak geçmişte satın aldıkları tüm oyun keylerine her an erişebilirler.

---

## 🌐 Sitenizi Canlıya Alma ve Domain Bağlama

Sitenizi internete açıp kendi domain adınızla (örn: `oyunkey.com` veya `oyunkey.com.tr`) yayınlamak için adımlar:

### 1. Domain (Alan Adı) Alma
* Metunic, Turhost, İsimtescil veya Namecheap gibi bir kayıt firmasından dilediğiniz bir `.com` veya `.com.tr` alan adını satın alın.

### 2. Canlı Barındırma (Hosting) Seçenekleri
* **Seçenek A - Railway / Render (En Kolay & Otomatik SSL):**
  1. Bu proje klasörünü ücretsiz bir GitHub hesabına yükleyin (`git push`).
  2. [Railway.app](https://railway.app) veya [Render.com](https://render.com) üzerinde projenizi seçip "Deploy" butonuna basın.
  3. Panelden "Custom Domain" alanına aldığınız alan adını yazıp DNS kayıtlarını yönlendirin. Siteniz ücretsiz SSL sertifikasıyla dakikalar içinde aktif olur.
* **Seçenek B - Ubuntu VPS (En Düşük Maliyet):**
  * Aylık 3-5$'lık bir sunucuya (Hetzner, DigitalOcean) Node.js ve Nginx kurarak projenizi 7/24 çalıştırabilirsiniz.
