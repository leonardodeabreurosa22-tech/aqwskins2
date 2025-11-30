import i18next from 'i18next';
import i18nextHttpMiddleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize i18next
i18next
  .use(Backend)
  .use(i18nextHttpMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es', 'fil'],
    defaultNS: 'common',
    ns: ['common', 'errors', 'emails', 'notifications'],
    detection: {
      order: ['header', 'querystring', 'cookie'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lang',
      lookupCookie: 'language',
      caches: ['cookie']
    },
    interpolation: {
      escapeValue: false
    }
  });

export const i18nMiddleware = i18nextHttpMiddleware.handle(i18next);

export { i18next };
