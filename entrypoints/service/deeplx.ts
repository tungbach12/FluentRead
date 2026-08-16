import {services} from "../utils/option";
import {config} from "@/entrypoints/utils/config";
import {getDeepLXEndpoints} from "@/entrypoints/utils/deeplx";

const DEEPLX_TOTAL_TIMEOUT_MS = 20_000;
const DEEPLX_ATTEMPT_TIMEOUT_MS = 8_000;
const DEEPLX_ERROR_BODY_PREVIEW_LENGTH = 200;

function normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    if (normalized === "auto") {
        return "AUTO";
    }
    if (normalized === "zh-hans" || normalized === "zh-cn") {
        return "ZH";
    }
    if (normalized === "zh-tw" || normalized === "zh-hant") {
        return "ZH-HANT";
    }
    return language.toUpperCase();
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function formatResponseBody(responseBody: string): string {
    const compactBody = responseBody.replace(/\s+/g, " ").trim();
    return compactBody.slice(0, DEEPLX_ERROR_BODY_PREVIEW_LENGTH);
}

async function fetchDeepLX(url: string, requestInit: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {...requestInit, signal: controller.signal});
    } catch (error) {
        if (controller.signal.aborted) {
            throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
        }
        throw new Error(`Network error: ${getErrorMessage(error)}`);
    } finally {
        clearTimeout(timeout);
    }
}

async function translateFromDeepLX(
    url: string,
    text: string,
    sourceLang: string,
    targetLang: string,
    token: string,
    timeoutMs: number,
): Promise<string> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchDeepLX(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
            text,
            source_lang: sourceLang,
            target_lang: targetLang,
        }),
    }, timeoutMs);

    const responseBody = await response.text();
    if (!response.ok) {
        const preview = formatResponseBody(responseBody);
        throw new Error(`HTTP ${response.status} ${response.statusText}${preview ? `, response: ${preview}` : ""}`);
    }

    let result: unknown;
    try {
        result = JSON.parse(responseBody);
    } catch (error) {
        throw new Error(`Response is not JSON: ${getErrorMessage(error)}`);
    }

    if (!result || typeof result !== "object") {
        throw new Error("Unexpected response format");
    }

    const responseData = result as {code?: unknown; data?: unknown; message?: unknown};
    if (responseData.code !== undefined && responseData.code !== 200) {
        throw new Error(`DeepLX returned an error: ${String(responseData.message || `code ${String(responseData.code)}`)}`);
    }
    if (typeof responseData.data !== "string" || responseData.data.trim().length === 0) {
        throw new Error("Unexpected response format: missing translation");
    }

    return responseData.data;
}

export function normalizeDeepLXLanguage(language: string): string {
    return normalizeLanguage(language);
}

export function getDeepLXRequestLanguages(from: string, to: string): {sourceLang: string; targetLang: string} {
    return {
        sourceLang: normalizeLanguage(from),
        targetLang: normalizeLanguage(to),
    };
}

export async function translateDeepLXText(
    text: string,
    serviceKey: string = services.deeplx,
): Promise<string> {
    if (typeof text !== "string") {
        throw new Error("DeepLX translation supports single text only");
    }

    const token = config.token[serviceKey]?.trim() || "";
    const endpoints = getDeepLXEndpoints(
        config.deeplx,
        config.proxy[serviceKey],
        token,
    );
    const {sourceLang, targetLang} = getDeepLXRequestLanguages(config.from, config.to);
    const deadline = Date.now() + DEEPLX_TOTAL_TIMEOUT_MS;
    const failures: string[] = [];

    for (const [index, endpoint] of endpoints.entries()) {
        const remainingTime = deadline - Date.now();
        if (remainingTime <= 0) {
            break;
        }

        try {
            return await translateFromDeepLX(
                endpoint,
                text,
                sourceLang,
                targetLang,
                token,
                Math.min(DEEPLX_ATTEMPT_TIMEOUT_MS, remainingTime),
            );
        } catch (error) {
            failures.push(`Fallback site ${index + 1}: ${getErrorMessage(error)}`);
        }
    }

    const failureSummary = failures.length > 0 ? failures.join("；") : "总请求时间已耗尽";
    throw new Error(`All DeepLX fallback sites failed: ${failureSummary}`);
}

async function deeplx(message: {origin: string}) {
    if (typeof message.origin !== "string") {
        throw new Error("DeepLX translation supports single text only");
    }

    return translateDeepLXText(message.origin, services.deeplx);
}

export default deeplx;
