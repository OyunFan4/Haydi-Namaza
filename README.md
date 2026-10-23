# Haydi Namaza v11 — veri kurtarma

- v10 arayüzü, namaz takibi ve mevcut localStorage kayıtları korunur.
- Öncelik: İmsakiyem API. İl/ilçe veya yanıt biçimi başarısızsa AlAdhan `method=13` üzerinden takvim alınır.
- Ekranda kullanılan veri kaynağı açıkça gösterilir. Yedek hesaplanan vakitler resmî Diyanet verisi olarak sunulmaz.
- Değiştirilen dosyalar: `imsakiyem.js`, `app.js`, `index.html`, `sw.js`. GitHub'a bütün paketi yükleyebilirsiniz.
- Canlı üretim API yanıtları ve telefon bildirimleri henüz test edilmedi; bunun bir bağlantı güvenilirliği düzeltmesi olduğu unutulmamalıdır.
- Servis çalışan eski ay kayıtlarını kaybetmez; mevcut namaz takip kayıtlarına dokunulmaz.
