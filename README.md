# AI News Server

Express.js tabanlı AI News API sunucusu. TypeScript ile geliştirilmiş, özellik bazlı mimari kullanır.

## 🚀 Başlangıç

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn

### Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Ortam değişkenlerini ayarlayın:
```bash
# .env dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:
PORT=3000
NODE_ENV=development
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Production build:
```bash
npm run build
npm start
```

## 📁 Proje Yapısı

```
src/
├── app.ts              # Express uygulaması
├── server.ts           # HTTP sunucusu
├── config/             # Yapılandırma dosyaları
│   └── index.ts
├── core/               # Paylaşılan modüller
│   ├── middlewares/    # Global middleware'ler
│   ├── types/          # TypeScript tipleri
│   ├── utils/          # Yardımcı fonksiyonlar
│   └── constants/      # Sabitler
└── features/           # Özellik bazlı modüller
    └── [feature]/
        ├── [feature].controller.ts
        ├── [feature].service.ts
        ├── [feature].model.ts
        ├── [feature].routes.ts
        └── [feature].types.ts
```

## 🛠️ Kullanılan Teknolojiler

- **Express.js** - Web framework
- **TypeScript** - Tip güvenliği
- **Helmet** - Güvenlik middleware'i
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Dotenv** - Ortam değişkenleri

## 📝 API Endpoints

- `GET /health` - Sunucu durumu kontrolü
- `GET /api` - API bilgileri

## 🔧 Geliştirme

### Scripts
- `npm run dev` - Geliştirme sunucusu (nodemon ile)
- `npm run build` - TypeScript build
- `npm start` - Production sunucusu

### Yeni Özellik Ekleme

1. `src/features/` altında yeni klasör oluşturun
2. Gerekli dosyaları oluşturun (controller, service, routes, vb.)
3. Route'ları `app.ts`'e ekleyin

## 📄 Lisans

ISC 