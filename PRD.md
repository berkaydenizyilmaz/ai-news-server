# Proje: AI Destekli Haber Platformu ve Forumu

**Versiyon:** 1.0
**Son Güncelleme Tarihi:** 4 Haziran 2025
**Proje Sahibi:** Berkay Deniz Yılmaz

## 1. Giriş

Bu proje, RSS beslemeleri aracılığıyla çeşitli kaynaklardan haberleri otomatik olarak toplayan, bu haberleri yapay zeka (AI) kullanarak analiz eden, farklı kaynaklardan bilgilerle zenginleştirerek özgün ve sentezlenmiş haber metinleri üreten bir platform geliştirmeyi amaçlamaktadır. Üretilen haberler, AI tarafından belirlenen bir güven puanı ve kullanılan kaynaklarla birlikte sunulacaktır. Ayrıca, kullanıcıların bu haberleri tartışabileceği ve genel konular üzerine forumlar oluşturabileceği bir etkileşim alanı da bulunacaktır.

## 2. Amaçlar

* Farklı kaynaklardan gelen haberleri tek bir merkezde toplamak.
* AI kullanarak haberleri analiz etmek, doğrulamak ve zenginleştirmek.
* Kullanıcılara, AI tarafından üretilmiş, kaynakları belli ve güvenilirliği değerlendirilmiş haberler sunmak.
* Haberler ve genel konular üzerine bir topluluk tartışma ortamı (forum) oluşturmak.

## 3. Hedef Kitle

* Doğrulanmış ve çeşitli perspektifler sunan haberlere hızla ulaşmak isteyen genel internet kullanıcıları.
* Güncel olayları tartışmayı seven ve farklı görüşlere açık bireyler.
* Akademisyenler, öğrenciler ve araştırmacılar için derlenmiş ve analiz edilmiş haber kaynağı arayanlar.

## 4. Kullanıcı Rolleri ve Yetkiler

* **Ziyaretçi (Kayıtsız Kullanıcı):**
    * Haberleri okuyabilir.
    * Forum konularını ve mesajlarını görüntüleyebilir.
    * Yorum yapamaz, forumda konu açamaz/cevap yazamaz.
* **Kullanıcı (Kayıtlı Kullanıcı):**
    * Ziyaretçilerin tüm yetkilerine sahiptir.
    * Haberlere yorum yapabilir.
    * Haberleri şikayet edebilir/geri bildirimde bulunabilir.
    * Forumda yeni konu açabilir ve mevcut konulara cevap yazabilir.
* **Moderatör:**
    * Kullanıcıların tüm yetkilerine sahiptir.
    * Forumdaki konuları ve mesajları düzenleyebilir, silebilir.
    * Forum kurallarını ihlal eden kullanıcılara uyarı verebilir veya kısıtlayabilir.
* **Admin:**
    * Moderatörlerin ve kullanıcıların tüm yetkilerine sahiptir.
    * RSS besleme linklerini ekleyebilir, düzenleyebilir, silebilir.
    * Kullanıcı hesaplarını yönetebilir (rol atama, engelleme vb.).
    * Şikayet edilen haberleri ve yorumları inceleyebilir, yönetebilir.
    * Site genel ayarlarını yönetebilir.

## 5. Fonksiyonel Gereksinimler

### 5.1. Haber Yönetimi ve AI Entegrasyonu

* **5.1.1. RSS Besleme Yönetimi (Admin):**
    * Admin paneli üzerinden yeni RSS besleme linkleri eklenebilmeli.
    * Mevcut RSS beslemeleri listelenebilmeli, düzenlenebilmeli ve silinebilmeli.
* **5.1.2. Otomatik Haber Çekme:**
    * Sistem, eklenen RSS beslemelerinden periyodik olarak yeni haber başlıklarını ve linklerini çekmeli.
* **5.1.3. Haber İçeriği Çekme:**
    * RSS üzerinden gelen kısa içerik yerine, haberin orijinal linkine gidilerek tam haber metni çekilmeli.
* **5.1.4. AI Destekli Haber Analizi ve Sentezi:**
    * Çekilen haber metni AI tarafından analiz edilmeli.
    * AI, analiz edilen haberle ilgili internet üzerinde farklı kaynaklardan ek bilgiler ve teyitler aramalı.
    * Toplanan bilgiler ve ana haber metni kullanılarak AI tarafından yeni, kapsamlı ve sentezlenmiş bir haber metni oluşturulmalı.
