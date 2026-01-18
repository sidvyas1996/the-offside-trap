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

  static async captureField(state: FieldState, format: 'png' | 'jpeg'): Promise<Buffer> {
    const browser = await this.getBrowser();
    
    // Create a new context with device scale factor for high-DPI rendering
    const context = await browser.newContext({
      viewport: { width: 3840, height: 2160 },
      deviceScaleFactor: 2, // 2x for sharper rendering (effectively 7680x4320)
    });
    const page = await context.newPage();

    try {
      // Get frontend URL from environment or use default
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const exportUrl = `${frontendUrl}/export-preview`;

      // Viewport is already set via context (3840x2160 with 2x scale = 7680x4320 effective)

      // Add CSS to improve rendering quality
      await page.addInitScript(() => {
        // @ts-ignore - document is available in browser context
        const style = document.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            image-rendering: -webkit-optimize-contrast !important;
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

      // Take screenshot of the field container at 4K quality (3840x2160)
      // Using maximum quality settings for crisp, high-resolution output
      const screenshot = await fieldContainer.screenshot({
        type: format,
        quality: format === 'jpeg' ? 100 : undefined, // Maximum quality for JPEG (lossless)
        animations: 'disabled',
        // Use CSS media features to ensure high-DPI rendering
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
      await context.close();
    }
  }

}

