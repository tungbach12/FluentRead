<template>
  <main class="popup-shell">
    <header class="popup-header">
      <div class="brand">
        <img src="/icon/128.png" alt="" />
        <div>
          <strong>FluentRead</strong>
          <small>FluentRead · V{{ version }}</small>
        </div>
      </div>
      <div class="header-actions">
        <button class="donation-button" type="button" title="Support FluentRead" aria-label="Open support page" @click="openDonation()">
          <Coffee />
          <span>Support</span>
        </button>
        <button class="settings-button" type="button" title="Full settings" aria-label="Open full settings" @click="openOptions()">
          <Setting />
          <span>Settings</span>
        </button>
      </div>
    </header>

    <Transition name="donation-fade">
      <div
        v-if="donationVisible"
        class="donation-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        @click.self="closeDonation"
      >
        <section class="donation-card">
          <button class="donation-close" type="button" aria-label="Close support page" @click="closeDonation">×</button>
          <div class="donation-icon" aria-hidden="true"><Coffee /></div>
          <span class="eyebrow">Free & open source</span>
          <h2 id="donation-title">Enjoy reading with FluentRead?</h2>
          <p class="donation-description">You can scan the WeChat QR code to support the author. Thank you!</p>
          <div class="donation-qr-frame">
            <img src="/misc/approve.jpg" alt="FluentRead donation QR code" />
          </div>
        </section>
      </div>
    </Transition>

    <section class="hero-card">
      <div class="hero-heading">
        <div>
          <span class="eyebrow">Webpage translation</span>
          <h1>{{ config.on ? 'Let reading flow naturally' : 'Translation is paused' }}</h1>
        </div>
        <button class="switch" type="button" role="switch" :aria-checked="config.on" :aria-label="config.on ? 'Pause the extension' : 'Enable the extension'" @click="setPluginEnabled(!config.on)"><i /></button>
      </div>

      <div class="language-pair">
        <label>
          <span>Source language</span>
          <select v-model="config.from" :disabled="!config.on">
            <option v-for="item in options.form" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <span class="arrow">→</span>
        <label>
          <span>Target language</span>
          <select v-model="config.to" :disabled="!config.on">
            <option v-for="item in options.to" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
      </div>

      <div ref="servicePicker" class="service-picker">
        <button
          class="service-field"
          type="button"
          :disabled="!config.on"
          aria-haspopup="listbox"
          :aria-expanded="servicePickerOpen"
          aria-label="Translation service"
          @click="toggleServicePicker"
        >
          <ServiceIcon :service="config.service" :label="serviceLabel" />
          <span class="service-copy"><small>Translation service</small><strong>{{ serviceLabel }}</strong></span>
          <span class="chevron" :class="{ open: servicePickerOpen }">⌄</span>
        </button>

        <div v-if="servicePickerOpen" class="service-picker-panel" role="listbox" aria-label="Translation services">
          <div class="service-picker-heading">
            <div><strong>Choose a translation service</strong><small>Popular services first, more available below</small></div>
            <span>{{ serviceOptions.length }}</span>
          </div>

          <div class="service-group">
            <span class="service-group-label">Popular services</span>
            <button
              v-for="item in popularServiceOptions"
              :key="item.value"
              class="service-option"
              type="button"
              role="option"
              :data-service-value="item.value"
              :aria-selected="config.service === item.value"
              @click="selectService(item.value)"
            >
              <ServiceIcon :service="item.value" :label="item.label" size="small" />
              <span>{{ item.label }}</span>
              <span v-if="config.service === item.value" class="service-option-check">✓</span>
            </button>
          </div>

          <button class="service-more-toggle" type="button" :aria-expanded="moreServicesOpen" @click="moreServicesOpen = !moreServicesOpen">
            <span>More services</span>
            <span class="service-more-meta">{{ moreServiceOptions.length }} options <b :class="{ open: moreServicesOpen }">⌄</b></span>
          </button>

          <div v-if="moreServicesOpen" class="service-group service-group-more">
            <button
              v-for="item in moreServiceOptions"
              :key="item.value"
              class="service-option"
              type="button"
              role="option"
              :data-service-value="item.value"
              :aria-selected="config.service === item.value"
              @click="selectService(item.value)"
            >
              <ServiceIcon :service="item.value" :label="item.label" size="small" />
              <span>{{ item.label }}</span>
              <span v-if="config.service === item.value" class="service-option-check">✓</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="credentialWarning" class="credential-warning" role="alert">
        <span><strong>Setup reminder</strong>{{ credentialWarning }}</span>
        <button type="button" @click="openOptions('settings-services')">Go to settings</button>
      </div>

      <button
        class="translate-button"
        :class="{ translated: pageTranslated }"
        type="button"
        :disabled="!config.on || translating"
        :aria-pressed="pageTranslated"
        @click="togglePageTranslation"
      >
        <span v-if="translating" class="spinner" />
        <span v-else class="translate-glyph">A↔A</span>
        <span class="translate-label">{{ pageTranslated ? 'Restore original page' : 'Translate current page' }}</span>
        <kbd class="translate-hotkey" :class="{ disabled: fullPageHotkey === 'Not set' }">{{ fullPageHotkey }}</kbd>
      </button>
      <p v-if="notice" class="notice" :class="noticeType">{{ notice }}</p>
    </section>

    <section class="features">
      <span class="eyebrow features-eyebrow">Quick actions</span>
      <div class="feature-grid">
        <button class="feature-card" type="button" :disabled="!config.on" @click="openDrawer('hover')">
          <span class="feature-icon rose">↖</span>
          <span><strong>Hover translation</strong><small>{{ hoverSummary }}</small></span>
          <i :class="{ active: config.hotkey !== 'none' }" />
        </button>
        <button class="feature-card" type="button" :disabled="!config.on" @click="openDrawer('selection')">
          <span class="feature-icon violet">I</span>
          <span><strong>Selection translation</strong><small>{{ selectionSummary }}</small></span>
          <i :class="{ active: config.selectionTranslatorMode !== 'disabled' }" />
        </button>
        <button class="feature-card" type="button" :disabled="!config.on" @click="openDrawer('floating')">
          <span class="feature-icon blue">◉</span>
          <span><strong>Full-page floating ball</strong><small>{{ config.disableFloatingBall ? 'Off' : floatingSummary }}</small></span>
          <i :class="{ active: !config.disableFloatingBall }" />
        </button>
        <button class="feature-card" type="button" :disabled="!config.on" @click="openDrawer('appearance')">
          <span class="feature-icon amber">Aa</span>
          <span><strong>Translation display</strong><small>{{ displaySummary }}</small></span>
          <b>›</b>
        </button>
        <button class="feature-card" type="button" :disabled="!config.on" @click="openDrawer('image')">
          <span class="feature-icon teal">▧</span>
          <span class="feature-copy">
            <span class="feature-title"><strong>Image translation</strong><em class="beta-badge">Beta</em></span>
            <small>{{ imageTranslationSummary }}</small>
          </span>
          <i :class="{ active: !config.disableImageTranslator }" />
        </button>
        <button class="feature-card video-feature-card" data-feature="video-subtitle" type="button" :disabled="!config.on" @click="openDrawer('video')">
          <span class="feature-icon teal">CC</span>
          <span class="feature-copy">
            <span class="feature-title"><strong>Video subtitles</strong><em class="beta-badge">Beta</em></span>
            <small>{{ videoSummary }}</small>
          </span>
          <i :class="{ active: config.videoTranslationEnabled }" />
        </button>
      </div>
    </section>

    <footer>
      <span>{{ config.count }} translations completed</span>
      <a
        class="opensource-link"
        href="https://github.com/Bistutu/FluentRead"
        target="_blank"
        rel="noreferrer"
        aria-label="View the FluentRead open-source project on GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.26c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .3" />
        </svg>
        <span>Open source</span>
        <span class="external-mark" aria-hidden="true">↗</span>
      </a>
      <button type="button" :disabled="clearingCache" @click="clearCache">{{ clearingCache ? 'Clearing…' : 'Clear cache' }}</button>
    </footer>

    <el-drawer
      v-model="drawerVisible"
      direction="btt"
      size="auto"
      :with-header="false"
      :append-to-body="true"
      modal-class="popup-drawer-modal"
      class="popup-drawer"
    >
      <div class="drawer-handle" />
      <header class="drawer-header">
        <div><span class="eyebrow">Quick settings</span><h2>{{ drawerTitle }}</h2><p>{{ drawerDescription }}</p></div>
        <button type="button" aria-label="Close" @click="drawerVisible = false">×</button>
      </header>

      <div v-if="activeDrawer === 'hover'" class="drawer-content">
        <div class="interaction-preview"><span class="cursor">↖</span><span>＋</span><kbd>{{ hoverKey }}</kbd><span>＝</span><strong>Instant translation</strong></div>
        <div class="setting-row">
          <span><strong>Enable hover translation</strong><small>Hold the key and hover over text</small></span>
          <button class="switch compact" type="button" role="switch" :aria-checked="config.hotkey !== 'none'" aria-label="Enable or disable hover translation" @click="toggleHover"><i /></button>
        </div>
        <div class="choice-block">
          <label>Trigger key</label>
          <div class="chips two">
            <button v-for="item in hoverChoices" :key="item.value" type="button" :class="{ selected: config.hotkey === item.value }" @click="setHoverHotkey(item.value)">{{ item.label }}</button>
          </div>
          <button v-if="config.hotkey === 'custom'" class="secondary-action" type="button" @click="showCustomMouseHotkeyDialog = true">
            {{ config.customHotkey ? `Current: ${config.customHotkey}` : 'Record custom key' }}
          </button>
        </div>
      </div>

      <div v-else-if="activeDrawer === 'selection'" class="drawer-content">
        <div class="interaction-preview"><span class="selection-box">Select text</span><span>＋</span><i class="pink-dot" /><span>＝</span><strong>Translate selection</strong></div>
        <div class="setting-row">
          <span><strong>Enable selection translation</strong><small>Show a quick action after selecting text</small></span>
          <button class="switch compact" type="button" role="switch" :aria-checked="config.selectionTranslatorMode !== 'disabled'" aria-label="Enable or disable selection translation" @click="setSelectionMode(config.selectionTranslatorMode === 'disabled' ? 'bilingual' : 'disabled')"><i /></button>
        </div>
        <div class="choice-block">
          <label>Display mode</label>
          <div class="chips two">
            <button v-for="item in selectionModes" :key="item.value" type="button" :class="{ selected: config.selectionTranslatorMode === item.value }" @click="setSelectionMode(item.value)">{{ item.label }}</button>
          </div>
        </div>
        <div class="choice-block">
          <label>Trigger</label>
          <div class="chips three">
            <button v-for="item in selectionTriggers" :key="item.value" type="button" :class="{ selected: config.selectionTranslatorTrigger === item.value }" @click="setSelectionTrigger(item.value)">{{ item.label }}</button>
          </div>
          <small class="drawer-hint">The icon and dot stay pinned next to your selection, no hovering required.</small>
        </div>
      </div>

      <div v-else-if="activeDrawer === 'floating'" class="drawer-content">
        <div class="setting-row">
          <span><strong>Enable full-page floating ball</strong><small>Translate or restore the whole page from the edge of the screen</small></span>
          <button class="switch compact" type="button" role="switch" :aria-checked="!config.disableFloatingBall" aria-label="Enable or disable the full-page floating ball" @click="setFloatingEnabled(config.disableFloatingBall)"><i /></button>
        </div>
        <div class="choice-block">
          <label>Floating position</label>
          <div class="chips two">
            <button type="button" :class="{ selected: config.floatingBallPosition === 'left' }" @click="config.floatingBallPosition = 'left'">Left edge</button>
            <button type="button" :class="{ selected: config.floatingBallPosition === 'right' }" @click="config.floatingBallPosition = 'right'">Right edge</button>
          </div>
        </div>
        <label class="select-row">
          <span><strong>Full-page translation hotkey</strong><small>Toggle without clicking the floating ball</small></span>
          <select v-model="config.floatingBallHotkey" @change="handleFloatingHotkeyChange">
            <option v-for="item in options.floatingBallHotkeys" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <button v-if="config.floatingBallHotkey === 'custom'" class="secondary-action" type="button" @click="showCustomHotkeyDialog = true">
          {{ config.customFloatingBallHotkey ? `Current: ${config.customFloatingBallHotkey}` : 'Record custom key' }}
        </button>
      </div>

      <div v-else-if="activeDrawer === 'image'" class="drawer-content">
        <div class="image-translation-preview">
          <div class="image-translation-preview-art"><span>Text</span><b>文</b></div>
          <div>
            <span class="feature-title"><strong>Hover an image to reveal the translation entry</strong><em class="beta-badge">Beta</em></span>
            <small>Click the small icon in the top-right corner of an image to recognize and translate its text</small>
          </div>
        </div>
        <div class="setting-row">
          <span><strong>Enable image translation</strong><small>Show the “文” button on the top-right corner of web images</small></span>
          <button class="switch compact" type="button" role="switch" :aria-checked="!config.disableImageTranslator" aria-label="Enable or disable image translation" @click="setImageTranslatorEnabled(config.disableImageTranslator)"><i /></button>
        </div>
      </div>

      <div v-else-if="activeDrawer === 'video'" class="drawer-content">
        <div class="video-beta-banner"><span class="feature-icon teal">CC</span><span><strong>FluentRead · YouTube subtitle translation</strong><small>Beta · Only subtitle text already provided by the player is processed</small></span></div>
        <div class="setting-row">
          <span><strong>Enable video subtitle translation</strong><small>Show translated subtitles below YouTube's native captions</small></span>
          <button class="switch compact" type="button" role="switch" :aria-checked="config.videoTranslationEnabled" aria-label="Enable or disable video subtitle translation" @click="setVideoTranslationEnabled(!config.videoTranslationEnabled)"><i /></button>
        </div>
        <label class="select-row">
          <span><strong>Video translation service</strong><small>Saved independently from the page translation service</small></span>
          <select v-model="config.videoService" :disabled="!config.videoTranslationEnabled">
            <option v-for="item in videoServiceOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <small class="drawer-hint">YouTube is currently supported. A FluentRead icon appears inside the player to switch subtitle mode, display state, and download SRT. Videos use Microsoft Translator by default; AI services prefetch subtitles ahead of time — if you switch to DeepLX, you can configure the service URL in the full settings.</small>
      </div>

      <div v-else class="drawer-content">
        <div class="choice-block">
          <label>Translation mode</label>
          <div class="chips two">
            <button v-for="item in options.display" :key="item.value" type="button" :class="{ selected: config.display === item.value }" @click="config.display = item.value">{{ item.label }}</button>
          </div>
        </div>
        <label v-if="config.display === 1" class="select-row">
          <span><strong>Translation style</strong><small>Visual style of translations in bilingual mode</small></span>
          <select v-model.number="config.style"><option v-for="item in styleOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        </label>
        <label class="select-row">
          <span><strong>Interface theme</strong><small>Also applies to the full settings page</small></span>
          <select v-model="config.theme"><option v-for="item in options.theme" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        </label>
      </div>

      <button v-if="activeDrawer !== 'image'" class="drawer-settings-link" type="button" @click="openOptions(drawerSettingsSection[activeDrawer])">View all options in the full settings ↗</button>
    </el-drawer>

    <CustomHotkeyInput v-model="showCustomHotkeyDialog" :current-value="config.customFloatingBallHotkey" @confirm="confirmFloatingHotkey" @cancel="cancelFloatingHotkey" />
    <CustomHotkeyInput v-model="showCustomMouseHotkeyDialog" :current-value="config.customHotkey" @confirm="confirmMouseHotkey" @cancel="cancelMouseHotkey" />
  </main>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import browser from 'webextension-polyfill';
