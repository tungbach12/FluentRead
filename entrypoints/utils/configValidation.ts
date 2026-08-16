import { customModelString, options, services, servicesType } from './option';

export interface CredentialConfig {
    token?: Record<string, string | undefined>;
    model?: Record<string, string | undefined>;
    customModel?: Record<string, string | undefined>;
    requireApiKey?: Record<string, boolean | undefined>;
    youdaoAppKey?: string;
    youdaoAppSecret?: string;
    tencentSecretId?: string;
    tencentSecretKey?: string;
}

function getServiceLabel(service: string): string {
    return options.services.find((item) => item.value === service)?.label || service;
}

/** 使用服务和实际模型共同定位开关，避免切换模型时误用另一模型的设置。 */
export function getApiKeyRequirementKey(service: string, config: CredentialConfig): string {
    const selectedModel = config.model?.[service] || '';
    const actualModel = selectedModel === customModelString
        ? config.customModel?.[service] || selectedModel
        : selectedModel;
    return `${service}:${actualModel}`;
}

export function isApiKeyRequired(service: string, config: CredentialConfig): boolean {
    if (!servicesType.isAI(service)) return true;
    return config.requireApiKey?.[getApiKeyRequirementKey(service, config)] !== false;
}

/** 返回设置页和翻译前校验共用的凭据提示；返回 null 表示当前服务不缺凭据。 */
export function getMissingCredentialMessage(
    service: string,
    config: CredentialConfig,
): string | null {
    const serviceLabel = getServiceLabel(service);

    if (servicesType.isUseToken(service) && service !== services.deeplx && isApiKeyRequired(service, config)) {
        if (!config.token?.[service]?.trim()) {
            return `${serviceLabel} requires an API Key (access token) which is not configured yet. Enter it in Settings before translating.`;
        }
    }

    if (service === services.youdao
        && (!config.youdaoAppKey?.trim() || !config.youdaoAppSecret?.trim())) {
        return `${serviceLabel} requires App Key and App Secret which are not fully configured yet. Enter them in Settings before translating.`;
    }

    if (service === services.tencent
        && (!config.tencentSecretId?.trim() || !config.tencentSecretKey?.trim())) {
        return `${serviceLabel} requires SecretId and SecretKey which are not fully configured yet. Enter them in Settings before translating.`;
    }

    return null;
}
