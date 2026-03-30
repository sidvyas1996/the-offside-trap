import path from 'path';
import fs from 'fs';
import os from 'os';
import { chromium, Browser, Page } from 'playwright';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import type { AnimationData, Keyframe, FieldSettings, Player } from '@the-offside-trap/shared';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface BaseFieldState {
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
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  try {
    const [rA, gA, bA] = parse(hexA);
    const [rB, gB, bB] = parse(hexB);
    return `#${toHex(lerp(rA, rB, t))}${toHex(lerp(gA, gB, t))}${toHex(lerp(bA, bB, t))}`;
  } catch {
    return hexA;
  }
}

function getInterpolatedFrame(
  timeMs: number,
  keyframes: Keyframe[]
): { players: Player[]; fieldSettings: FieldSettings } | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);

  if (timeMs <= sorted[0].timeMs) {
    return { players: sorted[0].players as Player[], fieldSettings: sorted[0].fieldSettings };
  }
  if (timeMs >= sorted[sorted.length - 1].timeMs) {
    const last = sorted[sorted.length - 1];
    return { players: last.players as Player[], fieldSettings: last.fieldSettings };
  }

  let before = sorted[0];
  let after = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].timeMs <= timeMs && sorted[i + 1].timeMs >= timeMs) {
      before = sorted[i];
      after = sorted[i + 1];
      break;
    }
  }

  const span = after.timeMs - before.timeMs;
  const t = span === 0 ? 0 : (timeMs - before.timeMs) / span;

  const playerMap = new Map(after.players.map((p: Player) => [p.id, p]));
  const players = before.players.map((p: Player) => {
    const target = playerMap.get(p.id);
    if (!target) return p;
    return { ...p, x: lerp(p.x, target.x, t), y: lerp(p.y, target.y, t) };
  }) as Player[];

  const fs1 = before.fieldSettings;
  const fs2 = after.fieldSettings;
  const fieldSettings: FieldSettings = {
    fieldColor: lerpHex(fs1.fieldColor, fs2.fieldColor, t),
    playerColor: lerpHex(fs1.playerColor, fs2.playerColor, t),
    showPlayerLabels: t < 0.5 ? fs1.showPlayerLabels : fs2.showPlayerLabels,
    markerType: t < 0.5 ? fs1.markerType : fs2.markerType,
  };

  return { players, fieldSettings };
}

export class VideoExportService {
  private static browser: Browser | null = null;

  static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  static async exportAnimation(
    animation: AnimationData,
    baseFieldState: BaseFieldState
  ): Promise<Buffer> {
    const jobId = `video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempDir = path.join(os.tmpdir(), jobId);
    fs.mkdirSync(tempDir, { recursive: true });

    const browser = await this.getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const previewUrl = `${frontendUrl}/tactics-export-preview?fast=1`;

      // Navigate to preview page once
      await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Inject initial state
      await page.evaluate((state) => {
        // @ts-ignore - browser context
        (window as any).__EXPORT_STATE__ = state;
        // @ts-ignore - browser context
        window.dispatchEvent(new CustomEvent('exportStateReady', { detail: state }));
      }, {
        fieldColor: baseFieldState.fieldColor,
        players: baseFieldState.players,
        showPlayerLabels: baseFieldState.showPlayerLabels,
        markerType: baseFieldState.markerType,
      });

      // Wait for page ready (fast mode skips 1500ms delay)
      await page.waitForFunction(
        // @ts-ignore - browser context
        () => (window as any).__EXPORT_READY__ === true,
        { timeout: 15000 }
      );

      // Render each frame
      const frameCount = Math.ceil((animation.durationMs / 1000) * animation.fps);
      console.log(`Rendering ${frameCount} frames at ${animation.fps}fps...`);

      for (let i = 0; i < frameCount; i++) {
        const timeMs = (i / animation.fps) * 1000;
        const frame = getInterpolatedFrame(timeMs, animation.keyframes);
        if (!frame) continue;

        // Reset ready flag
        // @ts-ignore - browser context
        await page.evaluate(() => { (window as any).__FRAME_READY__ = false; });

        // Push frame update
        await page.evaluate(({ players, fieldSettings }) => {
          // @ts-ignore - browser context
          (window as any).__FRAME_UPDATE__ = { players, fieldSettings };
          // @ts-ignore - browser context
          window.dispatchEvent(new CustomEvent('frameUpdate'));
        }, { players: frame.players, fieldSettings: frame.fieldSettings });

        // Wait for render
        await page.waitForFunction(
          // @ts-ignore - browser context
          () => (window as any).__FRAME_READY__ === true,
          { timeout: 5000 }
        );

        // Screenshot the frame
        const fieldContainer = page.locator('#export-field-container');
        const framePath = path.join(tempDir, `frame-${String(i).padStart(4, '0')}.png`);
        const screenshot = await fieldContainer.screenshot({ type: 'png', animations: 'disabled' });
        fs.writeFileSync(framePath, screenshot);
      }

      // Assemble MP4 with ffmpeg
      const outputPath = path.join(tempDir, 'output.mp4');
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(path.join(tempDir, 'frame-%04d.png'))
          .inputOptions([`-framerate ${animation.fps}`])
          .videoCodec('libx264')
          .outputOptions([
            '-preset fast',
            '-crf 23',
            '-pix_fmt yuv420p',
            '-movflags +faststart',
          ])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      const mp4Buffer = fs.readFileSync(outputPath);
      return mp4Buffer;
    } finally {
      await page.close();
      await context.close();
      // Cleanup temp files
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
  }
}