import {
  config as runtimeConfig,
  configReady,
  saveConfig,
  requestConfigSave,
  subscribeConfig,
} from '@/entrypoints/utils/config';
import { Setting } from '@element-plus/icons-vue';
import { Config } from '@/entrypoints/utils/model';
import { options } from '@/entrypoints/utils/option';
import { getMissingCredentialMessage } from '@/entrypoints/utils/configValidation';
import ServiceIcon from '@/components/ServiceIcon.vue';

type DrawerName = 'hover' | 'selection' | 'floating' | 'appearance' | 'image' | 'video';
type SettingsSection = 'settings-general' | 'settings-shortcuts' | 'settings-services' | 'settings-video';
const CustomHotkeyInput = defineAsyncComponent(() => import('@/components/CustomHotkeyInput.vue'));
const version = process.env.VUE_APP_VERSION;
const config = ref(new Config());
const drawerVisible = ref(false);
const activeDrawer = ref<DrawerName>('hover');
const translating = ref(false);
const pageTranslated = ref(false);
const clearingCache = ref(false);
const donationVisible = ref(false);
const notice = ref('');
const noticeType = ref<'success' | 'error'>('success');
const showCustomHotkeyDialog = ref(false);
const showCustomMouseHotkeyDialog = ref(false);
const servicePicker = ref<HTMLElement | null>(null);
const servicePickerOpen = ref(false);
const moreServicesOpen = ref(false);
const hydrated = ref(false);
let lastSerialized = '';
let applyingExternalConfig = false;
let pageExitSaveStarted = false;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
const drawerSettingsSection: Record<DrawerName, SettingsSection> = {
  hover: 'settings-shortcuts',
  selection: 'settings-shortcuts',
  floating: 'settings-shortcuts',
  appearance: 'settings-general',
  image: 'settings-general',
  video: 'settings-video',
};
const persistConfig = (value: unknown) => requestConfigSave(value, browser.runtime.sendMessage.bind(browser.runtime));

