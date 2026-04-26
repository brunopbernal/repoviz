import { test, expect, Page } from "@playwright/test";

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function waitForGraph(page: Page): Promise<void> {
  // Wait until either the graph nodes appear OR the empty/error state appears
  await page.waitForSelector(
    "#node-layer .node, #empty-state, #error-overlay",
    { timeout: 10_000 }
  );
}

// ── Desktop ───────────────────────────────────────────────────────────────────

test.describe("Graph Viewer — Desktop (1280x800)", () => {
  test.use({ viewport: DESKTOP });

  test("renders graph with correct node count", async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto("/");
    await waitForGraph(page);

    // Summary bar must show non-zero nodes
    const nodeCount = await page.locator("#summary-nodes").textContent();
    const edgeCount = await page.locator("#summary-edges").textContent();
    console.log(`Summary bar: ${nodeCount} nodes, ${edgeCount} edges`);

    await page.screenshot({ path: "test-results/visual-debug/desktop-graph.png", fullPage: false });

    // Must not show error overlay
    await expect(page.locator("#error-overlay")).toHaveCount(0);
    // Must not show empty state
    await expect(page.locator("#empty-state")).toHaveCount(0);
    // Must render at least one node
    const nodes = page.locator("#node-layer .node");
    await expect(nodes).not.toHaveCount(0);
    // Summary bar must show > 0 nodes
    expect(Number(nodeCount)).toBeGreaterThan(0);

    if (consoleErrors.length > 0) {
      console.warn("Console errors:", consoleErrors);
    }
    expect(consoleErrors.length, `Console errors: ${consoleErrors.join("\n")}`).toBe(0);
  });

  test("summary bar shows repo path and harness", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);

    const repo = await page.locator("#summary-repo").textContent();
    const harnesses = await page.locator("#summary-harnesses").textContent();
    console.log(`Repo: ${repo} | Harnesses: ${harnesses}`);

    expect(repo).not.toBe("—");
    expect(harnesses).not.toBe("—");

    await page.screenshot({ path: "test-results/visual-debug/desktop-summary-bar.png" });
  });

  test("left panel (search, categories, legend) is visible", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);

    await expect(page.locator("#left-panel")).toBeVisible();
    await expect(page.locator("#search-input")).toBeVisible();
    await expect(page.locator("#legend")).toBeVisible();

    await page.screenshot({ path: "test-results/visual-debug/desktop-left-panel.png" });
  });

  test("node tooltip appears on hover", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);

    const firstNode = page.locator("#node-layer .node").first();
    await firstNode.hover();
    await page.waitForTimeout(200);

    const tooltip = page.locator("#tooltip");
    const opacity = await tooltip.evaluate((el) => window.getComputedStyle(el).opacity);
    console.log(`Tooltip opacity after hover: ${opacity}`);
    expect(parseFloat(opacity)).toBeGreaterThan(0);

    await page.screenshot({ path: "test-results/visual-debug/desktop-tooltip.png" });
  });

  test("sidebar opens on node click", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);

    const firstNode = page.locator("#node-layer .node").first();
    await firstNode.click();
    await page.waitForTimeout(400);

    await expect(page.locator("#sidebar.open")).toBeVisible();
    await page.screenshot({ path: "test-results/visual-debug/desktop-sidebar.png" });
  });

  test("search filters nodes", async ({ page }) => {
    await page.goto("/");
    await waitForGraph(page);

    const search = page.locator("#search-input");
    await search.fill("zzz-no-match");
    await page.waitForTimeout(300);

    await page.screenshot({ path: "test-results/visual-debug/desktop-search-noresult.png" });

    // All nodes should be faded (opacity 0.15)
    const nodeOpacities = await page.locator("#node-layer .node").evaluateAll(
      (nodes) => nodes.map((n) => parseFloat(window.getComputedStyle(n).opacity))
    );
    console.log("Node opacities after no-match search:", nodeOpacities);
    const allFaded = nodeOpacities.every((op) => op < 0.5);
    expect(allFaded).toBe(true);
  });

  test("no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await waitForGraph(page);

    await page.screenshot({ path: "test-results/visual-debug/desktop-full.png" });
    expect(errors, `JS errors on load:\n${errors.join("\n")}`).toHaveLength(0);
  });
});

// ── Mobile ────────────────────────────────────────────────────────────────────

test.describe("Graph Viewer — Mobile (390x844)", () => {
  test.use({ viewport: MOBILE });

  test("renders on mobile viewport", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await waitForGraph(page);

    await page.screenshot({ path: "test-results/visual-debug/mobile-graph.png", fullPage: false });

    await expect(page.locator("#error-overlay")).toHaveCount(0);
    const nodeCount = await page.locator("#summary-nodes").textContent();
    expect(Number(nodeCount)).toBeGreaterThan(0);

    if (errors.length > 0) console.warn("Mobile console errors:", errors);
    expect(errors, `Mobile JS errors:\n${errors.join("\n")}`).toHaveLength(0);
  });
});
