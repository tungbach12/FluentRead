export type NavigationItem = {
  id: string
  icon: string
  label: string
  description: string
  group: string
  heading: string
  summary: string
  kicker: string
  title: string
  detail: string
  searchDescription: string
}

export type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'General',
    items: [
      {
        id: 'settings-general', icon: '⌂', label: 'General settings', description: 'Status & display', group: 'General',
        heading: 'Fine-tune your reading experience', summary: 'Manage the extension status, translation modes, and how translations are displayed.',
        kicker: 'Reading preferences', title: 'General settings', detail: 'The most-used toggles live here and are saved automatically.',
        searchDescription: 'Enable/disable the extension, bilingual mode, translation style, and theme',
      },
      {
        id: 'settings-services', icon: '译', label: 'Translation services', description: 'Services & models', group: 'General',
        heading: 'Configure translation services and models', summary: 'Organized into machine and AI translation. Set the services, models, and connection settings used for web page translation by default.',
        kicker: 'Translation capabilities', title: 'Translation services & models', detail: 'Configure the service, model, and connection parameters used for page translation by default.',
        searchDescription: 'Microsoft Translator, OpenAI, DeepSeek, Gemini, models, and tokens',
      },
    ],
  },
  {
    label: 'Reading tools',
    items: [
      {
        id: 'settings-shortcuts', icon: '⌘', label: 'Interaction & shortcuts', description: 'Hover, selection, full page', group: 'Reading tools',
        heading: 'Make translation happen naturally', summary: 'Set how hover, selection, and full-page translation are triggered.',
        kicker: 'How you interact', title: 'Interaction & shortcuts', detail: 'Choose memorable, conflict-free triggers for your most frequent actions.',
        searchDescription: 'Hover translation, selection translation, full-page translation, and custom keys',
      },
      {
        id: 'settings-image-translation', icon: '图', label: 'Image translation', description: 'OCR & language packs', group: 'Reading tools',
        heading: 'Manage image translation languages', summary: 'Image translation uses on-device OCR. Download the relevant language pack before your first use.',
        kicker: 'Beta', title: 'Image translation', detail: 'Download OCR language packs on demand; Simplified Chinese and English are recommended first.',
        searchDescription: 'Image translation, OCR, language packs, Chinese, English, Japanese, download',
      },
      {
        id: 'settings-video', icon: 'CC', label: 'Video subtitles Beta', description: 'Translate while watching YouTube', group: 'Reading tools',
        heading: 'Translate video subtitles as you watch', summary: 'Show translations below YouTube’s native captions, with an independently selected video translation service.',
        kicker: 'FluentRead video translation Beta', title: 'FluentRead YouTube video subtitles', detail: 'Only subtitle text already provided by the player is processed — no audio or video content is uploaded.',
        searchDescription: 'YouTube, video subtitles, video translation service, DeepLX, Microsoft Translator',
      },
    ],
  },
  {
    label: 'System & data',
    items: [
      {
        id: 'settings-advanced', icon: '◇', label: 'Advanced options', description: 'Performance & templates', group: 'System & data',
        heading: 'Fine-grained control over behavior', summary: 'Manage cache, animations, concurrency, floating tools, proxy, and AI prompts.',
        kicker: 'Runtime strategies', title: 'Advanced options', detail: 'These settings target performance, compatibility, and advanced translation behavior.',
        searchDescription: 'Cache, animations, concurrency, floating ball, input fields, proxy, and prompts',
      },
      {
        id: 'settings-data', icon: '⇅', label: 'Config management', description: 'Import & export', group: 'System & data',
        heading: 'Back up and migrate configuration', summary: 'Export your current settings or restore your preferences from an existing config.',
        kicker: 'Data tools', title: 'Config management', detail: 'Use JSON for configuration backups, migration, and restoration.',
        searchDescription: 'Backup, migration, export and import JSON configuration',
      },
    ],
  },
  {
    label: 'About',
    items: [
      {
        id: 'settings-about', icon: 'i', label: 'About FluentRead', description: 'Version & project', group: 'About',
        heading: 'About FluentRead', summary: 'Learn about the extension version, core experience, and project links.',
        kicker: 'About the project', title: 'About FluentRead', detail: 'An open-source browser translation extension that makes bilingual reading feel natural.',
        searchDescription: 'Version, open source project, documentation, and issue reporting',
      },
    ],
  },
]

export const navigationItems = navigationGroups.flatMap((group) => group.items)
