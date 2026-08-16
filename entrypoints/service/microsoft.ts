import {config} from "@/entrypoints/utils/config";

const MICROSOFT_TRANSLATE_URL = "https://edge.microsoft.com/translate/translatetext";

type MicrosoftTranslation = {
    translations?: Array<{text?: string}>;
};

function escapeHtmlText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeHtmlText(text: string): string {
    return text
        .replace(/&#(?:0*39);|&#x0*27;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&gt;/gi, '>')
        .replace(/&lt;/gi, '<')
        .replace(/&amp;/gi, '&');
}

export async function translateMicrosoftTexts(
    texts: string[],
    fromLang: string,
    toLang: string,
): Promise<string[]> {
    if (texts.length === 0) return [];

    const url = new URL(MICROSOFT_TRANSLATE_URL);
    url.searchParams.set('from', fromLang === 'auto' ? '' : fromLang);
    url.searchParams.set('to', toLang);
    url.searchParams.set('isEnterpriseClient', 'false');

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // The endpoint always runs an HTML tag aligner. Escaping keeps plain-text
        // comparison operators and user input from being interpreted as markup.
        body: JSON.stringify(texts.map(escapeHtmlText)),
    });

    if (!resp.ok) {
        throw new Error(`Translation failed: ${resp.status} ${resp.statusText} body: ${await resp.text()}`);
    }

    const result = await resp.json() as MicrosoftTranslation[];
    if (!Array.isArray(result) || result.length !== texts.length) {
        throw new Error(`Microsoft Translator returned an unexpected item count: expected ${texts.length}, got ${Array.isArray(result) ? result.length : 0}`);
    }

    return result.map((item, index) => {
        const translatedText = item?.translations?.[0]?.text;
        if (typeof translatedText !== 'string') {
            throw new Error(`Microsoft Translator result #${index + 1} is missing its translation`);
        }
        return decodeHtmlText(translatedText);
    });
}

async function microsoft(message: {origin: string | string[]}) {
    const origin = message.origin;
    const isSingleText = typeof origin === 'string';
    const texts: string[] = typeof origin === 'string' ? [origin] : origin;
    const translations = await translateMicrosoftTexts(texts, config.from, config.to);
    if (!isSingleText) return translations;

    const translatedText = translations[0];
    if (translatedText === undefined) {
        throw new Error('Microsoft Translator returned no translation');
    }
    return translatedText;
}

export default microsoft;
