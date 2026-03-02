import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translations
import enTranslation from './locales/en/translation.json';

// Language configuration
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz', name: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'tk', name: 'Türkmençe', flag: '🇹🇲' },
  { code: 'az', name: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
  { code: 'mk', name: 'Македонски', flag: '🇲🇰' },
  { code: 'bs', name: 'Bosanski', flag: '🇧🇦' },
  { code: 'is', name: 'Íslenska', flag: '🇮🇸' },
  { code: 'mt', name: 'Malti', flag: '🇲🇹' }
];

// RTL languages
export const rtlLanguages = ['ar', 'ur', 'he'];

// Initialize i18next once (localizationService may already have initialized it).
if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslation
        }
      },
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage']
      },
      react: {
        useSuspense: true
      }
    });
}

// Load additional languages dynamically
export const loadLanguage = async (languageCode: string) => {
  if (languageCode === 'en') return; // English is already loaded

  try {
    const module = await import(`./locales/${languageCode}/translation.json`);
    i18n.addResourceBundle(languageCode, 'translation', module.default);
  } catch (error) {
    console.warn(`Failed to load language: ${languageCode}`, error);
  }
};

// Change language with RTL support
export const changeLanguage = async (languageCode: string) => {
  try {
    await loadLanguage(languageCode);
    await i18n.changeLanguage(languageCode);
    
    // Update document direction for RTL languages
    document.documentElement.dir = rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
    
    // Save language preference
    localStorage.setItem('i18nextLng', languageCode);
    
    return true;
  } catch (error) {
    console.error(`Failed to change language: ${languageCode}`, error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Check if current language is RTL
export const isRTL = () => {
  return rtlLanguages.includes(getCurrentLanguage());
};

export default i18n;
