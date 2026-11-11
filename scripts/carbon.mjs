#!/usr/bin/env node

/**
 * Carbon CLI - Interactive & Command-line AI Coding Assistant powered by Gemini 4 Carbon
 * Project: hatake-shop
 */

import { execSync } from 'node:child_process';
import https from 'node:https';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID || 'hatake-shop';
const MODEL_ID = process.env.MODEL_ID || 'gemini-4-carbon';
const ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/publishers/google/models/${MODEL_ID}:streamGenerateContent`;

// Cache access token for 30 minutes
let cachedToken = null;
let tokenExpiry = 0;

function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }
  try {
    const token = execSync('gcloud auth application-default print-access-token', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    cachedToken = token;
    tokenExpiry = now + 30 * 60 * 1000;
    return token;
  } catch (err) {
    console.error('\x1b[31mError retrieving GCP access token.\x1b[0m');
    console.error('Make sure you are logged in via: gcloud auth application-default login');
    process.exit(1);
  }
}

async function streamPrompt(contents, systemInstruction = null) {
  const token = getAccessToken();
  const body = { contents };

  if (systemInstruction) {
    body.systemInstruction = {
      role: 'system',
      parts: [{ text: systemInstruction }],
    };
  }

  let response;
  try {
    // Use node:https instead of global fetch: fetch (undici) aborts with
    // UND_ERR_HEADERS_TIMEOUT after 300s, and Carbon can think longer than that
    // on large prompts before sending the first byte.
    response = await new Promise((resolveReq, rejectReq) => {
      const req = https.request(
        `${ENDPOINT}?alt=sse`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        resolveReq
      );
      req.setTimeout(20 * 60 * 1000, () => req.destroy(new Error('No response after 20 minutes')));
      req.on('error', rejectReq);
      req.end(JSON.stringify(body));
    });
  } catch (err) {
    throw new Error(`Network request failed (${err.code || ''} ${err.message})`);
  }

  if (response.statusCode !== 200) {
    let errorText = '';
    for await (const c of response) errorText += c;
    throw new Error(`API returned HTTP ${response.statusCode}: ${errorText}`);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  for await (const chunk of response) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      try {
        const data = JSON.parse(line.slice(5));
        for (const part of data.candidates?.[0]?.content?.parts || []) {
          if (part.text && !part.thought) {
            process.stdout.write(part.text);
            fullText += part.text;
          }
        }
      } catch (_) {
        /* ignore partial/keepalive lines */
      }
    }
  }
  process.stdout.write('\n');
  return fullText;
}

const SYSTEM_PROMPT = `You are Carbon, an expert programming assistant specialized in modern web development, Node.js, WebSockets, HTML5 Canvas/Three.js, pixel art MMORPG game architectures, and clean software engineering. 
Provide concise, production-ready code with explanations when asked. Be direct and avoid unnecessary fluff.`;

async function main() {
  const args = process.argv.slice(2);

  // Check if piped stdin exists
  let pipedInput = '';
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    pipedInput = Buffer.concat(chunks).toString('utf-8');
  }

  // Check for file flags: -f or --file
  let attachedFile = null;
  let fileContent = '';
  const filteredArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--file') {
      attachedFile = args[i + 1];
      i++;
    } else {
      filteredArgs.push(args[i]);
    }
  }

  if (attachedFile) {
    const fullPath = resolve(process.cwd(), attachedFile);
    if (!existsSync(fullPath)) {
      console.error(`\x1b[31mFile not found: ${attachedFile}\x1b[0m`);
      process.exit(1);
    }
    fileContent = readFileSync(fullPath, 'utf-8');
  }

  const promptText = filteredArgs.join(' ').trim();

  // If arguments or piped input provided -> Single-shot mode
  if (promptText || pipedInput || fileContent) {
    let combined = '';
    if (fileContent) {
      combined += `--- BEGIN FILE: ${attachedFile} ---\n${fileContent}\n--- END FILE ---\n\n`;
    }
    if (pipedInput) {
      combined += `--- STDIN INPUT ---\n${pipedInput}\n--- END STDIN ---\n\n`;
    }
    combined += promptText || 'Please inspect the provided code/input.';

    try {
      process.stderr.write('\x1b[2m⏳ Carbon is thinking (large prompts can take several minutes)...\x1b[0m\n');
      await streamPrompt(
        [{ role: 'user', parts: [{ text: combined }] }],
        SYSTEM_PROMPT
      );
    } catch (e) {
      console.error('\x1b[31mError:\x1b[0m', e.message);
      process.exit(1);
    }
    return;
  }

  // Interactive REPL Mode
  console.log('\x1b[1;36m=======================================================');
  console.log('  ⚡ Gemini 4 Carbon CLI Programming Assistant');
  console.log(`  Target Project: ${PROJECT_ID} | Model: ${MODEL_ID}`);
  console.log('=======================================================\x1b[0m');
  console.log('Commands:');
  console.log('  \x1b[33m.file <path>\x1b[0m   Load a file into the conversation context');
  console.log('  \x1b[33m.clear\x1b[0m         Reset conversation history');
  console.log('  \x1b[33m.exit\x1b[0m          Exit CLI\n');

  const history = [];
  const rl = readline.createInterface({ input, output });

  while (true) {
    const line = await rl.question('\x1b[1;32mcarbon>\x1b[0m ');
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed === '.exit' || trimmed === 'exit' || trimmed === 'quit') {
      console.log('Goodbye!');
      rl.close();
      break;
    }

    if (trimmed === '.clear') {
      history.length = 0;
      console.log('\x1b[33mConversation history cleared.\x1b[0m\n');
      continue;
    }

    if (trimmed.startsWith('.file ')) {
      const filePath = trimmed.slice(6).trim();
      const resolved = resolve(process.cwd(), filePath);
      if (!existsSync(resolved)) {
        console.log(`\x1b[31mFile not found: ${filePath}\x1b[0m\n`);
        continue;
      }
      const content = readFileSync(resolved, 'utf-8');
      history.push({
        role: 'user',
        parts: [{ text: `Here is the file \`${filePath}\`:\n\`\`\`\n${content}\n\`\`\`` }]
      });
      history.push({
        role: 'model',
        parts: [{ text: `I have loaded \`${filePath}\` into context.` }]
      });
      console.log(`\x1b[32mLoaded ${filePath} (${content.split('\n').length} lines) into context.\x1b[0m\n`);
      continue;
    }

    history.push({
      role: 'user',
      parts: [{ text: trimmed }]
    });

    try {
      process.stdout.write('\x1b[1;34m[Carbon]\x1b[0m\n');
      const answer = await streamPrompt(history, SYSTEM_PROMPT);
      history.push({
        role: 'model',
        parts: [{ text: answer }]
      });
      console.log('');
    } catch (err) {
      console.error('\x1b[31mError:\x1b[0m', err.message);
    }
  }
}

main();
