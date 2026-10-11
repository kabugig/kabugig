#!/usr/bin/env node
/* Rewrites the Content-Security-Policy <meta> in each page so that inline
 * <script> and <style> blocks are allowed by SHA-256 hash instead of
 * 'unsafe-inline'. Run after editing any inline script or style:
 *
 *   node tools/csp.js
 *
 * Hashes are computed on LF-normalised text, which is what GitHub Pages serves.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'card/index.html', 'qr/index.html', 'dashboard/index.html'];

const hash = (text) => "'sha256-" + crypto.createHash('sha256').update(text, 'utf8').digest('base64') + "'";

for (const rel of pages) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => hash(m[1]));
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => hash(m[1]));

  const policy = [
    "default-src 'self'",
    "script-src 'self' " + scripts.join(' '),
    "style-src 'self' " + styles.join(' '),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ');

  const next = html.replace(
    /<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
    '<meta http-equiv="Content-Security-Policy" content="' + policy + '">'
  );
  if (next === html && !html.includes(policy)) throw new Error('No CSP meta found in ' + rel);
  fs.writeFileSync(file, next);
  console.log(rel.padEnd(22), scripts.length + ' script(s), ' + styles.length + ' style(s)');
}