const serviceOptions = computed(() => options.services.filter((item: any) => !item.disabled));
const videoServiceOptions = computed(() => options.services.filter((item: any) => !item.disabled));
const popularServiceValues = ['freeTranslation', 'microsoft', 'google', 'deepL', 'deeplx', 'deepseek', 'openai', 'gemini', 'claude'];
const popularServiceOptions = computed(() => popularServiceValues
  .map(value => serviceOptions.value.find((item: any) => item.value === value))
  .filter((item): item is any => Boolean(item)));
const moreServiceOptions = computed(() => serviceOptions.value.filter((item: any) => !popularServiceValues.includes(item.value)));
const styleOptions = computed(() => options.styles.filter((item: any) => !item.disabled));
const serviceLabel = computed(() => serviceOptions.value.find((item: any) => item.value === config.value.service)?.label || config.value.service);
const credentialWarning = computed(() => getMissingCredentialMessage(config.value.service, config.value));
const videoServiceLabel = computed(() => videoServiceOptions.value.find((item: any) => item.value === config.value.videoService)?.label || config.value.videoService);
const styleLabel = computed(() => styleOptions.value.find((item: any) => item.value === config.value.style)?.label || 'Default style');
const hoverKey = computed(() => config.value.hotkey === 'custom' ? (config.value.customHotkey || 'Custom') : config.value.hotkey);
const hoverSummary = computed(() => config.value.hotkey === 'none' ? 'Off' : `${hoverKey.value} + hover`);
const fullPageHotkey = computed(() => {
  const hotkey = config.value.floatingBallHotkey === 'custom'
    ? config.value.customFloatingBallHotkey
    : config.value.floatingBallHotkey;
  return hotkey && hotkey !== 'none' ? hotkey : 'Not set';
});
const selectionSummary = computed(() => ({ disabled: 'Off', bilingual: 'Bilingual', 'translation-only': 'Translation only' }[config.value.selectionTranslatorMode] || 'Bilingual'));
const floatingSummary = computed(() => `${config.value.floatingBallPosition === 'left' ? 'Left edge' : 'Right edge'} · ${fullPageHotkey.value}`);
const displaySummary = computed(() => config.value.display === 1 ? `Bilingual · ${styleLabel.value}` : 'Translation only');
const imageTranslationSummary = computed(() => config.value.disableImageTranslator ? 'Off' : 'Hover on an image');
const videoSummary = computed(() => config.value.videoTranslationEnabled ? `${videoServiceLabel.value} · YouTube` : 'Off');
const drawerTitle = computed(() => ({ hover: 'Hover translation settings', selection: 'Selection translation settings', floating: 'Floating ball settings', appearance: 'Translation display settings', image: 'Image translation settings', video: 'Video subtitle settings' }[activeDrawer.value]));
const drawerDescription = computed(() => ({
  hover: 'Hover over text and use the lightweight key combo for instant translations.',
  selection: 'Select text, then view the original and translation as you prefer.',
  floating: 'Keep the full-page translation entry exactly where it feels most natural.',
  appearance: 'Adjust the bilingual layout, translation style, and interface theme.',
  image: 'Move the mouse over an image and open the translation entry from its top-right corner.',
  video: 'Show real-time subtitle translations inside the YouTube player.',
}[activeDrawer.value]));
const hoverChoices = [
  { value: 'Control', label: 'Ctrl' },
  { value: 'Alt', label: 'Alt / Option' },
  { value: 'Shift', label: 'Shift' },
  { value: 'custom', label: 'Custom' },
];
const selectionModes = [
  { value: 'bilingual', label: 'Bilingual' },
  { value: 'translation-only', label: 'Translation only' },
];
const selectionTriggers = [
  { value: 'direct', label: 'Show immediately' },
  { value: 'icon', label: 'Show icon' },
  { value: 'dot', label: 'Show dot' },
];

