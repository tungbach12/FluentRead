import {DEFAULT_DEEPLX_ENDPOINT} from "./deeplx";

export const services = {
    // Machine translation
    microsoft: "microsoft",
    freeTranslation: "freeTranslation",
    deepL: "deepL",
    deeplx: "deeplx",
    google: "google",
    xiaoniu: "xiaoniu",
    youdao: "youdao",
    tencent: "tencent", // Tencent Cloud machine translation
    chromeTranslator: "chromeTranslator", // Chrome built-in translation API
    // AI model translation
    openai: "openai",
    azureOpenai: "azureOpenai", // Azure OpenAI
    gemini: "gemini",
    yiyan: "yiyan",
    tongyi: "tongyi",
    zhipu: "zhipu",
    moonshot: "moonshot",
    claude: "claude",
    custom: "custom",
    infini: "infini",
    // baidu: 'baidu',
    baichuan: "baichuan",
    lingyi: "lingyi",
    deepseek: "deepseek",
    minimax: "minimax",
    jieyue: "jieyue", // StepFun
    groq: "groq",
    cozecom: "cozecom", // Coze supports bots, not models
    cozecn: "cozecn",
    huanYuan: "huanYuan", // Tencent Hunyuan
    huanYuanTranslation: "huanYuanTranslation", // Tencent Hunyuan translation LLM
    doubao: "doubao", // ByteDance Doubao
    siliconCloud: "siliconCloud", // SiliconFlow
    openrouter: "openrouter", // OpenRouter
    grok: "grok", // X.AI Grok
    newapi: "newapi", // New API
};

export const servicesType = {
    // Service categories
    machine: new Set([services.microsoft, services.freeTranslation, services.deepL, services.deeplx, services.google, services.xiaoniu, services.youdao, services.tencent, services.chromeTranslator,]),
    AI: new Set([
        services.openai,
        services.azureOpenai,
        services.gemini,
        services.yiyan,
        services.tongyi,
        services.zhipu,
        services.moonshot,
        services.claude, services.custom,
        services.infini,
        services.baichuan,
        services.deepseek,
        services.lingyi,
        services.minimax,
        services.jieyue,
        services.groq,
        services.cozecom,
        services.cozecn,
        services.huanYuan,
        services.huanYuanTranslation,
        services.doubao,
        services.siliconCloud,
        services.openrouter,
        services.grok,
        services.newapi,
    ]),
    // Require a token
    useToken: new Set([
        services.openai,
        services.azureOpenai,
        services.gemini,
        services.yiyan,
        services.tongyi,
        services.zhipu,
        services.moonshot,
        services.claude,
        services.deepL,
        services.deeplx,
        services.xiaoniu,
        services.infini,
        services.baichuan,
        services.deepseek,
        services.lingyi,
        services.minimax,
        services.jieyue,
        services.groq,
        services.custom,
        services.cozecom,
        services.cozecn,
        services.huanYuan,
        services.doubao,
        services.siliconCloud,
        services.openrouter,
        services.grok,
        services.newapi,
    ]),
    // Require a model
    useModel: new Set([
        services.openai,
        services.azureOpenai,
        services.gemini,
        services.yiyan,
        services.tongyi,
        services.zhipu,
        services.moonshot,
        services.claude,
        services.custom,
        services.infini,
        services.baichuan,
        services.deepseek,
        services.lingyi,
        services.minimax,
        services.jieyue,
        services.groq,
        services.huanYuan,
        services.huanYuanTranslation,
        services.doubao,
        services.siliconCloud,
        services.openrouter,
        services.grok,
        services.newapi,
    ]),
    // Support proxy
    useProxy: new Set([
        services.openai,
        services.azureOpenai,
        services.gemini,
        services.claude,
        services.google,
        services.deepL,
        services.deeplx,
        services.moonshot,
        services.tongyi,
        services.xiaoniu,
        services.youdao,
        services.tencent,
        services.baichuan,
        services.deepseek,
        services.lingyi,
        services.jieyue,
        services.groq,
        services.cozecom,
        services.cozecn,
        services.huanYuan,
        services.huanYuanTranslation,
        services.doubao,
        services.siliconCloud,
        services.openrouter,
        services.grok,
    ]),
    // Services supporting a custom URL
    useCustomUrl: new Set([
        services.custom,
        services.deeplx,
        services.newapi,
        services.azureOpenai,
    ]),

    isMachine: (service: string) => servicesType.machine.has(service),
    isAI: (service: string) => servicesType.AI.has(service),
    isUseAIContext: (service: string, model = '') =>
        servicesType.AI.has(service)
        && service !== services.huanYuanTranslation
        && !(service === services.tongyi && model.startsWith('qwen-mt')),
    isUseToken: (service: string) => servicesType.useToken.has(service),
    isUseProxy: (service: string) => servicesType.useProxy.has(service),
    isUseModel: (service: string) => servicesType.useModel.has(service),
    // The request body of every AI service accepts extra top-level fields, including Coze which has no model picker.
    isUseCustomBody: (service: string) => servicesType.AI.has(service),
    isCustom: (service: string) => service === services.custom,
    isNewApi: (service: string) => service === services.newapi,
    // ERNIE Bot has migrated to Qianfan v2 Bearer Token auth; the method is kept for UI compatibility.
    isUseAkSk: (_service: string) => false,
    isCoze: (service: string) => service === services.cozecom || service === services.cozecn,
    isYoudao: (service: string) => service === services.youdao,
    isTencent: (service: string) => service === services.tencent || service === services.huanYuanTranslation,
    isAzureOpenai: (service: string) => service === services.azureOpenai,
    isUseCustomUrl: (service: string) => servicesType.useCustomUrl.has(service),
};

