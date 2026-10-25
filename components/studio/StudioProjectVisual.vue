<script setup lang="ts">
import {
  ArrowDown,
  ArrowRight,
  Braces,
  FileCode2,
  Layers2,
  MousePointer2,
  Type,
  Check,
  FileWarning,
} from '@lucide/vue'
import { studioCopy as copy } from '~/content/portfolio'
const props = defineProps<{
  projectId: string
  compact?: boolean
  interactive?: boolean
}>()
const visual = useTemplateRef<HTMLElement>('visual')
const { pointer } = useStudioMotion()
let layers: HTMLElement[] = []
const spring = useStudioSpring((amount) => {
  layers.forEach((layer, index) => {
    if (index === 0) {
      const rotation = props.projectId === 'monitor' ? -3 + amount * 2 : 0
      layer.style.transform = `rotate(${rotation}deg) scale(${1 + amount * 0.025})`
    } else {
      const rotation =
        props.projectId === 'monitor'
          ? index === 1
            ? 4
            : 5
          : props.projectId === 'paratrooper'
            ? -3
            : props.projectId === 'bugjar'
              ? -8
              : 6
      layer.style.transform = `translate(${amount * (index === 1 ? 12 : 18)}px, ${amount * (index === 1 ? -12 : 6)}px) rotate(${rotation * (1 - amount * 0.5)}deg)`
    }
  })
})
function hover(active: boolean) {
  if (props.interactive && pointer.value) spring.move(active ? 1 : 0, 0)
}
onMounted(() => {
  if (props.interactive)
    layers = [
      ...(visual.value?.querySelectorAll<HTMLElement>(
        '.visual-main,.visual-satellite',
      ) ?? []),
    ]
})
watch(pointer, (value) => {
  if (!value) spring.reset()
})
</script>

<template>
  <div
    ref="visual"
    class="studio-project-visual"
    :class="[
      `visual-${projectId}`,
      { 'is-compact': compact, 'has-spring': interactive },
    ]"
    aria-hidden="true"
    @pointerenter="hover(true)"
    @pointerleave="hover(false)"
  >
    <template v-if="projectId === 'monitor'">
      <div class="visual-editor-main visual-main">
        <div class="visual-editor-toolbar">
          <span>{{ copy.visual.editor.label.en }}</span
          ><span
            ><MousePointer2 :size="14" /><Type :size="14" /><Layers2 :size="14"
          /></span>
        </div>
        <div class="visual-editor-paper">
          <span class="visual-editor-heading">{{
            copy.visual.editor.headline.en
          }}</span
          ><span class="visual-editor-selection"><i /><i /><i /><i /></span>
        </div>
      </div>
      <div class="visual-editor-layer visual-satellite">
        <Layers2 :size="17" /><span>{{ copy.visual.editor.layers[1]!.en }}</span
        ><Check :size="14" />
      </div>
      <div class="visual-editor-type visual-satellite studio-script">
        Aa<span>{{ copy.visual.editor.layers[0]!.en }}</span>
      </div>
    </template>
    <template v-else-if="projectId === 'paratrooper'">
      <div class="visual-recovery-track visual-main">
        <span v-for="(word, index) in copy.visual.recovery.words" :key="word.en"
          ><small>0{{ index + 1 }}</small
          >{{ word.en }}<ArrowRight v-if="index < 2" :size="20"
        /></span>
      </div>
      <div class="visual-recovery-receipt visual-satellite">
        <strong>{{ copy.visual.recovery.big.en }}</strong
        ><span>{{ copy.visual.recovery.small.en }}</span>
      </div>
    </template>
    <template v-else-if="projectId === 'bugjar'">
      <div class="visual-debug-main visual-main">
        <FileWarning :size="34" :stroke-width="1.2" /><span>{{
          copy.visual.debug.input.en
        }}</span
        ><strong>{{ copy.visual.debug.error.en }}</strong
        ><ArrowDown :size="22" /><span class="visual-debug-resolution"
          ><Check :size="18" />{{ copy.visual.debug.resolved.en }}</span
        >
      </div>
      <div class="visual-debug-code visual-satellite">
        FileReader<br ><span>try / catch</span>
      </div>
    </template>
    <template v-else>
      <div class="visual-context-main visual-main">
        <Braces :size="32" :stroke-width="1.2" /><strong>{{
          copy.visual.ai.context.en
        }}</strong
        ><span v-for="file in copy.visual.ai.files" :key="file"
          ><FileCode2 :size="20" />{{ file }}</span
        >
      </div>
      <div class="visual-context-end visual-satellite">
        Vue<ArrowRight :size="22" />AI
      </div>
    </template>
  </div>
</template>