function applyTheme(theme: string) {
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'auto' && darkMode.matches));
}

async function hydrate() {
  await configReady;
  Object.assign(config.value, runtimeConfig);
  lastSerialized = JSON.stringify(config.value);
  hydrated.value = true;
  applyTheme(config.value.theme || 'auto');
}
void hydrate();

const unsubscribeConfig = subscribeConfig((value) => {
  const serialized = JSON.stringify(value);
  if (serialized === lastSerialized) return;
  lastSerialized = serialized;
  applyingExternalConfig = true;
  try {
    Object.assign(config.value, value);
  } finally {
    applyingExternalConfig = false;
  }
});

watch(config, async value => {
  if (!hydrated.value || applyingExternalConfig) return;
  const serialized = JSON.stringify(value);
  if (serialized === lastSerialized) return;
  lastSerialized = serialized;
  await persistConfig(value).catch((error) => console.warn('[FluentRead] Failed to save popup settings', error));
}, { deep: true, flush: 'sync' });
watch(() => config.value.theme, theme => applyTheme(theme || 'auto'));
darkMode.onchange = () => { if (config.value.theme === 'auto') applyTheme('auto'); };

function closeServicePicker(event?: Event) {
  if (event && servicePicker.value?.contains(event.target as Node)) return;
  servicePickerOpen.value = false;
}
function openDonation() { donationVisible.value = true; }
function closeDonation() { donationVisible.value = false; }
function handleDonationKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && donationVisible.value) closeDonation();
}
function handleServicePickerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeServicePicker();
}
function toggleServicePicker() {
  if (!config.value.on) return;
  servicePickerOpen.value = !servicePickerOpen.value;
  if (servicePickerOpen.value) moreServicesOpen.value = !popularServiceValues.includes(config.value.service);
}
function selectService(value: string) {
  config.value.service = value;
  servicePickerOpen.value = false;
}
onMounted(() => {
  document.addEventListener('pointerdown', closeServicePicker);
  document.addEventListener('keydown', handleServicePickerKeydown);
  document.addEventListener('keydown', handleDonationKeydown);
});
onUnmounted(() => {
  persistOnPageExit();
  window.removeEventListener('pagehide', saveOnPageHide);
  unsubscribeConfig();
  document.removeEventListener('pointerdown', closeServicePicker);
  document.removeEventListener('keydown', handleServicePickerKeydown);
  document.removeEventListener('keydown', handleDonationKeydown);
  darkMode.onchange = null;
  if (noticeTimer) clearTimeout(noticeTimer);
});

