import { currentModelIds, defaultModels, defaultOption, services, servicesType } from "./option";
import { normalizeCustomBodyMapping } from "./custom-body";

export type DeepSeekApiType = 'auto' | 'responses' | 'chat';
export type DeepSeekThinkingMode = 'enabled' | 'disabled';
export type VideoSubtitleDisplayMode = 'bilingual' | 'translation-only' | 'original-only';

interface IMapping {
    [key: string]: string;
}

// Extra info stored internally
interface IExtra {
    [key: string]: any
}

export class Config {
    on: boolean; // Whether the extension is on
    autoTranslate: boolean; // Whether to translate instantly
    from: string;
    to: string;
    hotkey: string;
    style: number;
    display: number = 1;
    service: string;
    videoTranslationEnabled: boolean; // Whether video subtitle translation (Beta) is enabled
    videoService: string; // Dedicated video subtitle translation service
    videoServiceDefaultMigrated: boolean; // Whether the video subtitle default service has been migrated
    videoSubtitleVisible: boolean; // Whether FluentRead video subtitles are shown
    videoSubtitleDisplayMode: VideoSubtitleDisplayMode; // Video subtitle display mode
    token: IMapping;
    requireApiKey: Record<string, boolean>; // Per-service and per-model API key validation switches
    ak: string;
    sk: string;
    appid: string;
    key: string;
    model: IMapping;
    customModel: IMapping;  // Custom model name
    customBody: IMapping;  // Custom request body (JSON string, stored per service), merged into the request body
    proxy: IMapping;  // Proxy address
    custom: string; // Local service address
    extra: IExtra;  // Additional (internal) info
    robot_id: IMapping;  // Bot ID (Coze-compatible)
    system_role: IMapping;
    user_role: IMapping;
    count: number;  // Translation count
    theme: string;  // Theme mode: 'auto' | 'light' | 'dark'
    useCache: boolean; // Whether to use the cache
    enableAIContext: boolean; // Whether to attach page context to AI translation
    disableFloatingBall: boolean; // Whether the floating ball is disabled
    floatingBallPosition: 'left' | 'right'; // Floating ball position
    floatingBallHotkey: string; // Floating ball hotkey
    customFloatingBallHotkey: string; // Custom floating ball hotkey
    customHotkey: string; // Custom mouse hover hotkey
    disableSelectionTranslator: boolean; // Whether selection translation is disabled
    disableImageTranslator: boolean; // Whether image translation is disabled
    deeplx: string; // DeepLX service address
    selectionTranslatorMode: string; // Selection translation display mode: 'disabled' | 'bilingual' | 'translation-only'
    selectionTranslatorTrigger: string; // Selection translation trigger: 'direct' | 'icon' | 'dot'
    newApiUrl: string; // New API URL
    maxConcurrentTranslations: number; // Maximum concurrent translations
    youdaoAppKey: string; // Youdao App Key
    youdaoAppSecret: string; // Youdao App Secret
    tencentSecretId: string; // Tencent Cloud Secret ID
    tencentSecretKey: string; // Tencent Cloud Secret Key
    azureOpenaiEndpoint: string; // Azure OpenAI endpoint URL
    animations: boolean; // Whether animations are enabled
    inputBoxTranslationTrigger: string; // Input box translation trigger
    inputBoxTranslationTarget: string; // Input box translation target language
    deepseekApiType: DeepSeekApiType; // DeepSeek API format
    deepseekThinkingMode: DeepSeekThinkingMode; // DeepSeek Chat Completion thinking mode

    constructor() {
        this.on = true;
        this.autoTranslate = false;
        this.from = defaultOption.from;
        this.to = defaultOption.to;
        this.style = defaultOption.style;
        this.display = defaultOption.display;
        this.hotkey = defaultOption.hotkey;
        this.service = defaultOption.service;
        this.videoTranslationEnabled = true; // YouTube subtitle translation on by default
        this.videoService = services.custom; // Video subtitles use the same 9Router custom service
        this.videoServiceDefaultMigrated = true;
        this.videoSubtitleVisible = true; // Show video subtitles by default
        this.videoSubtitleDisplayMode = 'bilingual'; // Bilingual display by default
        this.token = {};
        this.requireApiKey = {};
        this.ak = '';
        this.sk = '';
        this.appid = '';
        this.key = '';
        this.model = Object.fromEntries(defaultModels);
        this.customModel = {};
        this.customBody = {};
        this.proxy = {};
        this.custom = defaultOption.custom;
        this.extra = {};
        this.robot_id = {};
        this.system_role = systemRoleFactory();
        this.user_role = userRoleFactory();
        this.count = 0;
        this.theme = 'auto';  // Follow the system by default
        this.useCache = true; // Cache enabled by default
        this.enableAIContext = false; // AI context off by default to avoid extra request payloads and cost
        this.disableFloatingBall = true; // Floating ball off by default
        this.floatingBallPosition = 'right'; // Right side by default
        this.floatingBallHotkey = 'Alt+T'; // Default hotkey is Alt+T
        this.customFloatingBallHotkey = ''; // No custom hotkey
        this.customHotkey = ''; // No custom mouse hover hotkey
        this.disableSelectionTranslator = true; // Selection translation off by default
        this.disableImageTranslator = true; // Image translation off by default to avoid scanning page images on first install
        this.deeplx = defaultOption.deeplx; // DeepLX default service address
        this.selectionTranslatorMode = 'disabled'; // Selection translation off by default
        this.selectionTranslatorTrigger = 'icon'; // Show a discoverable action icon by default
        this.newApiUrl = 'http://localhost:3000'; // New API default URL
        this.maxConcurrentTranslations = 6; // Default maximum concurrency is 6
        this.youdaoAppKey = ''; // Youdao App Key
        this.youdaoAppSecret = ''; // Youdao App Secret
        this.tencentSecretId = ''; // Tencent Cloud Secret ID
        this.tencentSecretKey = ''; // Tencent Cloud Secret Key
        this.azureOpenaiEndpoint = ''; // Azure OpenAI endpoint URL
        this.animations = true; // Animations enabled by default
        this.inputBoxTranslationTrigger = 'disabled'; // Input box translation off by default
        this.inputBoxTranslationTarget = 'en'; // Default target language: English
        this.deepseekApiType = 'auto'; // DeepSeek auto-selects the API format by default
        this.deepseekThinkingMode = 'disabled'; // Thinking mode off for translations by default to reduce latency and output noise
    }
}

