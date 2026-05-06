import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageValidatorService {
  private readonly timeoutMs = parseInt(
    process.env.HEAD_CHECK_TIMEOUT_MS ?? '5000',
    10,
  );

  filterValidUrls(urls: string[]): string[] {
    return urls.filter((url) => {
      try {
        const { protocol } = new URL(url);
        return protocol === 'http:' || protocol === 'https:';
      } catch {
        return false;
      }
    });
  }

  async validateImages(urls: string[]): Promise<string[]> {
    const formatValid = this.filterValidUrls(urls);
    const checks = await Promise.all(formatValid.map((url) => this.checkUrl(url)));
    return formatValid.filter((_, i) => checks[i]);
  }

  private async checkUrl(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      const contentType = res.headers.get('content-type') ?? '';
      return res.ok && contentType.startsWith('image/');
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