function saveOnPageHide() {
  persistOnPageExit();
}
window.addEventListener('pagehide', saveOnPageHide);

// Firefox 可能同时触发 pagehide 和 unmounted；只提交一次最新快照。
function persistOnPageExit() {
  if (!hydrated.value || pageExitSaveStarted) return;
  pageExitSaveStarted = true;
  void saveConfig(config.value).catch((error) => console.warn('[FluentRead] Failed to save settings locally before closing popup', error));
  void persistConfig(config.value).catch((error) => console.warn('[FluentRead] Failed to save settings in background before closing popup', error));
}

function showNotice(message: string, type: 'success' | 'error' = 'success') {
  notice.value = message;
  noticeType.value = type;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.value = ''; }, 2200);
}

async function broadcast(message: Record<string, unknown>) {
  const tabs = await browser.tabs.query({});
  await Promise.allSettled(tabs.filter(tab => tab.id).map(tab => browser.tabs.sendMessage(tab.id!, message)));
}

function setPluginEnabled(enabled: boolean) {
  config.value.on = enabled;
  if (!enabled) {
    void broadcast({ type: 'toggleFloatingBall', isEnabled: false });
    void broadcast({ type: 'updateSelectionTranslatorMode', mode: 'disabled' });
    void broadcast({ type: 'toggleImageTranslator', isEnabled: false });
    return;
  }

  void broadcast({ type: 'toggleFloatingBall', isEnabled: !config.value.disableFloatingBall });
  void broadcast({ type: 'updateSelectionTranslatorMode', mode: config.value.selectionTranslatorMode });
  void broadcast({ type: 'toggleImageTranslator', isEnabled: !config.value.disableImageTranslator });
}

