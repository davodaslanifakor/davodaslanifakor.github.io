import { expect, test } from "@playwright/test";

test("drawn headline changes phrases without changing heading semantics or layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/studio/");
  const headline = page.locator(".studio-headline");
  await expect(headline).toHaveClass(/is-drawn/);
  await expect(
    page.getByRole("heading", {
      name: "I build tools people create with.",
      exact: true,
    }),
  ).toBeVisible();
  // Measure after the intro entrance, rather than its temporary 24px offset.
  await expect.poll(() => page.locator(".studio-hero-intro").evaluate(
    (element) => element.getAnimations().some((animation) => animation.playState === "running"),
  )).toBe(false);
  const before = await page.locator(".studio-hero-intro").boundingBox();
  await expect(headline).toHaveAttribute("data-phrase-index", "1", {
    timeout: 12000,
  });
  const after = await page.locator(".studio-hero-intro").boundingBox();
  expect(after!.y).toBeCloseTo(before!.y, 0);
  await page
    .getByRole("button", { name: "Pause headline animation", exact: true })
    .click();
  const index = await headline.getAttribute("data-phrase-index");
  await page.waitForTimeout(1800);
  await expect(headline).toHaveAttribute("data-phrase-index", index!);
  const third = page.getByRole("button", {
    name: "Show headline: ideas take shape in.",
    exact: true,
  });
  await third.focus();
  await page.keyboard.press("Enter");
  await expect(headline).toHaveAttribute("data-phrase-index", "2");
  await expect(third).toHaveAttribute("aria-pressed", "true");
  const glyph = headline
    .locator("[data-phrase]")
    .nth(2)
    .locator("path")
    .first();
  await expect(glyph).toHaveCSS("fill-opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(headline).toHaveAttribute("data-phrase-index", "0");
  await expect(
    page.getByRole("group", { name: "Choose a headline" }),
  ).toHaveCount(0);
  await expect(headline.locator("[data-phrase]").first()).toHaveCSS(
    "opacity",
    "1",
  );
});

test("phone headline controls remain clear and route teardown leaves no animation errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio/");
  await expect(page.locator(".studio-headline")).toHaveClass(/is-drawn/);
  await page
    .getByRole("button", {
      name: "Show headline: teams build on.",
      exact: true,
    })
    .click();
  await expect(page.locator(".studio-headline")).toHaveAttribute(
    "data-phrase-index",
    "1",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const controls = await page
    .locator(".studio-headline-controls")
    .boundingBox();
  const intro = await page.locator(".studio-hero-intro").boundingBox();
  expect(controls!.y + controls!.height).toBeLessThanOrEqual(intro!.y);
  await page.getByRole("link", { name: "Work", exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.goto("/cv/");
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("reduced motion loads a complete static first phrase", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/studio/");
  await expect(
    page.getByRole("heading", {
      name: "I build tools people create with.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".studio-headline")).toHaveClass(/is-drawn/);
  await expect(
    page.locator(".studio-headline [data-phrase]").first(),
  ).toHaveCSS("opacity", "1");
  await expect(
    page
      .locator(".studio-headline [data-phrase]")
      .first()
      .locator("path")
      .first(),
  ).toHaveCSS("fill-opacity", "1");
  await expect(
    page.getByRole("group", { name: "Choose a headline" }),
  ).toHaveCount(0);
});
