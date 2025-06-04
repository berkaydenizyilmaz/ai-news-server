/**
 * Server Module
 * 
 * HTTP sunucusunu başlatır ve yönetir.
 * Graceful shutdown, hata yakalama ve process event'lerini yönetir.
 */

import http from 'http';
import app from './app';
import { config } from '@/config';

const server = http.createServer(app);

/**
 * Sunucuyu başlatır ve bağlantı bilgilerini konsola yazdırır.
 */
const startServer = () => {
  server.listen(config.port, () => {
    console.log(`🚀 Server şu portta çalışıyor: ${config.port}`);
    console.log(`📍 Ortam: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    console.log(`🔗 API endpoint: http://localhost:${config.port}/api`);
  });
};

/**
 * Graceful Shutdown Handlers
 * 
 * SIGTERM ve SIGINT sinyallerini yakalayarak sunucuyu güvenli bir şekilde kapatır.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, güvenli bir şekilde kapatılıyor');
  server.close(() => {
    console.log('İşlem tamamlandı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT alındı, güvenli bir şekilde kapatılıyor');
  server.close(() => {
    console.log('İşlem tamamlandı');
    process.exit(0);
  });
});

/**
 * Global Error Handlers
 * 
 * İşlenmemiş promise rejection'ları ve exception'ları yakalayarak
 * uygulamanın kontrolsüz kapanmasını önler.
 */
process.on('unhandledRejection', (err: Error) => {
  console.error('İşlenmemiş Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  console.error('İşlenmemiş Exception:', err.message);
  process.exit(1);
});

startServer(); 