function openDrawer(name: DrawerName) { activeDrawer.value = name; drawerVisible.value = true; }
async function openOptions(section?: SettingsSection) {
  if (section) {
    await browser.tabs.create({ url: `${browser.runtime.getURL('options.html')}#${section}` });
  } else {
    await browser.runtime.openOptionsPage();
  }
  window.close();
}

async function togglePageTranslation() {
  if (credentialWarning.value) {
    showNotice(credentialWarning.value, 'error');
    return;
  }

  translating.value = true;
  const action = pageTranslated.value ? 'restore' : 'fullPage';
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const response = await browser.tabs.sendMessage(tab.id, { type: 'contextMenuTranslate', action }) as { status?: string } | undefined;
    if (response?.status !== 'success') throw new Error(response?.status === 'disabled' ? 'Plugin disabled' : 'Translation failed');
    pageTranslated.value = action === 'fullPage';
    showNotice(pageTranslated.value ? 'Translating the current page…' : 'Restored the original page');
  } catch (error) {
    console.error(error);
    showNotice('This page cannot be translated right now. Please refresh and try again.', 'error');
  } finally { translating.value = false; }
}

async function clearCache() {
  clearingCache.value = true;
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    await browser.tabs.sendMessage(tab.id, { message: 'clearCache' });
    showNotice('All translation caches cleared');
  } catch (error) {
    console.error(error);
    showNotice('Failed to clear cache', 'error');
  } finally { clearingCache.value = false; }
}