const modelMigrations: Record<string, Record<string, string>> = {
    [services.openai]: {
        gpt5: currentModelIds.openai,
    },
    [services.zhipu]: {
        'glm-4.5': currentModelIds.zhipu,
        'GLM-4-Flash': currentModelIds.zhipuFlash,
        'glm-4-plus': currentModelIds.zhipu,
        'glm-4': currentModelIds.zhipu,
        'glm-4v': currentModelIds.zhipu,
    },
    [services.moonshot]: {
        'kimi-k2-0711-preview': currentModelIds.moonshot,
        'kimi-k2-turbo-preview': currentModelIds.moonshot,
        'moonshot-v1-auto': currentModelIds.moonshot,
        'moonshot-v1-8k': currentModelIds.moonshot,
        'moonshot-v1-32k': currentModelIds.moonshot,
    },
    [services.claude]: {
        'claude-sonnet-4-0': currentModelIds.claudeSonnet,
        'claude-opus-4-1': currentModelIds.claudeOpus,
        'claude-3-5-sonnet': currentModelIds.claudeSonnet,
        'claude-3-5-sonnet-20241022': currentModelIds.claudeSonnet,
        'claude-3-opus': currentModelIds.claudeOpus,
        'claude-3-opus-20240229': currentModelIds.claudeOpus,
        'claude-3-5-haiku': currentModelIds.claudeHaiku,
        'claude-3-5-haiku-20241022': currentModelIds.claudeHaiku,
        'claude-3-5-haiku-latest': currentModelIds.claudeHaiku,
    },
    [services.grok]: {
        'grok-4-0709': currentModelIds.grok,
    },
    [services.groq]: {
        'llama-3.3-70b-versatile': currentModelIds.groqLarge,
        'llama-3.1-8b-instant': currentModelIds.groqSmall,
        'llama3-8b-8192': currentModelIds.groqSmall,
    },
    [services.yiyan]: {
        'ERNIE-Bot 4.0': currentModelIds.yiyan,
        'ERNIE-Bot': currentModelIds.yiyan,
        'ERNIE-Speed-8K': currentModelIds.yiyanFast,
    },
    [services.minimax]: {
        chatcompletion_v2: currentModelIds.minimax,
        'MiniMax-Text-01': currentModelIds.minimax,
    },
    [services.jieyue]: {
        'step-1-8k': currentModelIds.jieyue,
    },
    [services.huanYuan]: {
        'hunyuan-turbos-latest': currentModelIds.huanYuan,
        'hunyuan-t1-latest': currentModelIds.huanYuan,
        'hunyuan-a13b': currentModelIds.huanYuan,
        'hunyuan-lite': currentModelIds.huanYuan,
        'hunyuan-standard': currentModelIds.huanYuan,
    },
    [services.infini]: {
        'llama-2-13b-chat': currentModelIds.infiniGeneral,
        'llama-3.3-70b-instruct': currentModelIds.infiniGeneral,
        'qwen2.5-14b-instruct': currentModelIds.infiniGeneral,
        'gemma-2-27b-it': currentModelIds.infiniGeneral,
        'glm-4-9b-chat': currentModelIds.infiniZhipu,
    },
};

/**
 * Normalize a stored or imported plain object into the current config shape,
 * migrating retired or incorrect model identifiers.
 */
