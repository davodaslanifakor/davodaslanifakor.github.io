<script setup lang="ts">
import { caseStudies, libraryPortrait, localize, profile, roles, skillGroups, skills, ui, vueCertificate, writing } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import WorldClocksPanel from './WorldClocksPanel.vue'
import MobilePreview from '~/components/phone/MobilePreview.vue'
import LifeStoryContent from '~/components/story/LifeStoryContent.vue'
import ArticleList from '~/components/story/ArticleList.vue'
import CertificateContent from './CertificateContent.vue'
import ZoomableArtwork from './ZoomableArtwork.vue'

const props = defineProps<{
  contentRef: string
  locale: Locale
  epochMs: number
}>()

const emit = defineEmits<{
  close: []
}>()
const dialog = useTemplateRef<HTMLDivElement>('dialog')
const activeCase = computed(() => caseStudies.find((item) => item.id === props.contentRef))
const title = computed(() => {
  if (props.contentRef === 'about') return localize(ui.aboutMe, props.locale)
  if (props.contentRef === 'story') return localize(ui.lifeStory, props.locale)
  if (props.contentRef === 'timeline') return localize(ui.experience, props.locale)
  if (props.contentRef === 'skills') return localize(ui.skills, props.locale)
  if (props.contentRef === 'selected-work') return localize(ui.selectedWork, props.locale)
  if (props.contentRef === 'architecture') return localize(ui.architecture, props.locale)
  if (props.contentRef === 'contact') return localize(ui.contact, props.locale)
  if (props.contentRef === 'world-clocks') return localize(ui.worldClocksTitle, props.locale)
  if (props.contentRef === 'mobile-preview') return localize(ui.mobilePreviewTitle, props.locale)
  if (props.contentRef === 'certificate') return localize(vueCertificate.title, props.locale)
  if (props.contentRef === 'portrait') return localize(libraryPortrait.title, props.locale)
  return activeCase.value ? localize(activeCase.value.title, props.locale) : props.contentRef
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.stopPropagation(); emit('close') }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button, a[href], input, iframe, [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0)
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}

onMounted(() => dialog.value?.querySelector<HTMLElement>('button')?.focus())
</script>

