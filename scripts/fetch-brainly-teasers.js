#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const DATA_FILE = path.resolve(__dirname, '../src/data/brainly-teasers.json');
const SUBJECT_PREFIX = 'Braingle Daily Brain Teaser';

const requiredEnv = [
  'GMAIL_EMAIL',
  'GMAIL_APP_PASSWORD'
];

for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable ${envVar}`);
    process.exit(1);
  }
}

const ensureDataDirectory = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const parseTeaser = (text, subject, envelopeDate) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const categoryLine = lines.find((line) => /^Category:/i.test(line));
  const category = categoryLine ? categoryLine.split(':')[1]?.trim() : undefined;

  const seenClue = lines.findIndex((line) => /^\d+\./.test(line));
  const introLines = seenClue >= 0 ? lines.slice(0, seenClue) : lines;

  const isHeaderLine = (line) =>
    /^Braingle/i.test(line) ||
    /^Category:/i.test(line) ||
    /^The Braingle/i.test(line) ||
    /^Feed,/i.test(line) ||
    /^Get the Answer/i.test(line) ||
    /^Remember,/i.test(line);

  const titleCandidate = introLines.find(
    (line) => !isHeaderLine(line) && !line.startsWith('---')
  );
  const title = titleCandidate || subject || `Braingle Teaser ${envelopeDate}`;

  const tieredClues = [];
  let currentTier = 'Main';

  for (let i = seenClue >= 0 ? seenClue : 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^---/.test(line)) {
      const tier = line.replace(/---/g, '').trim();
      currentTier = tier || currentTier;
      continue;
    }

    if (/^\d+\./.test(line)) {
      const prompt = line.replace(/^\d+\.\s*/, '');
      let pattern;
      const next = lines[i + 1];
      if (next && /^[A-Za-z_\- ]+$/.test(next)) {
        pattern = next;
        i += 1;
      }

      tieredClues.push({
        prompt,
        pattern,
        tier: currentTier
      });
    }
  }

  if (!tieredClues.length) {
    throw new Error('Unable to extract clues from the teaser text');
  }

  let parsedDate = new Date(envelopeDate);
  const match = subject?.match(/for\s+(.+)$/i);
  if (match) {
    const maybeDate = new Date(match[1]);
    if (!Number.isNaN(maybeDate.getTime())) {
      parsedDate = maybeDate;
    }
  }

  const date = parsedDate.toISOString().split('T')[0];
  const descriptionLines = introLines.filter((line) => line !== title && !isHeaderLine(line));
  const description = descriptionLines.join(' ');

  return {
    date,
    title,
    category,
    description: description || undefined,
    source: subject,
    clues: tieredClues
  };
};

const readExistingTeasers = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }

  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse existing teaser data; starting fresh.');
    return [];
  }
};

const writeTeasers = (teasers) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(teasers, null, 2) + '\n', 'utf-8');
};

const main = async () => {
  ensureDataDirectory();

  const config = {
    imap: {
      user: process.env.GMAIL_EMAIL,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  };

  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  const searchCriteria = [
    'ALL',
    ['FROM', 'noreply@braingle.com'],
    ['SUBJECT', SUBJECT_PREFIX]
  ];

  const fetchOptions = {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'],
    struct: true,
    markSeen: false
  };

  const messages = await connection.search(searchCriteria, fetchOptions);

  if (!messages.length) {
    console.log('No Brainly teaser messages found in the inbox.');
    await connection.end();
    return;
  }

  const latest = messages[messages.length - 1];
  const envelope = latest.attributes?.envelope || {};
  const subject = (envelope.subject || '').trim();

  const textPart = latest.parts.find((part) => part.which === 'TEXT');
  const rawBody = textPart?.body || '';
  const parserInput = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
  const parsed = await simpleParser(parserInput);
  const teaserText = parsed.text?.trim() || parsed.html || '';

  if (!teaserText) {
    throw new Error('Teaser message contained no parseable text.');
  }

  const teaser = parseTeaser(teaserText, subject, envelope.date);
  const existing = readExistingTeasers().filter((entry) => entry.date !== teaser.date);
  const merged = [...existing, teaser].sort((a, b) => a.date.localeCompare(b.date));

  writeTeasers(merged);

  console.log(`Saved teaser for ${teaser.title} (${teaser.date}) to ${DATA_FILE}`);

  await connection.end();
};

main().catch((error) => {
  console.error('Failed to fetch Brainly teaser:', error);
  process.exit(1);
});

