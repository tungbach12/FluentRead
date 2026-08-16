<template>
  <div class="settings-app">
    <aside class="sidebar">
      <div class="brand">
        <img src="/icon/128.png" alt="" />
        <div><strong>FluentRead</strong><small>FluentRead · V{{ version }}</small></div>
      </div>

      <nav aria-label="Settings sections">
        <section v-for="group in navigationGroups" :key="group.label" class="nav-group">
          <span class="nav-group-label">{{ group.label }}</span>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            :class="{ active: activeSection === item.id }"
            :aria-current="activeSection === item.id ? 'page' : undefined"
            @click="selectSection(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span>
          </button>
        </section>
      </nav>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div>
          <span class="eyebrow">{{ activeItem.group }}</span>
          <h1>{{ activeItem.heading }}</h1>
          <p>{{ activeItem.summary }}</p>
        </div>
        <label class="search-box">
          <span aria-hidden="true">⌕</span>
          <input v-model.trim="query" type="search" placeholder="Search settings, e.g. shortcut, cache, OpenAI" />
        </label>
      </header>

      <div v-if="query && filteredResults.length" class="search-results">
        <button v-for="result in filteredResults" :key="result.id" type="button" @click="selectResult(result.id)">
          <span><strong>{{ result.label }}</strong><small>{{ result.searchDescription }}</small></span><b>Open →</b>
        </button>
      </div>
      <div v-else-if="query" class="search-empty">No settings found for “{{ query }}”</div>

      <section class="settings-card" :class="{ 'services-view': activeSection === 'settings-services' }" :aria-label="activeItem.heading">
        <div v-if="!['settings-services', 'settings-about'].includes(activeSection)" class="card-intro">
          <span class="eyebrow">{{ activeItem.kicker }}</span>
          <h2>{{ activeItem.title }}</h2>
          <p>{{ activeItem.detail }}</p>
        </div>
        <section v-if="activeSection === 'settings-about'" id="settings-about" class="about-page" aria-labelledby="about-title">
          <div class="about-hero">
            <img class="about-logo" src="/icon/128.png" alt="FluentRead logo" />
            <div>
              <span class="eyebrow">About FluentRead</span>
              <h3 id="about-title">Bilingual reading, made natural</h3>
              <p>FluentRead is an open-source browser translation extension that helps you understand content in different languages naturally as you read.</p>
              <span class="about-version">FluentRead · V{{ version }}</span>
            </div>
          </div>

          <div class="about-grid">
            <article class="about-panel">
              <span class="about-panel-kicker">Core experience</span>
              <h3>Built for reading</h3>
              <p>From full-page translation to selection, floating ball, and shortcuts — every capability lives exactly where you need it.</p>
              <div class="about-feature-list">
                <span><b>译</b>Bilingual full-page reading</span>
                <span><b>⌘</b>Reading tools, at hand</span>
                <span><b>AI</b>Flexible translation services</span>
              </div>
            </article>

            <article class="about-panel about-links-panel">
              <span class="about-panel-kicker">Learn more</span>
              <h3>Make it better together</h3>
              <p>Browse the source code, read the docs, or share your thoughts on reading.</p>
              <div class="about-links">
                <a href="https://github.com/Bistutu/FluentRead" target="_blank" rel="noreferrer">Open source <span>↗</span></a>
                <a href="https://fluent.thinkstu.com/" target="_blank" rel="noreferrer">Documentation <span>↗</span></a>
                <a href="https://github.com/Bistutu/FluentRead/issues" target="_blank" rel="noreferrer">Report an issue <span>↗</span></a>
              </div>
            </article>
          </div>

          <p class="about-footer">Thank you for using FluentRead.</p>
        </section>
        <Main v-else :active-section="activeSection" />
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Main from '@/components/Main.vue'
import { navigationGroups, navigationItems } from './navigation'

const version = process.env.VUE_APP_VERSION
const query = ref('')
const activeSection = ref('settings-general')

const navigation = navigationItems
const activeItem = computed(() => navigation.find((item) => item.id === activeSection.value) || navigation[0])

const filteredResults = computed(() => {
  if (!query.value) return []
  const keyword = query.value.toLocaleLowerCase()
  return navigation.filter((item) =>
    `${item.label}${item.description}${item.heading}${item.summary}${item.searchDescription}`
      .toLocaleLowerCase()
      .includes(keyword),
  )
})

function selectSection(id: string) {
  if (!navigation.some((item) => item.id === id)) return
  activeSection.value = id
  query.value = ''
  history.replaceState(null, '', `#${id}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectResult(id: string) {
  selectSection(id)
}

onMounted(() => {
  const requestedSection = window.location.hash.slice(1)
  if (navigation.some((item) => item.id === requestedSection)) {
    activeSection.value = requestedSection
  }
})
</script>
