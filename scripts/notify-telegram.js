#!/usr/bin/env node
/**
 * notify-telegram.js
 * data/daily_news.json 요약을 텔레그램으로 발송 (서버측, PC/권한 무관).
 * news-monitor.yml에서 수집 직후 실행됨.
 * env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (GitHub Secrets)
 */
const fs = require('fs');
const https = require('https');

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const CHAT = (process.env.TELEGRAM_CHAT_ID || '').trim();
if (!TOKEN || !CHAT) { console.log('⚠️ TELEGRAM_BOT_TOKEN/CHAT_ID 미설정 — 발송 스킵'); process.exit(0); }

let d = {};
try { d = JSON.parse(fs.readFileSync('data/daily_news.json', 'utf8')); }
catch (e) { console.log('daily_news.json 읽기 실패:', e.message); }

const items = Array.isArray(d.items) ? d.items : [];
const date = d.date || new Date().toISOString().slice(0, 10);

let msg;
if (!items.length) {
  msg = `🚗 EV 신차 브리핑 ${date}\n오늘 신규 출시 뉴스 없음.`;
} else {
  const stat = Object.entries(d.oemStats || {}).map(([k, v]) => `${k} ${v}`).join(' · ');
  const lines = items.slice(0, 12).map(it => {
    const t = String(it.title || '').replace(/\s*[-–]\s*[^-–]*$/, '').trim().slice(0, 90);
    return `• [${it.oem || it.market || ''}] ${t}`;
  });
  msg = `🚗 EV 신차 브리핑 ${date} — 총 ${items.length}건\n${stat}\n\n${lines.join('\n')}\n\n반영하려면 Claude Code에서 "반영해"라고 지시해주세요.`;
}

const payload = JSON.stringify({ chat_id: CHAT, text: msg.slice(0, 4000), disable_web_page_preview: true });
try {
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => console.log('telegram', res.statusCode, b.slice(0, 150))); });
  req.on('error', e => console.log('telegram err', e.message));
  req.write(payload);
  req.end();
} catch (e) { console.log('telegram 예외(무시):', e.message); }