function toggleHover() { config.value.hotkey = config.value.hotkey === 'none' ? 'Control' : 'none'; }
function setHoverHotkey(value: string) {
  config.value.hotkey = value;
  if (value === 'custom' && !config.value.customHotkey) showCustomMouseHotkeyDialog.value = true;
}
function setSelectionMode(mode: string) {
  config.value.selectionTranslatorMode = mode;
  config.value.disableSelectionTranslator = mode === 'disabled';
  void broadcast({ type: 'updateSelectionTranslatorMode', mode });
}
function setSelectionTrigger(trigger: string) {
  config.value.selectionTranslatorTrigger = trigger;
}
function setFloatingEnabled(enabled: boolean) {
  config.value.disableFloatingBall = !enabled;
  void broadcast({ type: 'toggleFloatingBall', isEnabled: enabled });
}
function setImageTranslatorEnabled(enabled: boolean) {
  config.value.disableImageTranslator = !enabled;
  void broadcast({ type: 'toggleImageTranslator', isEnabled: enabled });
}
function setVideoTranslationEnabled(enabled: boolean) {
  config.value.videoTranslationEnabled = enabled;
}
function handleFloatingHotkeyChange() {
  if (config.value.floatingBallHotkey === 'custom' && !config.value.customFloatingBallHotkey) showCustomHotkeyDialog.value = true;
}
function confirmFloatingHotkey(hotkey: string) { config.value.customFloatingBallHotkey = hotkey; config.value.floatingBallHotkey = 'custom'; }
function cancelFloatingHotkey() { if (!config.value.customFloatingBallHotkey) config.value.floatingBallHotkey = 'Alt+T'; }
function confirmMouseHotkey(hotkey: string) { config.value.customHotkey = hotkey; config.value.hotkey = 'custom'; }
function cancelMouseHotkey() { if (!config.value.customHotkey) config.value.hotkey = 'Control'; }
</script>