export const customModelString = "Custom model";

/** Resolve the model that is actually sent to a provider. */
export function resolveConfiguredModel(selectedModel?: string, customModel?: string): string {
    return selectedModel === customModelString ? customModel || '' : selectedModel || '';
}

// Single source of truth for current official model IDs, used by both the list and legacy config migration.
export const currentModelIds = {
    openai: "gpt-5.6-sol",
    zhipu: "glm-5.3",
    zhipuFlash: "glm-4.5-flash",
    tongyiTokenPlan: "qwen3.8-max-preview",
    moonshot: "kimi-k3",
    moonshotCompatible: "kimi-k2.6",
    claude: "claude-fable-5",
    claudeSonnet: "claude-sonnet-5",
    claudeOpus: "claude-opus-5",
    claudeHaiku: "claude-haiku-4-5",
    deepseek: "deepseek-v4-flash",
    minimax: "MiniMax-M2.7",
    jieyue: "step-3.5-flash",
    huanYuan: "hy3",
    grok: "grok-4.5",
    groqLarge: "openai/gpt-oss-120b",
    groqSmall: "openai/gpt-oss-20b",
    yiyan: "ernie-5.1",
    yiyanFast: "ernie-speed-128k",
    infiniZhipu: "glm-5.2",
    infiniGeneral: "qwen3.6-27b",
} as const;

