import {config} from "@/entrypoints/utils/config";

const GOOGLE_TRANSLATE_RPC_ID = 'MkEWBc';
const GOOGLE_TRANSLATE_BATCH_URLS = [
    `https://translate.google.com/_/TranslateWebserverUi/data/batchexecute?rpcids=${GOOGLE_TRANSLATE_RPC_ID}`,
    `https://translate.google.co.uk/_/TranslateWebserverUi/data/batchexecute?rpcids=${GOOGLE_TRANSLATE_RPC_ID}`,
] as const;
const GOOGLE_TRANSLATE_LEGACY_URL = 'https://translate.googleapis.com/translate_a/single';
const GOOGLE_TRANSLATE_TOTAL_TIMEOUT_MS = 15_000;
const GOOGLE_TRANSLATE_ATTEMPT_TIMEOUT_MS = 8_000;
const GOOGLE_ERROR_BODY_PREVIEW_LENGTH = 200;

type GoogleProvider = {
    name: string;
    translate: (timeoutMs: number) => Promise<string>;
};

function createGoogleBatchRequest(text: string, fromLang: string, toLang: string): string {
    const request = JSON.stringify([[text, fromLang, toLang, true], [null]]);
    return JSON.stringify([[[GOOGLE_TRANSLATE_RPC_ID, request, null, 'generic']]]);
}

function getArrayItem(value: unknown, index: number): unknown {
    return Array.isArray(value) ? value[index] : undefined;
}

function joinTranslationSegments(value: unknown): string | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const translatedText = value
        .map(segment => Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : '')
        .join('');
    return translatedText.length > 0 ? translatedText : null;
}

function getGoogleBatchSegments(payload: unknown): unknown {
    const translationGroups = getArrayItem(payload, 1);
    const firstGroup = getArrayItem(translationGroups, 0);
    const firstTranslation = getArrayItem(firstGroup, 0);
    return getArrayItem(firstTranslation, 5);
}

export function parseGoogleBatchResponse(responseBody: string): string {
    const lines = responseBody
        .replace(/^\)\]\}'(?:\r?\n)?/, '')
        .split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('[')) {
            continue;
        }

        let records: unknown;
        try {
            records = JSON.parse(trimmedLine);
        } catch {
            continue;
        }

        if (!Array.isArray(records)) {
            continue;
        }

        for (const record of records) {
            if (
                !Array.isArray(record)
                || record[0] !== 'wrb.fr'
                || record[1] !== GOOGLE_TRANSLATE_RPC_ID
                || typeof record[2] !== 'string'
            ) {
                continue;
            }

            let payload: unknown;
            try {
                payload = JSON.parse(record[2]);
            } catch {
                continue;
            }

            const translatedText = joinTranslationSegments(getGoogleBatchSegments(payload));
            if (translatedText !== null) {
                return translatedText;
            }
        }
    }

    throw new Error('Unexpected response format');
}

export function parseGoogleLegacyResponse(responseBody: string): string {
    let result: unknown;
    try {
        result = JSON.parse(responseBody);
    } catch {
        throw new Error('Response is not JSON');
    }

    const translatedText = joinTranslationSegments(getArrayItem(result, 0));
    if (translatedText === null) {
        throw new Error('Unexpected response format');
    }
    return translatedText;
}

function formatResponseBody(responseBody: string): string {
    if (/<!doctype html|<html[\s>]/i.test(responseBody)) {
        return 'Received an HTML page (possibly triggered a CAPTCHA)';
    }

    const compactBody = responseBody.replace(/\s+/g, ' ').trim();
    if (compactBody.length === 0) {
        return '';
    }
    return compactBody.slice(0, GOOGLE_ERROR_BODY_PREVIEW_LENGTH);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function createGoogleParseError(error: unknown, responseBody: string): Error {
    const responsePreview = formatResponseBody(responseBody) || 'Empty response';
    return new Error(`${getErrorMessage(error)}, response summary: ${responsePreview}`);
}

async function fetchGoogleResponse(
    url: string | URL,
    init: RequestInit,
    timeoutMs: number,
): Promise<{responseBody: string}> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {...init, signal: controller.signal});
        const responseBody = await response.text();
        if (!response.ok) {
            const bodyPreview = formatResponseBody(responseBody);
            throw new Error(
                `HTTP ${response.status} ${response.statusText}${bodyPreview ? `, response: ${bodyPreview}` : ''}`,
            );
        }
        return {responseBody};
    } catch (error) {
        if (controller.signal.aborted) {
            throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function translateGoogleBatch(
    endpoint: string,
    text: string,
    fromLang: string,
    toLang: string,
    timeoutMs: number,
): Promise<string> {
    const {responseBody} = await fetchGoogleResponse(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: new URLSearchParams({
            'f.req': createGoogleBatchRequest(text, fromLang, toLang),
        }).toString(),
    }, timeoutMs);
    try {
        return parseGoogleBatchResponse(responseBody);
    } catch (error) {
        throw createGoogleParseError(error, responseBody);
    }
}

async function translateGoogleLegacy(
    text: string,
    fromLang: string,
    toLang: string,
    timeoutMs: number,
): Promise<string> {
    const url = new URL(GOOGLE_TRANSLATE_LEGACY_URL);
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', fromLang);
    url.searchParams.set('tl', toLang);
    url.searchParams.set('dt', 't');
    url.searchParams.set('strip', '1');
    url.searchParams.set('nonced', '1');
    url.searchParams.set('q', text);

    const {responseBody} = await fetchGoogleResponse(url, {method: 'GET'}, timeoutMs);
    try {
        return parseGoogleLegacyResponse(responseBody);
    } catch (error) {
        throw createGoogleParseError(error, responseBody);
    }
}

export async function translateGoogleText(
    text: string,
    fromLang: string,
    toLang: string,
): Promise<string> {
    const providers: GoogleProvider[] = [
        ...GOOGLE_TRANSLATE_BATCH_URLS.map((endpoint, index) => ({
            name: index === 0 ? 'Primary web RPC' : 'Fallback web RPC',
            translate: (timeoutMs: number) => translateGoogleBatch(
                endpoint,
                text,
                fromLang,
                toLang,
                timeoutMs,
            ),
        })),
        {
            name: 'Legacy gtx endpoint',
            translate: (timeoutMs: number) => translateGoogleLegacy(
                text,
                fromLang,
                toLang,
                timeoutMs,
            ),
        },
    ];
    const deadline = Date.now() + GOOGLE_TRANSLATE_TOTAL_TIMEOUT_MS;
    const failures: string[] = [];

    for (const provider of providers) {
        const remainingTime = deadline - Date.now();
        if (remainingTime <= 0) {
            break;
        }

        try {
            return await provider.translate(Math.min(GOOGLE_TRANSLATE_ATTEMPT_TIMEOUT_MS, remainingTime));
        } catch (error) {
            failures.push(`${provider.name}: ${getErrorMessage(error)}`);
        }
    }

    const failureSummary = failures.length > 0 ? failures.join('；') : '总请求时间已耗尽';
    throw new Error(`All Google Translate anonymous endpoints failed: ${failureSummary}`);
}

async function google(message: {origin: string}) {
    if (typeof message.origin !== 'string') {
        throw new Error('Google Translate supports single text only');
    }
    return translateGoogleText(message.origin, config.from, config.to);
}

export default google;
