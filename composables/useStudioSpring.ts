/** A small damped spring. Runs only while settling; never rerenders Vue per frame. */
export function useStudioSpring(render: (x: number, y: number) => void) {
  let frame = 0
  let x = 0
  let y = 0
  let vx = 0
  let vy = 0
  let targetX = 0
  let targetY = 0
  let last = 0
  function tick(time: number) {
    const dt = Math.min((time - (last || time - 16)) / 1000, 0.032)
    last = time
    vx += ((targetX - x) * 220 - vx * 24) * dt
    vy += ((targetY - y) * 220 - vy * 24) * dt
    x += vx * dt
    y += vy * dt
    render(x, y)
    if (Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(vx) + Math.abs(vy) > 0.025)
      frame = requestAnimationFrame(tick)
    else {
      frame = 0
      last = 0
      render(targetX, targetY)
    }
  }
  function move(nextX: number, nextY: number) {
    targetX = nextX
    targetY = nextY
    if (!frame) frame = requestAnimationFrame(tick)
  }
  function reset() {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
    x = y = vx = vy = targetX = targetY = 0
    render(0, 0)
  }
  function snap(nextX: number, nextY: number) {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
    vx = vy = 0
    x = targetX = nextX
    y = targetY = nextY
    render(x, y)
  }
  onBeforeUnmount(reset)
  return { move, reset, snap }
}
