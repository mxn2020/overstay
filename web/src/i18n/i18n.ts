import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import all translations
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import it from './locales/it.json'
import pt from './locales/pt.json'
import nl from './locales/nl.json'
import pl from './locales/pl.json'
import sv from './locales/sv.json'
import da from './locales/da.json'
import no from './locales/no.json'
import fi from './locales/fi.json'
import el from './locales/el.json'
import cs from './locales/cs.json'
import ro from './locales/ro.json'
import hu from './locales/hu.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'
import ar from './locales/ar.json'
import fa from './locales/fa.json'
import he from './locales/he.json'

export const RTL_LANGUAGES = ['ar', 'fa', 'he']

export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norsk', flag: '🇳🇴' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
]

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            de: { translation: de },
            fr: { translation: fr },
            es: { translation: es },
            it: { translation: it },
            pt: { translation: pt },
            nl: { translation: nl },
            pl: { translation: pl },
            sv: { translation: sv },
            da: { translation: da },
            no: { translation: no },
            fi: { translation: fi },
            el: { translation: el },
            cs: { translation: cs },
            ro: { translation: ro },
            hu: { translation: hu },
            ru: { translation: ru },
            uk: { translation: uk },
            zh: { translation: zh },
            ja: { translation: ja },
            ar: { translation: ar },
            fa: { translation: fa },
            he: { translation: he },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupQuerystring: 'lang',
        },
    })

export default i18n
