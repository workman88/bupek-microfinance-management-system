import compression from 'compression';

/**
 * Compression middleware
 */
export const compressionMiddleware = compression({
  level: 6,
  threshold: 10 * 1000, // 10KB
});

export default compressionMiddleware;