* **5.1.5. Güven Puanı ve Kaynak Gösterimi:**
    * AI tarafından üretilen her haber için bir "güven puanı" hesaplanmalı ve gösterilmeli.
    * Sentez haberin oluşturulmasında kullanılan tüm kaynaklar (hem ana kaynak hem de AI'nın bulduğu ek kaynaklar) listelenmeli.
    * AI tarafından üretilen haber ile orijinal (base) kaynak arasındaki temel farklar belirtilmeli.
* **5.1.6. Haber Listeleme ve Görüntüleme:**
    * Üretilen haberler sitede listelenmeli (kronolojik, popülerliğe göre vb.).
    * Haber detay sayfasında sentezlenmiş metin, güven puanı, kaynaklar ve farklar açıkça gösterilmeli.

### 5.2. Kullanıcı Etkileşimi (Haberler)

* **5.2.1. Yorum Yapma:**
    * Kayıtlı kullanıcılar haberlere yorum yazabilmeli.
    * Yorumlar hiyerarşik (yanıtlanabilir) şekilde görüntülenebilmeli.
* **5.2.2. Şikayet ve Geri Bildirim:**
    * Kullanıcılar, yanlış, eksik veya sorunlu olduğunu düşündükleri haberleri gerekçe belirterek şikayet edebilmeli.
    * Bu şikayetler admin paneline düşmeli.

### 5.3. Forum Sistemi

* **5.3.1. Konu Açma ve Yönetimi:**
    * Kayıtlı kullanıcılar forumda yeni başlıklar (konular) açabilmeli.
* **5.3.2. Mesaj Yazma:**
    * Kayıtlı kullanıcılar mevcut konulara mesaj yazabilmeli.
* **5.3.3. Haber Alıntılama:**
    * Kullanıcılar, forumda bir konuyu tartışırken sitedeki haberlerden alıntı yapabilmeli ve bu alıntı haber linkini içermeli.
* **5.3.4. Forum Moderasyonu (Moderatör & Admin):**
    * Moderatörler ve Adminler, forum kurallarına uymayan konuları/mesajları düzenleyebilmeli veya silebilmeli.

### 5.4. Kullanıcı Hesap Yönetimi

* **5.4.1. Kayıt Olma:**
    * Yeni kullanıcılar e-posta ve şifre ile kayıt olabilmeli.
* **5.4.2. Giriş Yapma:**
    * Kayıtlı kullanıcılar sisteme giriş yapabilmeli.
* **5.4.3. Profil Yönetimi (Basit):**
    * Kullanıcılar şifrelerini değiştirebilmeli.

### 5.5. Admin Paneli

* **5.5.1. RSS Yönetimi:** (Bkz: 5.1.1)
* **5.5.2. Kullanıcı Yönetimi:**
    * Tüm kullanıcıları listeleme.
    * Kullanıcı rollerini değiştirme (kullanıcı -> moderatör vb.).
    * Kullanıcı engelleme/engel kaldırma.
* **5.5.3. İçerik Yönetimi:**
    * Şikayet edilen haberleri ve yorumları görüntüleme, değerlendirme ve işlem yapma (yayından kaldırma, düzenleme talebi vb.).
    * Forumda moderasyon gerektiren durumları yönetme.
* **5.5.4. Sistem İzleme (İsteğe Bağlı Temel Seviye):**
    * İşlenen haber sayısı, aktif kullanıcı sayısı gibi temel istatistikler.

## 6. Teknik Olmayan Gereksinimler

* **Performans:**
    * Sayfa yükleme hızları optimize edilmeli.
* **Güvenlik:**
    * Kullanıcı verileri (özellikle şifreler) güvenli bir şekilde saklanmalı.
    * SQL injection, XSS gibi yaygın zafiyetlere karşı önlemler alınmalı.
* **Kullanılabilirlik:**
    * Tüm kullanıcı rolleri için arayüzler anlaşılır ve kolay kullanılabilir olmalı.
    * Mobil uyumlu (responsive) tasarım.
* **Ölçeklenebilirlik:**
    * Artan kullanıcı sayısı ve haber miktarına göre sistemin performansı düşmemeli, gerektiğinde kaynak artırımına uygun olmalı.
* **Güvenilirlik:**
    * Platformun kesintisiz hizmet vermesi hedeflenmeli.

## 7. Başarı Metrikleri

* Günlük/Aylık aktif kullanıcı sayısı.
* AI tarafından işlenen ve yayınlanan toplam haber sayısı.
* Haber başına düşen ortalama yorum sayısı.
* Forumdaki toplam konu ve mesaj sayısı.
* Kullanıcıların platformda geçirdiği ortalama süre.
* Kullanıcı geri bildirimleri ve memnuniyet oranı.
* AI tarafından verilen ortalama güven puanlarının zaman içindeki değişimi/iyileşmesi.

## 8. Gelecek Planları / Kapsam Dışı (İlk Versiyon İçin)

* Kullanıcılara özel kişiselleştirilmiş haber akışları.
* Daha gelişmiş AI modelleri ile duygu analizi, taraflılık tespiti.
* Mobil uygulama (iOS/Android).
* Detaylı kullanıcı profilleri ve etkileşim geçmişi.

## 9. Teknoloji Stack Önerisi (İsteğe Bağlı)

Proje sahibinin mevcut yetkinlikleri göz önüne alındığında (Next.js, React, Express, Supabase/MongoDB), aşağıdaki gibi bir teknoloji yığını düşünülebilir:

* **Frontend:** React
* **Backend:** Express.js
* **Veritabanı:** Supabase (PostgreSQL tabanlı olduğu için ilişkisel veriler ve auth için iyi)
* **AI Kısmı:** API