<template>
  <div class="backdrop" role="presentation" @mousedown.self="emit('close')">
    <div ref="dialog" class="modal" :class="{ 'modal--artwork': ['certificate', 'portrait'].includes(props.contentRef), 'modal--phone': props.contentRef === 'mobile-preview' }" role="dialog" aria-modal="true" :aria-label="title" @keydown="onKeydown">
      <header class="modal-header">
        <p class="modal-kicker">{{ localize(ui.roomContext, props.locale) }} / {{ props.contentRef }}</p>
        <button class="close" type="button" @click="emit('close')">{{ localize(ui.close, props.locale) }} <span aria-hidden="true">×</span></button>
      </header>

      <div class="modal-body">
        <h2 class="modal-title">{{ title }}</h2>

        <WorldClocksPanel
          v-if="props.contentRef === 'world-clocks'"
          :epoch-ms="props.epochMs"
          :locale="props.locale"
        />

        <MobilePreview
          v-else-if="props.contentRef === 'mobile-preview'"
          :locale="props.locale"
        />

        <div v-if="props.contentRef === 'about'" class="about-block">
          <h3>{{ profile.name }}</h3>
          <p>{{ localize(profile.role, props.locale) }}</p>
          <p>{{ profile.specialties }} · {{ localize(profile.location, props.locale) }}</p>
          <p>{{ localize(profile.tagline, props.locale) }}</p>
          <p>{{ localize(profile.summary, props.locale) }}</p>
          <p>{{ localize(profile.cta, props.locale) }}</p>
          <dl class="about-facts">
            <div><dt>{{ localize(ui.education, props.locale) }}</dt><dd>{{ localize(profile.education, props.locale) }}</dd></div>
            <div><dt>{{ localize(ui.languages, props.locale) }}</dt><dd>{{ localize(profile.languages, props.locale) }}</dd></div>
          </dl>
        </div>

        <LifeStoryContent v-else-if="props.contentRef === 'story'" :locale="props.locale" />

        <CertificateContent v-else-if="props.contentRef === 'certificate'" :locale="props.locale" />

        <ZoomableArtwork v-else-if="props.contentRef === 'portrait'" :src="libraryPortrait.image" :alt="localize(libraryPortrait.imageAlt, props.locale)" :width="libraryPortrait.width" :height="libraryPortrait.height" :locale="props.locale" pixelated />

        <ol v-else-if="props.contentRef === 'timeline'" class="modal-list">
          <li v-for="role in roles" :key="role.id">
            <span>{{ role.company }} · {{ role.period }}</span>
            <strong>{{ localize(role.title, props.locale) }}</strong>
            <p>{{ localize(role.receipt, props.locale) }}</p>
          </li>
        </ol>

        <div v-else-if="props.contentRef === 'skills'" class="skill-columns">
          <section v-for="group in (['core', 'fullstack', 'quality', 'ai'] as const)" :key="group">
            <h3>{{ localize(skillGroups[group], props.locale) }}</h3>
            <p v-for="skill in skills.filter((item) => item.group === group)" :key="skill.id">
              <strong>{{ skill.name }}</strong> — {{ localize(skill.usedFor, props.locale) }}
            </p>
          </section>
          <p class="statement">{{ localize(ui.certifiedVue, props.locale) }}</p>
        </div>

        <template v-else-if="props.contentRef === 'selected-work'">
          <div class="case-index">
            <article v-for="study in caseStudies" :key="study.id">
              <h3>{{ localize(study.title, props.locale) }}</h3>
              <p>{{ localize(study.result, props.locale) }}</p>
            </article>
          </div>
          <template v-if="writing.articles.length">
            <h3 class="modal-subhead">{{ localize(ui.writing, props.locale) }}</h3>
            <ArticleList :locale="props.locale" />
          </template>
        </template>

        <p v-else-if="props.contentRef === 'architecture'" class="architecture-note">{{ localize(ui.architectureNote, props.locale) }}</p>

        <div v-else-if="props.contentRef === 'contact'" class="contact-block">
          <p>{{ localize(profile.cta, props.locale) }}</p>
          <ul class="contact-links">
            <li><a :href="`mailto:${profile.email}`">{{ localize(ui.emailLabel, props.locale) }} · {{ profile.email }}</a></li>
            <li><a :href="profile.linkedin" rel="noopener" target="_blank">{{ localize(ui.linkedinLabel, props.locale) }} ↗</a></li>
            <li><a :href="profile.github" rel="noopener" target="_blank">{{ localize(ui.githubLabel, props.locale) }} ↗</a></li>
            <li><a :href="profile.medium" rel="noopener" target="_blank">{{ localize(ui.mediumLabel, props.locale) }} ↗</a></li>
          </ul>
          <NuxtLink class="primary-link" to="/cv">{{ localize(ui.skipToCv, props.locale) }} ↗</NuxtLink>
        </div>

        <template v-else-if="activeCase">
          <dl class="case-flow">
            <div><dt>{{ localize(ui.problem, props.locale) }}</dt><dd>{{ localize(activeCase.problem, props.locale) }}</dd></div>
            <div><dt>{{ localize(ui.action, props.locale) }}</dt><dd>{{ localize(activeCase.action, props.locale) }}</dd></div>
            <div><dt>{{ localize(ui.result, props.locale) }}</dt><dd>{{ localize(activeCase.result, props.locale) }}</dd></div>
          </dl>
          <p v-for="link in activeCase.links ?? []" :key="link.href" class="case-link">
            <a :href="link.href" rel="noopener" target="_blank">{{ link.label }} ↗</a>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: clamp(0.6rem, 3vw, 2rem); background: rgb(4 5 6 / 78%); backdrop-filter: blur(12px); }
