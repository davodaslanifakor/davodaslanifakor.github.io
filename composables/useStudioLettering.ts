import type { Ref } from "vue";

/** SVG tracing is independent of the hero's scroll/exit transform. */
export function useStudioLettering(
  target: Readonly<Ref<HTMLElement | null>>,
  count: number,
) {
  const active = shallowRef(0);
  const paused = shallowRef(false);
  const enhanced = shallowRef(false);
  const { reduced } = useStudioMotion();
  let timeline:
    ReturnType<(typeof import("gsap"))["gsap"]["timeline"]> | undefined;
  let context:
    ReturnType<(typeof import("gsap"))["gsap"]["context"]> | undefined;
  let observer: IntersectionObserver | undefined;
  let visible = true;
  let disposed = false;

  function syncPlayback() {
    timeline?.paused(
      paused.value || reduced.value || !visible || document.hidden,
    );
  }
  function select(index: number) {
    if (!timeline || index < 0 || index >= count) return;
    // Manual and keyboard selection is immediate and remains readable.
    paused.value = true;
    timeline.pause().seek(`hold-${index}`, false);
    active.value = index;
  }
  function toggle() {
    paused.value = !paused.value;
    if (paused.value) timeline?.pause().seek(`hold-${active.value}`, false);
    syncPlayback();
  }
  watch(reduced, (value) => {
    if (value && timeline) {
      timeline.pause().seek("hold-0", false);
      active.value = 0;
    }
    syncPlayback();
  });

  onMounted(async () => {
    const [motion, draw] = await Promise.all([
      loadStudioMotion(),
      import("gsap/DrawSVGPlugin").catch(() => null),
      document.fonts.ready,
    ]);
    if (disposed || !motion || !draw || !target.value) return;
    const { gsap } = motion;
    gsap.registerPlugin(draw.DrawSVGPlugin);
    context = gsap.context(() => {
      const groups = [
        ...target.value!.querySelectorAll<SVGGElement>("[data-phrase]"),
      ];
      const flourish =
        target.value!.querySelector<SVGPathElement>("[data-flourish]");
      gsap.set(groups, { autoAlpha: 0 });
      timeline = gsap.timeline({ repeat: -1, paused: true });
      groups.forEach((group, index) => {
        const paths = group.querySelectorAll("path");
        timeline!
          .addLabel(`phrase-${index}`)
          .call(() => {
            active.value = index;
          })
          .set(group, { autoAlpha: 1 })
          .set(paths, { drawSVG: "0%", fillOpacity: 0, strokeOpacity: 1 })
          .set(flourish, { drawSVG: "0%", opacity: 0.65 })
          .to(paths, {
            drawSVG: "100%",
            duration: 0.85,
            stagger: { amount: 0.6 },
            ease: "power2.inOut",
          })
          .to(
            paths,
            {
              fillOpacity: 1,
              strokeOpacity: 0,
              duration: 0.38,
              stagger: { amount: 0.25 },
            },
            "-=0.65",
          )
          .to(
            flourish,
            { drawSVG: "100%", duration: 0.7, ease: "power2.out" },
            "-=0.35",
          )
          .addLabel(`hold-${index}`)
          .to({}, { duration: 3.8 })
          .to(paths, { fillOpacity: 0, strokeOpacity: 1, duration: 0.18 })
          .to(paths, {
            drawSVG: "100% 100%",
            duration: 0.38,
            stagger: { amount: 0.18, from: "end" },
            ease: "power2.in",
          })
          .to(
            flourish,
            { drawSVG: "100% 100%", opacity: 0, duration: 0.3 },
            "<",
          )
          .set(group, { autoAlpha: 0 });
      });
    }, target.value);
    enhanced.value = true;
    if (reduced.value) timeline?.seek("hold-0", false);
    observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        syncPlayback();
      },
      { threshold: 0.15 },
    );
    observer.observe(target.value);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();
  });
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    document.removeEventListener("visibilitychange", syncPlayback);
    context?.revert();
  });
  return {
    active: readonly(active),
    paused: readonly(paused),
    enhanced: readonly(enhanced),
    reduced,
    select,
    toggle,
  };
}
