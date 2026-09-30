import { chromium, Browser, Page } from 'playwright';
import { Readable } from 'stream';

interface FieldState {
  rotationAngle: number;
  tiltAngle: number;
  zoomLevel: number;
  fieldColor: string;
  players: Array<{
    id: number;
    x: number;
    y: number;
    name: string;
    number: string;
    isCaptain?: boolean;
    hasYellowCard?: boolean;
    hasRedCard?: boolean;
    isStarPlayer?: boolean;
  }>;
  showPlayerLabels: boolean;
  markerType: 'circle' | 'shirt';
  ball?: { x: number; y: number };
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
}

export class ScreenshotService {
  private static browser: Browser | null = null;

  static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
    }
    return this.browser;
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  static async captureField(state: FieldState, format: 'png' | 'jpeg', previewType: 'lineup' | 'tactics' = 'lineup'): Promise<Buffer> {
    const browser = await this.getBrowser();
    
    // Create a new context with device scale factor for high-DPI rendering
    const context = await browser.newContext({
      // Square and large enough to hold the zoomed board whichever way the
      // camera has turned it: rotated a quarter turn, the board's long side
      // becomes its height, and a viewport that only suited a landscape board
      // cropped it.
      viewport: { width: 4400, height: 4400 },
      // The export page lays the board out several times larger instead of
      // relying on a device scale factor, because that factor does not reach
      // inside the markers' own 3D layers. Resolution is bought there, so 1
      // here keeps the output from multiplying twice over.
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    try {
      // Get frontend URL from environment or use default
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const exportUrl = previewType === 'tactics'
        ? `${frontendUrl}/tactics-export-preview`
        : `${frontendUrl}/export-preview`;

      // Viewport is already set via context (3840x2160 with 2x scale = 7680x4320 effective)

      // Add CSS to improve rendering quality.
      //
      // Deliberately no `image-rendering` override: Chromium treats
      // `-webkit-optimize-contrast` as pixelated, and the kit artwork is
      // magnified by the board's perspective, so forcing it turned every shirt
      // into hard stair-stepped blocks. Smooth resampling is what a photograph
      // of the board should use.
      await page.addInitScript(() => {
        // @ts-ignore - document is available in browser context
        const style = document.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
          }
          svg {
            shape-rendering: geometricPrecision !important;
          }
        `;
        // @ts-ignore
        document.head.appendChild(style);
      });

      // Navigate to the export preview page first
      await page.goto(exportUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for the page to be fully loaded
      await page.waitForLoadState('domcontentloaded');

      // Inject the export state into the page
      await page.evaluate((state) => {
        // @ts-ignore - window is available in browser context
        (window as any).__EXPORT_STATE__ = state;
        // Trigger a custom event to notify React
        // @ts-ignore - window and CustomEvent are available in browser context
        window.dispatchEvent(new CustomEvent('exportStateReady', { detail: state }));
      }, state);

      // Wait for the page to signal it's ready (increased timeout)
      try {
        await page.waitForFunction(() => {
          // @ts-ignore - window is available in browser context
          return (window as any).__EXPORT_READY__ === true;
        }, { timeout: 30000 });
      } catch (error: any) {
        // Log error details for debugging
        const debugInfo = await page.evaluate(() => {
          // @ts-ignore - window and document are available in browser context
          const stateExists = !!(window as any).__EXPORT_STATE__;
          // @ts-ignore
          const readyFlag = (window as any).__EXPORT_READY__;
          // @ts-ignore
          const documentReady = document.readyState;
          return {
            stateExists,
            readyFlag,
            documentReady,
          };
        });
        console.error('Export timeout error:', {
          error: error.message,
          debugInfo,
          url: exportUrl,
          pageTitle: await page.title(),
        });
        throw error;
      }

      // Wait a bit more for 3D transforms to fully render
      await page.waitForTimeout(1000);

      // Find the field container - it should be in the export-field-container div
      const fieldContainer = await page.locator('#export-field-container');
      await fieldContainer.waitFor({ state: 'visible' });

      // Force a reflow to ensure 3D transforms are applied
      await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const container = document.getElementById('export-field-container');
        if (container) {
          // Force browser to recalculate layout
          void container.offsetHeight;
        }
      });

      // Wait a bit more for final rendering
      await page.waitForTimeout(500);

      // The page measures what the board actually paints — perspective pushes
      // its near edge past its own box, and the markers' labels reach further
      // still. Clipping to that keeps the outermost shirt in frame; the
      // element's layout box would shave it off.
      const measure = () =>
        page.evaluate(() => {
          const remeasure = (window as any).__MEASURE_BOUNDS__;
          if (typeof remeasure === 'function') remeasure();
          return (window as any).__EXPORT_BOUNDS__ ?? null;
        }) as Promise<{ x: number; y: number; width: number; height: number } | null>;

      let bounds = await measure();

      // A clip cannot reach past the window the page is rendered in, so the
      // window has to hold the whole board. Fitting by size alone is not
      // enough: a turned board can be narrower than the window and still hang
      // over its edge, and that overhang is what kept shaving the outermost
      // label. Grow until the bounds sit inside, re-measuring each time —
      // resizing re-centres the page, which moves them.
      const MAX_VIEWPORT = 8000;
      const MARGIN = 80;
      const fitsInside = (
        box: { x: number; y: number; width: number; height: number },
        view: { width: number; height: number },
      ) => box.x >= 0 && box.y >= 0 && box.x + box.width <= view.width && box.y + box.height <= view.height;

      for (let attempt = 0; attempt < 3; attempt++) {
        const viewport = page.viewportSize();
        if (!bounds || !viewport || fitsInside(bounds, viewport)) break;

        const target = {
          width: Math.min(
            MAX_VIEWPORT,
            Math.ceil(Math.max(viewport.width, bounds.width + MARGIN * 2, bounds.x + bounds.width + MARGIN)),
          ),
          height: Math.min(
            MAX_VIEWPORT,
            Math.ceil(Math.max(viewport.height, bounds.height + MARGIN * 2, bounds.y + bounds.height + MARGIN)),
          ),
        };
        if (target.width === viewport.width && target.height === viewport.height) break;

        await page.setViewportSize(target);
        await page.waitForTimeout(500);
        bounds = await measure();
      }

      // Keep the clip inside the window whatever happened above; Playwright
      // rejects one that hangs over the edge.
      const finalViewport = page.viewportSize();
      if (bounds && finalViewport) {
        const x = Math.max(0, Math.floor(bounds.x));
        const y = Math.max(0, Math.floor(bounds.y));
        bounds = {
          x,
          y,
          width: Math.min(Math.ceil(bounds.x + bounds.width), finalViewport.width) - x,
          height: Math.min(Math.ceil(bounds.y + bounds.height), finalViewport.height) - y,
        };
      }

      const screenshot = bounds
        ? await page.screenshot({
            type: format,
            quality: format === 'jpeg' ? 100 : undefined,
            animations: 'disabled',
            clip: bounds,
          })
        : await fieldContainer.screenshot({
            type: format,
            quality: format === 'jpeg' ? 100 : undefined,
            animations: 'disabled',
          });

      return screenshot as Buffer;
    } finally {
      await page.close();
      await context.close();
    }
  }

}