.modal { width: min(68rem, 100%); max-height: min(86svh, 52rem); overflow: auto; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 30px 100px rgb(0 0 0 / 55%); }
.modal-header { position: sticky; z-index: 2; top: 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding: 1rem 1.25rem; background: rgb(18 21 25 / 92%); backdrop-filter: blur(16px); }
.modal-kicker { margin: 0; color: var(--muted); font: 500 .75rem/1.4 var(--font-body); }
.close { min-height: 44px; border: 0; background: transparent; color: var(--ink); font: 500 .8125rem/1.4 var(--font-body); }
.modal-body { padding: clamp(1.5rem, 5vw, 4.5rem); }
.modal-title { max-width: 52rem; margin: 0 0 3.5rem; font: 400 clamp(2.8rem, 7vw, 6rem)/1.08 var(--font-heading); letter-spacing: -0.035em; }
.modal--artwork { width: min(86rem, 100%); max-height: 94svh; }
.modal--artwork .modal-body { padding: clamp(.8rem, 3vw, 2rem); }
.modal--artwork .modal-title { margin-bottom: 1.25rem; font-size: clamp(1.8rem, 4vw, 2.75rem); }
.modal--phone { width: min(58rem, 100%); max-height: 94svh; }
.modal--phone .modal-body { padding: clamp(1.25rem, 3vw, 2rem); }
.modal--phone .modal-title { margin-bottom: 1.5rem; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.1; letter-spacing: -.035em; }
.modal-list { margin: 0; padding: 0; list-style: none; }
.modal-list li { display: grid; grid-template-columns: minmax(8rem,.55fr) 1fr 1.5fr; gap: 1rem; border-top: 1px solid var(--line); padding: 1.1rem 0; }
.modal-list strong { color: var(--acid); font-size: 0.8rem; }
.modal-list p { margin: 0; color: var(--muted); line-height: 1.5; }
.skill-columns { display: grid; grid-template-columns: repeat(2,1fr); gap: 2rem; }
.skill-columns section { border-top: 1px solid var(--line); padding-top: 1rem; }
.skill-columns h3 { color: var(--ink); font: 400 1.5rem/1.25 var(--font-heading); }
.skill-columns p { color: var(--muted); line-height: 1.5; }
.skill-columns strong { color: var(--ink); }
.statement { max-width: 44rem; font-size: clamp(1.8rem,4vw,3.8rem); line-height: 1.1; }
 .case-index { display: grid; gap: 1rem; }
.case-index h3 { margin: 0 0 .5rem; font: 400 1.5rem/1.25 var(--font-heading); }
.case-index p { margin: 0; opacity: 0.8; }
.case-flow { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; margin: 0; }
.case-flow div { border-top: 1px solid var(--line); padding-top: 1rem; }
.case-flow dt { color: var(--acid); font: 500 .8125rem/1.5 var(--font-body); }
.case-flow dd { margin: 1rem 0 0; line-height: 1.62; }
.contact-block { max-width: 36rem; font-size: 1.2rem; line-height: 1.5; }
.about-block { max-width: 44rem; font-size: 1.2rem; line-height: 1.6; }
.pending { color: var(--muted); }
.case-link { margin: 2rem 0 0; }
.case-link a { border-bottom: 1px solid var(--acid); color: var(--ink); text-decoration: none; }
.case-link a:hover { color: var(--acid); }
.modal-subhead { margin: 2.5rem 0 1rem; color: var(--ink); font: 400 1.5rem/1.25 var(--font-heading); }
.architecture-note { max-width: 44rem; margin: 0; font-size: clamp(1.25rem,2.4vw,1.8rem); line-height: 1.4; }
.about-facts { display: grid; gap: 0.75rem; margin: 1.5rem 0 0; border-top: 1px solid var(--line); padding-top: 1rem; font-size: 1rem; }
.about-facts dt { color: var(--acid); font: 500 .8125rem/1.5 var(--font-body); }
.about-facts dd { margin: 0.25rem 0 0; }
.contact-links { display: grid; gap: 0.5rem; margin: 1.25rem 0; padding: 0; list-style: none; }
.contact-links a { border-bottom: 1px solid var(--acid); color: var(--ink); text-decoration: none; overflow-wrap: anywhere; }
.primary-link { display: inline-block; margin-top: 1.5rem; border-bottom: 1px solid var(--acid); color: var(--ink); text-decoration: none; }
@media (max-width: 700px) { .modal-list li,.case-flow,.skill-columns { grid-template-columns: 1fr; } .modal-title { margin-bottom: 2rem; } }
</style>
