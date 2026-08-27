import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

function parseHtml(relativePath: string) {
  return new DOMParser().parseFromString(read(relativePath), 'text/html');
}

describe('static discovery and citation surface', () => {
  it('provides substantive semantic content before JavaScript runs', () => {
    const document = parseHtml('index.html');
    const title = document.querySelector('title')?.textContent ?? '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const rootText = document.querySelector('#root')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    expect(title.length).toBeGreaterThanOrEqual(40);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(140);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(rootText.length).toBeGreaterThan(500);
    expect(document.querySelectorAll('#root h1')).toHaveLength(1);
    expect(document.querySelectorAll('#root h2').length).toBeGreaterThanOrEqual(2);
    expect(document.querySelectorAll('#root h3').length).toBeGreaterThanOrEqual(2);
  });

  it('describes the brand, website, application, and page in JSON-LD', () => {
    const document = parseHtml('index.html');
    const rawJson = document.querySelector('script[type="application/ld+json"]')?.textContent;
    expect(rawJson).toBeTruthy();

    const schema = JSON.parse(rawJson ?? '{}') as { '@graph'?: Array<Record<string, unknown>> };
    const types = schema['@graph']?.map((entry) => entry['@type']);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'SoftwareApplication', 'WebPage']));
  });

  it('publishes crawler discovery files and trust pages', () => {
    const robots = read('public/robots.txt');
    expect(robots).toContain('Sitemap: https://tsudoi.yahaha.net/sitemap.xml');

    const sitemap = new DOMParser().parseFromString(read('public/sitemap.xml'), 'application/xml');
    expect(sitemap.querySelector('parsererror')).toBeNull();
    expect(sitemap.querySelectorAll('url')).toHaveLength(4);

    const llms = read('public/llms.txt');
    expect(llms).toContain('## Core capabilities');
    expect(llms).toContain('## Privacy boundary');

    for (const page of ['about.html', 'privacy.html', 'terms.html']) {
      const document = parseHtml(`public/${page}`);
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(canonical).toMatch(/^https:\/\/tsudoi\.yahaha\.net\/(about|privacy|terms)$/);
      expect(document.querySelector('a[href="https://github.com/dofy/invite-maker/issues"]')).not.toBeNull();
      expect(document.querySelector('script[src="/legal.js"]')).not.toBeNull();
      expect(document.querySelector('meta[name="theme-color"]')).not.toBeNull();
      expect(document.querySelectorAll('#legal-language option')).toHaveLength(8);
      expect(document.querySelectorAll('#legal-theme option')).toHaveLength(3);
    }
  });

  it('shares the editor language and theme preferences across trust pages', () => {
    const legalRuntime = read('public/legal.js');
    expect(legalRuntime).toContain("var LANGUAGE_KEY = 'invite-maker-language'");
    expect(legalRuntime).toContain("var THEME_KEY = 'invite-maker-theme'");

    for (const language of ['zh-CN', 'zh-TW', 'en', 'de', 'ja', 'ko', 'es', 'fr']) {
      expect(legalRuntime).toMatch(new RegExp(`['"]?${language}['"]?:`));
    }

    expect(legalRuntime).toContain("window.addEventListener('storage'");
    expect(read('public/legal.css')).toContain(':root[data-mantine-color-scheme="light"]');
  });
});