export const models = new Map<string, Array<string>>([
    [services.openai, [currentModelIds.openai, "gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.5", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", customModelString]],
    [services.azureOpenai, [currentModelIds.openai, "gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.5", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", customModelString]],
    [services.gemini, ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", customModelString]],
    [services.yiyan, [currentModelIds.yiyan, "ernie-5.0-thinking-preview", "ernie-x1.1-preview", "ernie-4.5-turbo-128k", "ernie-4.5-21b-a3b", currentModelIds.yiyanFast, customModelString]],
    [services.tongyi, [currentModelIds.tongyiTokenPlan, "qwen3.7-max", "qwen3.7-plus", "qwen3.6-flash", "qwen-mt-plus", "qwen-mt-turbo", "qwen-mt-flash", "qwen-mt-lite", "qwen-long-latest", customModelString]],
    [services.zhipu, [currentModelIds.zhipu, "glm-5.2", "glm-5.1", "glm-5-turbo", "glm-5", "glm-4.7", currentModelIds.zhipuFlash, customModelString]],
    [services.moonshot, [currentModelIds.moonshot, "kimi-k2.7-code-highspeed", "kimi-k2.7-code", currentModelIds.moonshotCompatible, "kimi-k2.5", customModelString]],
    [services.claude, [currentModelIds.claude, currentModelIds.claudeOpus, currentModelIds.claudeSonnet, currentModelIds.claudeHaiku, "claude-opus-4-8", "claude-sonnet-4-6", customModelString]],
    [services.custom, ["kc/openrouter/free", currentModelIds.openai, "gpt-5.4-mini", "gemini-3.6-flash", currentModelIds.claude, currentModelIds.deepseek, "gemma:7b", "llama2:7b", "mistral:7b", customModelString]],
    [services.infini, [currentModelIds.deepseek, "deepseek-v4-pro", currentModelIds.infiniZhipu, "kimi-k2.7-code", currentModelIds.infiniGeneral, "qwen3.6-35b-a3b", customModelString]],
    [services.baichuan, ["Baichuan-M3-Plus", "Baichuan-M3", "Baichuan4-Air", "Baichuan4-Turbo", "Baichuan4", customModelString]],
    [services.lingyi, ["yi-lightning", customModelString]],
    [services.deepseek, [currentModelIds.deepseek, "deepseek-v4-pro", customModelString]],
    [services.minimax, [currentModelIds.minimax, "MiniMax-M2.7-highspeed", "MiniMax-M2.5", "MiniMax-M2.5-highspeed", customModelString]],
    [services.jieyue, [currentModelIds.jieyue, "step-3", "step-2", customModelString]],
    [services.huanYuan, [currentModelIds.huanYuan, "hy3-preview", customModelString]],
    [services.huanYuanTranslation, ["hunyuan-translation", "hunyuan-translation-lite", customModelString]],
    [services.newapi, [currentModelIds.openai, "gpt-5.4-mini", "gemini-3.6-flash", "gemini-3.5-flash-lite", currentModelIds.claude, currentModelIds.deepseek, "kimi-k2.7-code", customModelString]],
    [services.grok, [currentModelIds.grok, "grok-4.3", customModelString]],
    [services.doubao, ["doubao-seed-1-6-250615", customModelString]],

    // mix model
    [services.siliconCloud, ["deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash", "zai-org/GLM-5.2", "Qwen/Qwen3.6-27B", "Qwen/Qwen3.6-35B-A3B", "deepseek-ai/DeepSeek-V3.2", "deepseek-ai/DeepSeek-R1", customModelString]],

    [services.groq, [currentModelIds.groqLarge, currentModelIds.groqSmall, "qwen/qwen3.6-27b", customModelString]],
    [services.openrouter, ["openrouter/auto", "openai/gpt-5.6-sol", "google/gemini-3.6-flash", "anthropic/claude-fable-5", "anthropic/claude-opus-5", "x-ai/grok-4.5", "deepseek/deepseek-v4-pro", "moonshotai/kimi-k3", "z-ai/glm-5.2", customModelString]]
]);

// Every AI service that needs a model picker uses the first list entry as its out-of-the-box default model.
// Generated from the model lists so the settings page, config init, and request templates share one source.
export const defaultModels = new Map<string, string>(
    Array.from(models.entries())
        .map(([service, modelOptions]) => [service, modelOptions[0] || ""] as [string, string])
        .filter(([, model]) => Boolean(model)),
);

export const options = {
    on: [
        {value: true, label: "On"},
        {value: false, label: "Off"},
    ],
    // Translate instantly
    autoTranslate: [
        {value: true, label: "On"},
        {value: false, label: "Off"},
    ],
    // Use cache
    useCache: [
        {value: true, label: "On"},
        {value: false, label: "Off"},
    ],
    form: [{value: "auto", label: "Auto-detect"}],
    // DeepSeek API format (only shown for the DeepSeek service)
    deepseekApiType: [
        {value: "auto", label: "Auto (Chat Completion)"},
        {value: "responses", label: "Responses API"},
        {value: "chat", label: "Chat Completion"},
    ],
    deepseekThinkingMode: [
        {value: "disabled", label: "Off (recommended)"},
        {value: "enabled", label: "On"},
    ],
    to: [
        {value: "zh-Hans", label: "Chinese (Simplified)"},
        {value: "en", label: "English"},
        {value: "ja", label: "Japanese"},
        {value: "ko", label: "Korean"},
        {value: "fr", label: "French"},
        {value: "ru", label: "Russian"},
    ],
    keys: [
        {value: "none", label: "Disable hotkeys"},

        {value: "Computer", label: "Keyboard options", disabled: true},
        {value: "Control", label: "Ctrl"},
        {value: "Alt", label: "Alt"},
        {value: "Shift", label: "Shift"},
        {value: "Escape", label: "ESC"},
        {value: "`", label: "Tilde key"},

        {value: "mouse", label: "Mouse options", disabled: true},
        {value: "DoubleClick", label: "Mouse double-click"},
        {value: "LongPress", label: "Mouse long-press"},
        {value: "MiddleClick", label: "Middle-click"},

        {value: "touchscreen", label: "Touchscreen options", disabled: true},
        {value: "TwoFinger", label: "Two-finger translate"},
        {value: "ThreeFinger", label: "Three-finger translate"},
        {value: "FourFinger", label: "Four-finger translate"},
        {value: "DoubleClickScree", label: "Double-click translate"},
        {value: "TripleClickScree", label: "Triple-click translate"},
        
        {value: "custom", label: "Custom hotkey (Beta)"},
    ],
    services: [
        // Machine translation
        {value: "machine", label: "Machine Translation", disabled: true},
        {
            value: services.freeTranslation,
            label: "Free Translation Service",
            description: "Free of charge; tries Microsoft Translator, DeepLX, and Google Translate in order. Translation quality and availability are not guaranteed.",
        },
        {value: services.microsoft, label: "Microsoft Translator"},
        {value: services.google, label: "Google Translate"},
        {value: services.deepL, label: "DeepL"},
        {value: services.deeplx, label: "DeepLX (Unofficial, Free)"},
        {value: services.xiaoniu, label: "Xiaoniu Translator"},
        {value: services.youdao, label: "Youdao Translator"},
        {value: services.tencent, label: "Tencent Cloud Translation"},
        {value: services.chromeTranslator, label: "Chrome Built-in AI Translation"},
        // AI model translation
        {value: "ai", label: "AI Translation", disabled: true},
        {value: services.siliconCloud, label: "SiliconFlow"},
        {value: services.huanYuan, label: "Tencent Hunyuan"},
        {value: services.newapi, label: "New API"},
        {value: services.deepseek, label: "DeepSeek"},
        {value: services.openai, label: "OpenAI"},
        {value: services.azureOpenai, label: "Azure OpenAI"},
        {value: services.huanYuanTranslation, label: "Tencent Hunyuan Translation"},
        {value: services.tongyi, label: "Alibaba Tongyi"},
        {value: services.doubao, label: "ByteDance Doubao"},
        {value: services.grok, label: "Grok (X.AI)"},
        {value: services.openrouter, label: "OpenRouter"},
        {value: services.groq, label: "Groq"},
        {value: services.moonshot, label: "Kimi"},
        {value: services.zhipu, label: "Zhipu AI"},
        {value: services.baichuan, label: "Baichuan AI"},
        {value: services.lingyi, label: "Lingyi Wanwu"},
        {value: services.minimax, label: "MiniMax"},
        {value: services.jieyue, label: "StepFun"},
        {value: services.infini, label: "Infini-AI"},
        {value: services.cozecom, label: "Coze (International)"},
        {value: services.cozecn, label: "Coze (China)"},
        {value: services.claude, label: "Claude"},
        {value: services.gemini, label: "Gemini"},
        {value: services.yiyan, label: "ERNIE Bot"},
        {value: services.custom, label: "Custom API"},
    ],
    display: [
        {value: 0, label: "Translation only"},
        {value: 1, label: "Bilingual"},
    ],
    // Bilingual translation styles
    styles: [
        // Basic styles
        {value: "basic", label: "Basic styles", disabled: true},
        {value: 0, label: "Plain", class: "fluent-display-default", group: "basic"},
        {value: 1, label: "Bold", class: "fluent-display-bold", group: "basic"},
        {value: 2, label: "Elegant Italic", class: "fluent-display-italic", group: "basic"},
        {value: 3, label: "Text Shadow", class: "fluent-display-text-shadow", group: "basic"},

        // Underline styles
        {value: "underline", label: "Underline styles", disabled: true},
        {value: 4, label: "Blue Solid", class: "fluent-display-solid-underline", group: "underline"},
        {value: 5, label: "Elegant Dotted", class: "fluent-display-dot-underline", group: "underline"},
        {value: 6, label: "Playful Wavy", class: "fluent-display-wavy", group: "underline"},

        // Card styles
        {value: "card", label: "Card styles", disabled: true},
        {value: 7, label: "Minimal Card", class: "fluent-display-card-mode", group: "card"},
        {value: 8, label: "Gradient Card", class: "fluent-display-modern-card", group: "card"},
        {value: 9, label: "Paper Card", class: "fluent-display-paper", group: "card"},

        // Highlight styles
        {value: "highlight", label: "Highlight styles", disabled: true},
        {value: 10, label: "Study Marker", class: "fluent-display-learning-mode", group: "highlight"},
        {value: 11, label: "Fluorescent Marker", class: "fluent-display-marker", group: "highlight"},
        {value: 12, label: "Soft Gradient", class: "fluent-display-highlight-fade", group: "highlight"},

        // Background color styles
        {value: "background", label: "Background colors", disabled: true},
        {value: 13, label: "Warm Yellow", class: "fluent-display-lightyellow", group: "background"},
        {value: 14, label: "Fresh Blue", class: "fluent-display-lightblue", group: "background"},
        {value: 15, label: "Soft Gray", class: "fluent-display-lightgray", group: "background"},

        // Special effects
        {value: "special", label: "Special effects", disabled: true},
        {value: 16, label: "Elegant Quote", class: "fluent-display-quote", group: "special"},
        {value: 17, label: "Light Border", class: "fluent-display-border", group: "special"},
        {value: 18, label: "Reading Focus", class: "fluent-display-focus", group: "special"},
        {value: 19, label: "Minimal Bottom Line", class: "fluent-display-clean", group: "special"},

        // Professional styles
        {value: "pro", label: "Professional styles", disabled: true},
        {value: 20, label: "Code Style", class: "fluent-display-tech", group: "pro"},
        {value: 21, label: "Book Style", class: "fluent-display-elegant", group: "pro"},

        // Transparency
        {value: "transparent", label: "Transparency effects", disabled: true},
        {value: 22, label: "Semi-transparent", class: "fluent-display-dimmed", group: "transparent"},
        {value: 23, label: "Light Transparency", class: "fluent-display-transparent-mode", group: "transparent"},
    ],
    // Floating ball hotkey options
    floatingBallHotkeys: [
        {value: "none", label: "Disable hotkeys"},
        {value: "Alt+T", label: "Alt+T / Option+T (Default)"},
        {value: "Alt+A", label: "Alt+A / Option+A"},
        {value: "Alt+S", label: "Alt+S / Option+S"},
        {value: "Alt+D", label: "Alt+D / Option+D"},
        {value: "Alt+Q", label: "Alt+Q / Option+Q"},
        {value: "Ctrl+Shift+T", label: "Ctrl+Shift+T / Control+Shift+T"},
        {value: "Ctrl+Shift+A", label: "Ctrl+Shift+A / Control+Shift+A"},
        {value: "F9", label: "F9"},
        {value: "F10", label: "F10"},
        {value: "F11", label: "F11"},
        {value: "F12", label: "F12"},
        {value: "custom", label: "Custom hotkey (Beta)"},
    ],
    theme: [
        {value: "auto", label: "Follow System"},
        {value: "light", label: "Light Theme"},
        {value: "dark", label: "Dark Theme"},
    ],
    // Input box translation target language options
    inputBoxTranslationTarget: [
        {value: "zh-Hans", label: "Chinese (Simplified)"},
        {value: "en", label: "English"},
        {value: "ja", label: "Japanese"},
        {value: "ko", label: "Korean"},
        {value: "fr", label: "French"},
        {value: "ru", label: "Russian"},
        {value: "es", label: "Spanish"},
        {value: "de", label: "German"},
        {value: "pt", label: "Portuguese"},
        {value: "it", label: "Italian"},
    ],
    // Input box translation trigger options
    inputBoxTranslationTrigger: [
        {value: "disabled", label: "Off"},
        {value: "triple_space", label: "Press Space three times"},
        {value: "triple_equal", label: "Press equals (=) three times"},
        {value: "triple_dash", label: "Press dash (-) three times"},
    ],
};

export const defaultOption = {
    on: true,
    from: "auto",
    to: "vi",
    style: 1,
    display: 1,
    hotkey: "Control",
    service: services.custom,
    custom: "https://9routerhelios.duckdns.org/v1/chat/completions",
    deeplx: DEFAULT_DEEPLX_ENDPOINT,
    system_role:
        "You are a professional, authentic machine translation engine.",
    user_role: `Translate the following text into {{to}}, If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes:

{{origin}}`,
    count: 0,
    useCache: true,
    floatingBallHotkey: "Alt+T", // Default floating ball hotkey
    inputBoxTranslationTrigger: "disabled", // Input box translation off by default
    inputBoxTranslationTarget: "en", // Default target language: English
};
