/**
 * Translation API proxy module.
 * Integrates translation queue management as the middle layer between the
 * translate functions and the background translation service.
 */

import { enqueueTranslation, clearTranslationQueue } from './translateQueue';
import browser from 'webextension-polyfill';
import { config, saveConfig } from './config';
import { detectlang } from './common';
import { resolveConfiguredModel, servicesType } from './option';
import { getPageTranslationContext } from './pageContext';
import { getMissingCredentialMessage } from './configValidation';

// Debug
const isDev = process.env.NODE_ENV === 'development';
const VIDEO_COUNT_SAVE_INTERVAL = 10_000;
let videoCountSaveTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleVideoCountSave(): void {
  config.count++;
  if (videoCountSaveTimer) return;

  videoCountSaveTimer = setTimeout(() => {
    videoCountSaveTimer = undefined;
    void saveConfig().catch((error) => console.error('[FluentRead] Failed to save video translation count:', error));
  }, VIDEO_COUNT_SAVE_INTERVAL);
}

/**
 * Unified entry point for the translation API.
 * All translation requests should go through this function so the queue and
 * retry logic are centrally managed.
 *
 * @param origin the original text
 * @param context context information, usually the page title
 * @param options translation options
 * @returns a promise resolving to the translated result
 */
export async function translateText(origin: string, context: string = document.title, options: TranslateOptions = {}): Promise<string> {
  const {
    maxRetries = 3, 
    retryDelay = 1000, 
    timeout = 45000,
    useCache = config.useCache,
  } = options;
  // Check whether origin is empty or only whitespace
  const cleanedOrigin = origin?.replace(/[\s\u3000]/g, '') || '';
  if (!cleanedOrigin || cleanedOrigin.length === 0) {
    return origin || '';
  }

  assertTranslationCredentials();

  // If the target language equals the source text language, return the original
  if (detectlang(origin.replace(/[\s\u3000]/g, '')) === config.to) {
    return origin;
  }

  const pageContext = await resolvePageContext(options.pageContext);

  // Increment the translation count
  config.count++;
  // Save the config to persist the count
  void saveConfig().catch((error) => console.error('[FluentRead] Failed to save translation count:', error));

  // Route the translation request through the queue
  return enqueueTranslation(async () => {
    // Create the translation task
    const translationTask = async (retryCount: number = 0): Promise<string> => {
      try {
        // Send the translation request to the background script
        const result = await Promise.race([
          browser.runtime.sendMessage({ context, pageContext, origin, useCache }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Translation request timed out')), timeout)
          )
        ]) as string;

        // If the result is empty or identical to the original, return the original
        if (!result || result === origin) {
          return origin;
        }

        return result;
      } catch (error) {
        // Handle the error; retry according to the retry policy
        if (retryCount < maxRetries) {
          if (isDev) {
            console.log(`[TranslateAPI] Translation failed, retrying ${retryCount + 1}/${maxRetries}, reason:`, error);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return translationTask(retryCount + 1);
        }
        
        // Max retries exceeded, rethrow
        throw error;
      }
    };

    // Start the translation task
    return translationTask();
  });
}

/**
 * Batch-translate plain text segments. Used in translation-only mode to preserve
 * the original DOM structure and avoid machine translation APIs rewriting tags
 * and attributes.
 */
export async function translateTextBatch(
  origins: string[],
  context: string = document.title,
  options: TranslateOptions = {},
): Promise<string[]> {
  if (origins.length === 0) return [];

  assertTranslationCredentials();

  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 45000,
    useCache = config.useCache,
  } = options;
  const pageContext = await resolvePageContext(options.pageContext);

  config.count++;
  void saveConfig().catch((error) => console.error('[FluentRead] Failed to save translation count:', error));

  return enqueueTranslation(async () => {
    const translationTask = async (retryCount: number = 0): Promise<string[]> => {
      try {
        const result = await Promise.race([
          browser.runtime.sendMessage({ context, pageContext, origin: origins, useCache }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Translation request timed out')), timeout)
          )
        ]);

        if (!Array.isArray(result) || result.length !== origins.length || result.some(item => typeof item !== 'string')) {
          throw new Error('Batch translation returned an unexpected format');
        }

        return result as string[];
      } catch (error) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return translationTask(retryCount + 1);
        }
        throw error;
      }
    };

    return translationTask();
  });
}

/**
 * Translate video subtitles. Video subtitles use a dedicated service config but
 * still go through the background script's unified requests, caching, and error
 * handling; only the plain-text subtitles already provided by YouTube are sent.
 */
export async function translateVideoText(origin: string): Promise<string> {
  const cleanedOrigin = origin?.replace(/[\s\u3000]/g, '') || '';
  if (!cleanedOrigin) return origin || '';

  // Video subtitles are high-frequency, short-text requests. The count stays in
  // memory and is flushed in low-frequency batches to keep storage writes and
  // config subscription callbacks off the player's main thread.
  scheduleVideoCountSave();
  return enqueueTranslation(async () => {
    return Promise.race([
      browser.runtime.sendMessage({
        context: `YouTube video subtitles: ${document.title}`,
        origin,
        useCache: config.useCache,
        serviceOverride: config.videoService,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Video subtitle translation request timed out')), 20000)),
    ]) as Promise<string>;
  });
}

/**
 * Clear the translation queue when the user leaves the page or cancels translation.
 */
export function cancelAllTranslations() {
  if (isDev) {
    console.log('[TranslateAPI] Cancelled all pending translation tasks');
  }
  clearTranslationQueue();
}

/**
 * Translation options interface
 */
export interface TranslateOptions {
  /** Maximum retry count */
  maxRetries?: number;
  /** Retry delay (ms) */
  retryDelay?: number;
  /** Timeout (ms) */
  timeout?: number;
  /** Whether to use the cache */
  useCache?: boolean;
  /** Page reference context sent to the LLM; auto-extracted from the current page when omitted. */
  pageContext?: string;
}

function assertTranslationCredentials(): void {
  const message = getMissingCredentialMessage(config.service, config);
  if (message) throw new Error(message);
}

async function resolvePageContext(suppliedContext?: string): Promise<string | undefined> {
  const selectedModel = resolveConfiguredModel(config.model[config.service], config.customModel[config.service]);
  if (!config.enableAIContext || !servicesType.isUseAIContext(config.service, selectedModel)) return undefined;
  return suppliedContext?.trim().slice(0, 4000) || await getPageTranslationContext() || undefined;
}
