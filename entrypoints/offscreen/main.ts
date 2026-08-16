/**
 * Chrome Translation API Offscreen 文档
 * 在 offscreen 环境中处理 Chrome Translation API 调用
 */

import { downloadImageOcrLanguages, recognizeImage } from './imageOcr';
import { translateImageInOffscreen } from './imageTranslation';

// 语言代码映射
const languageMap: { [key: string]: string } = {
    'zh-Hans': 'zh',
    'zh-Hant': 'zh-TW',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'ru': 'ru',
    'it': 'it',
    'pt': 'pt',
    'ar': 'ar',
    'hi': 'hi',
    'th': 'th',
    'vi': 'vi',
    'nl': 'nl',
    'pl': 'pl',
    'tr': 'tr'
};

// 检查是否支持 Chrome Translation API
function isChromeTranslationSupported(): boolean {
    console.log('检查 Translation API 支持:', {
        hasTranslation: 'translation' in self,
        hasTranslator: 'Translator' in self,
        hasLanguageDetector: 'LanguageDetector' in self,
        windowType: typeof window,
        selfType: typeof self
    });
    
    // 检查新的 API
    if ('translation' in self && 'createTranslator' in (self as any).translation) {
        return true;
    }
    
    // 检查旧的 API
    if ('Translator' in self && 'LanguageDetector' in self) {
        return true;
    }
    
    return false;
}

// 检测文本语言
async function detectLanguage(text: string): Promise<string> {
    try {
        // 尝试使用新的 API
        if ('translation' in self && 'createDetector' in (self as any).translation) {
            const detector = await (self as any).translation.createDetector();
            const results = await detector.detect(text);
            const detected = results.length > 0 ? results[0].detectedLanguage : 'en';
            console.log('新 API 检测结果:', detected);
            return detected;
        }
        
        // 尝试使用旧的 API
        if ('LanguageDetector' in self) {
            const detector = await (self as any).LanguageDetector.create();
            const results = await detector.detect(text);
            const detected = results.length > 0 ? results[0].detectedLanguage : 'en';
            console.log('旧 API 检测结果:', detected);
            return detected;
        }
    } catch (error) {
        console.warn('Language detection failed:', error);
    }
    
    // 回退到简单检测
    const chineseRegex = /[\u4e00-\u9fff]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;
    
    if (chineseRegex.test(text)) {
        return 'zh';
    } else if (japaneseRegex.test(text)) {
        return 'ja';
    } else if (koreanRegex.test(text)) {
        return 'ko';
    } else {
        return 'en';
    }
}

// 执行翻译
async function performTranslation(text: string, fromLang: string, toLang: string): Promise<string> {
    console.log('开始翻译:', { text: text.substring(0, 50) + '...', fromLang, toLang });
    
    try {
        let translator;
        
        // 尝试使用新的 API
        if ('translation' in self && 'createTranslator' in (self as any).translation) {
            console.log('使用新的 translation API');
            translator = await (self as any).translation.createTranslator({
                sourceLanguage: fromLang,
                targetLanguage: toLang
            });
        }
        // 尝试使用旧的 API
        else if ('Translator' in self) {
            console.log('使用旧的 Translator API');
            translator = await (self as any).Translator.create({
                sourceLanguage: fromLang,
                targetLanguage: toLang
            });
        } else {
            throw new Error('No translation API available');
        }

        let translatedText = '';
        
        // 检查是否支持流式翻译
        if (translator.translateStreaming) {
            console.log('使用流式翻译');
            const stream = translator.translateStreaming(text);
            for await (const chunk of stream) {
                translatedText += chunk;
            }
        } else if (translator.translate) {
            console.log('使用普通翻译');
            translatedText = await translator.translate(text);
        } else {
            throw new Error('Translator does not support this translation method');
        }

        console.log('翻译完成:', translatedText.substring(0, 50) + '...');
        return translatedText;
        
    } catch (error) {
        console.error('翻译执行失败:', error);
        throw error;
    }
}

// 处理翻译请求
async function handleTranslationRequest(data: any): Promise<string> {
    const { text, from, to } = data;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return ""
    }

    // 检查是否支持 Chrome Translation API
    if (!isChromeTranslationSupported()) {
        throw new Error('Chrome Translation API is not supported in this browser. Please use Google Chrome v138 stable or newer.');
    }

    // 声明变量以便在 catch 块中使用
    let detectedLang = from;
    let fromLang = from;
    let toLang = to;
    
    try {
        // 检测源语言
        if (from === 'auto') {
            detectedLang = await detectLanguage(text);
            console.log('自动检测到的语言:', detectedLang);
        }
        
        // 映射语言代码 - 确保使用 Chrome API 支持的格式
        fromLang = languageMap[detectedLang] || detectedLang;
        toLang = languageMap[to] || to;

        console.log('语言映射:', { 
            original: { from, to }, 
            detected: detectedLang,
            mapped: { fromLang, toLang }
        });

        // 如果源语言和目标语言相同，不需要翻译
        if (fromLang === toLang) {
            console.log('源语言和目标语言相同，返回原文');
            return text;
        }

        // 执行翻译
        return await performTranslation(text, fromLang, toLang);

    } catch (error) {
        console.error('Chrome Translation API error:', error);
        console.error('错误详情:', {
            error: error,
            message: error instanceof Error ? error.message : 'Unknown error',
            from: from,
            to: to,
            detectedLang: detectedLang,
            fromLang: fromLang,
            toLang: toLang
        });
        
        // 提供更友好的错误信息
        if (error instanceof Error) {
            if (error.message.includes('not available') || error.message.includes('not ready')) {
                throw new Error('Chrome Translation API is temporarily unavailable. A language model may need to be downloaded. Please retry later.');
            } else if (error.message.includes('language') || error.message.includes('not supported')) {
                throw new Error(`Unsupported language pair: ${fromLang} -> ${toLang}. Try another pair or check your browser version.`);
            } else if (error.message.includes('model')) {
                throw new Error('Translation model is not ready. Please retry later or check the network connection.');
            }
        }
        
        throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // console.log('Offscreen 收到消息:', message);
    
    if (message.type === 'CHROME_TRANSLATE_OFFSCREEN') {
        handleTranslationRequest(message.data)
            .then(result => {
                // console.log('Offscreen 翻译成功:', result.substring(0, 50) + '...');
                sendResponse({ success: true, result });
            })
            .catch(error => {
                console.error('Offscreen 翻译失败:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // 保持消息通道开放以支持异步响应
    }

    if (message.type === 'FLUENT_READ_IMAGE_OCR_OFFSCREEN') {
        recognizeImage(message.image, message.sourceLanguage)
            .then(lines => sendResponse({ success: true, lines }))
            .catch(error => {
                console.error('图片 OCR 失败:', error);
                sendResponse({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            });

        return true;
    }

    if (message.type === 'FLUENT_READ_IMAGE_TRANSLATE_OFFSCREEN') {
        translateImageInOffscreen(message.image, message.sourceLanguage, message.title || '')
            .then(result => sendResponse({ success: true, ...result }))
            .catch(error => {
                console.error('图片翻译失败:', error);
                sendResponse({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            });

        return true;
    }

    if (message.type === 'FLUENT_READ_IMAGE_OCR_DOWNLOAD_OFFSCREEN') {
        downloadImageOcrLanguages(message.languages || [])
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                console.error('图片 OCR 语言包下载失败:', error);
                sendResponse({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            });

        return true;
    }
    
    return false;
});

// 初始化检查
console.log('Chrome Translation Offscreen 初始化');
console.log('Translation API 支持状态:', isChromeTranslationSupported());