export function normalizeConfig(value: unknown): Config {
    const normalized = new Config();
    // Vue reactive objects are Proxies. Chrome's runtime channel sometimes
    // performs implicit conversions on the caller's behalf, but Firefox strictly
    // follows structured clone and throws DataCloneError, so config boundaries
    // must first be flattened to plain objects.
    const source = value && typeof value === 'object'
        ? cloneConfigValue(value) as Partial<Config>
        : {};
    Object.assign(normalized, source);
    delete (normalized as unknown as Record<string, unknown>).translationStatus;
    // __fluentConfigRevision only tracks storage write ordering; it must not
    // enter the runtime config or history snapshots, otherwise a default config
    // and an equal page snapshot become impossible to deduplicate.
    delete (normalized as unknown as Record<string, unknown>).__fluentConfigRevision;

    normalized.model = isRecord(source.model) ? {...source.model} : {};
    normalized.requireApiKey = isBooleanMapping(source.requireApiKey) ? {...source.requireApiKey} : {};
    normalized.customModel = isRecord(source.customModel) ? {...source.customModel} : {};
    normalized.customBody = normalizeCustomBodyMapping(source.customBody);

    if (typeof normalized.videoTranslationEnabled !== 'boolean') {
        normalized.videoTranslationEnabled = false;
    }
    // Early Beta versions wrote DeepLX as the default. Migrate only legacy
    // configs without the migration marker, to avoid overriding a DeepLX the
    // user deliberately chose in a newer version.
    const shouldMigrateLegacyVideoDefault = source.videoService === services.deeplx
        && source.videoServiceDefaultMigrated !== true;
    const supportsVideoService = servicesType.machine.has(normalized.videoService)
        || servicesType.isAI(normalized.videoService);
    if (shouldMigrateLegacyVideoDefault || !supportsVideoService) {
        normalized.videoService = services.microsoft;
    }
    normalized.videoServiceDefaultMigrated = true;
    if (typeof normalized.videoSubtitleVisible !== 'boolean') {
        normalized.videoSubtitleVisible = true;
    }
    if (!['bilingual', 'translation-only', 'original-only'].includes(normalized.videoSubtitleDisplayMode)) {
        normalized.videoSubtitleDisplayMode = 'bilingual';
    }

    migrateModelIdentifiers(normalized.model);

    // Legacy configs may lack saved model selections; fill in each AI service's
    // default model.
    defaultModels.forEach((defaultModel, service) => {
        if (!normalized.model[service]) normalized.model[service] = defaultModel;
    });

    const selectedModel = normalized.model[services.deepseek];
    const configuredThinkingMode = source.deepseekThinkingMode;

    if (selectedModel === 'deepseek-chat') {
        normalized.model[services.deepseek] = currentModelIds.deepseek;
        normalized.deepseekThinkingMode = 'disabled';
    } else if (selectedModel === 'deepseek-reasoner') {
        // The official migration guide requires reasoner to use v4-flash with
        // thinking explicitly enabled.
        normalized.model[services.deepseek] = currentModelIds.deepseek;
        normalized.deepseekThinkingMode = 'enabled';
    } else if (configuredThinkingMode !== 'enabled' && configuredThinkingMode !== 'disabled') {
        // Compatible with early config from #219, which used v4-pro as the
        // default thinking model.
        normalized.deepseekThinkingMode = selectedModel === 'deepseek-v4-pro' ? 'enabled' : 'disabled';
    }

    if (!['auto', 'responses', 'chat'].includes(normalized.deepseekApiType)) {
        normalized.deepseekApiType = 'auto';
    }

    if (!['disabled', 'bilingual', 'translation-only'].includes(normalized.selectionTranslatorMode)) {
        normalized.selectionTranslatorMode = 'disabled';
    }
    if (!['direct', 'icon', 'dot'].includes(normalized.selectionTranslatorTrigger)) {
        normalized.selectionTranslatorTrigger = 'icon';
    }
    normalized.disableSelectionTranslator = normalized.selectionTranslatorMode === 'disabled';

    return normalized;
}

function cloneConfigValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(cloneConfigValue);
    if (!isRecord(value)) return value;

    const cloned: Record<string, unknown> = {};
    for (const key of Object.keys(value)) cloned[key] = cloneConfigValue(value[key]);
    return cloned;
}

function migrateModelIdentifiers(configuredModels: IMapping): void {
    for (const service of Object.keys(modelMigrations)) {
        const selectedModel = configuredModels[service];
        if (!selectedModel) continue;
        configuredModels[service] = migrateModelIdentifier(service, selectedModel);
    }
}

/**
 * Map a single legacy official preset ID to its current ID, as a shared fallback
 * for config loading and request templates. Callers should skip this function
 * for custom models so private deployment aliases are never rewritten.
 */
export function migrateModelIdentifier(service: string, selectedModel: string): string {
    return modelMigrations[service]?.[selectedModel] || selectedModel;
}

function isRecord(value: unknown): value is Record<string, string> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBooleanMapping(value: unknown): value is Record<string, boolean> {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && Object.values(value).every((item) => typeof item === 'boolean');
}

// Build system_role for every service
function systemRoleFactory(): IMapping {
    let systems_role: IMapping = {};
    Object.keys(services).forEach(key => systems_role[key] = defaultOption.system_role);
    return systems_role;
}

// Build user_role for every service
function userRoleFactory(): IMapping {
    let users_role: IMapping = {};
    Object.keys(services).forEach(key => users_role[key] = defaultOption.user_role);
    return users_role;
}
