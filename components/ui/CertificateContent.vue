<script setup lang="ts">
import { localize, vueCertificate } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <div class="certificate">
    <figure class="certificate-artwork">
      <img
        :src="vueCertificate.image"
        :alt="localize(vueCertificate.imageAlt, props.locale)"
        :width="vueCertificate.width"
        :height="vueCertificate.height"
      >
      <figcaption class="certificate-caption">
        <div>
          <strong>{{ localize(vueCertificate.qualification, props.locale) }}</strong>
          <span>{{ vueCertificate.awardedTo }}</span>
        </div>
        <div>
          <span>{{ localize(vueCertificate.date, props.locale) }}</span>
          <span dir="ltr">{{ vueCertificate.number }}</span>
        </div>
      </figcaption>
    </figure>
    <div class="certificate-links">
      <a :href="vueCertificate.verifyUrl" target="_blank" rel="noopener noreferrer">
        {{ localize(vueCertificate.verifyLabel, props.locale) }} <span aria-hidden="true">↗</span>
      </a>
      <a :href="vueCertificate.pdf" download>{{ localize(vueCertificate.downloadLabel, props.locale) }}</a>
    </div>
  </div>
</template>

<style scoped>
.certificate-artwork { margin: 0; }
.certificate-artwork img { display: block; width: auto; max-width: 100%; height: auto; max-height: 52svh; margin-inline: auto; background: #fff; box-shadow: 0 12px 36px rgb(0 0 0 / 20%); }
.certificate-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; padding-top: 1.25rem; font-size: .85rem; line-height: 1.6; }
.certificate-caption div { display: grid; }
.certificate-caption span { color: var(--muted); }
.certificate-links { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; margin-top: 1.5rem; }
.certificate-links a { display: inline-flex; align-items: center; gap: .5rem; min-height: 44px; color: var(--ink); text-decoration-color: var(--acid); text-underline-offset: .3em; }
.certificate-links a:hover { color: var(--acid); }
.certificate-links a:focus-visible { outline: 2px solid var(--acid); outline-offset: 4px; }
</style>
