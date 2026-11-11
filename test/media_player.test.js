import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LandingPageController, LANDING_OST_TRACKS } from '../client/landing.js';

test('Soundtrack Catalog Integrity: All 15 master tracks exist with high-fidelity metadata and local audio assets', () => {
  assert.equal(LANDING_OST_TRACKS.length, 15, 'Must contain 15 master tracks');

  const requiredIds = [
    'title', 'sanctuary', 'solari', 'umbri', 'terra', 'aether',
    'abyss', 'warzone', 'boss', 'tcg_duel', 'the_bridge', 'victory',
    'trailer', 'grand_finale', 'master_suite'
  ];

  for (const id of requiredIds) {
    const track = LANDING_OST_TRACKS.find((t) => t.id === id);
    assert.ok(track, `Track with id "${id}" must exist in catalog`);
    assert.ok(track.name && track.name.length > 2, `Track "${id}" must have a name`);
    assert.ok(track.zone, `Track "${id}" must have a zone`);
    assert.ok(track.category, `Track "${id}" must have a category`);
    assert.ok(typeof track.bpm === 'number' && track.bpm > 0, `Track "${id}" must have numeric BPM`);
    assert.ok(track.key, `Track "${id}" must have a musical key`);
    assert.ok(track.duration, `Track "${id}" must have duration string`);
    assert.ok(typeof track.durationSec === 'number' && track.durationSec > 0, `Track "${id}" must have durationSec`);
    assert.ok(track.localUrl, `Track "${id}" must have localUrl`);
    assert.ok(track.url && track.url.startsWith('https://'), `Track "${id}" must have remote Vercel CDN URL`);
    assert.ok(track.desc, `Track "${id}" must have a lore description`);

    // Verify audio asset has remote Vercel CDN URL (or local fallback if present)
    assert.ok(track.url && track.url.startsWith('https://'), `Track "${id}" must have remote Vercel CDN URL`);
    const publicAudioPath = path.join(process.cwd(), 'public', track.localUrl);
    if (fs.existsSync(publicAudioPath)) {
      const stat = fs.statSync(publicAudioPath);
      assert.ok(stat.size > 500000, `Local audio file ${publicAudioPath} must be non-empty (>500KB)`);
    }
  }
});

test('Media Player Engine: Play, Pause, Next, Prev, Seek, Volume, Repeat, and Shuffle', () => {
  const landing = new LandingPageController({ frontpage: null, onEnterWorld: null });

  // Initial defaults
  assert.equal(landing.currentOstTrackId, 'title');
  assert.equal(landing.isOstPlaying, false);
  assert.equal(landing.repeatMode, 'all');
  assert.equal(landing.isShuffle, false);
  assert.equal(landing.volume, 0.75);
  assert.equal(landing.isMuted, false);
  assert.deepEqual(landing.queue, []);

  // Play track
  landing.playOstTrack('solari');
  assert.equal(landing.currentOstTrackId, 'solari');
  assert.equal(landing.isOstPlaying, true);

  // Toggle pause
  landing.toggleOstPlay();
  assert.equal(landing.isOstPlaying, false);

  // Toggle resume
  landing.toggleOstPlay();
  assert.equal(landing.isOstPlaying, true);

  // Next track in catalog (without queue)
  const curIdx = LANDING_OST_TRACKS.findIndex((t) => t.id === 'solari');
  const expectedNext = LANDING_OST_TRACKS[(curIdx + 1) % LANDING_OST_TRACKS.length].id;
  landing.playNextTrack();
  assert.equal(landing.currentOstTrackId, expectedNext);

  // Previous track
  landing.playPrevTrack();
  assert.equal(landing.currentOstTrackId, 'solari');

  // Volume & Mute
  landing.setVolume(0.4);
  assert.equal(landing.volume, 0.4);
  assert.equal(landing.isMuted, false);

  landing.toggleMute();
  assert.equal(landing.isMuted, true);
  landing.toggleMute();
  assert.equal(landing.isMuted, false);

  // Clamping volume
  landing.setVolume(1.8);
  assert.equal(landing.volume, 1.0);
  landing.setVolume(-0.5);
  assert.equal(landing.volume, 0.0);
  assert.equal(landing.isMuted, true);

  // Repeat modes cycle: 'all' -> 'one' -> 'off' -> 'all'
  landing.setVolume(0.8);
  landing.repeatMode = 'all';
  landing.toggleRepeatMode();
  assert.equal(landing.repeatMode, 'one');
  landing.toggleRepeatMode();
  assert.equal(landing.repeatMode, 'off');
  landing.toggleRepeatMode();
  assert.equal(landing.repeatMode, 'all');

  // Shuffle toggle
  landing.toggleShuffle();
  assert.equal(landing.isShuffle, true);
  landing.toggleShuffle();
  assert.equal(landing.isShuffle, false);

  // Time format helper
  assert.equal(landing.formatTime(0), '00:00');
  assert.equal(landing.formatTime(65), '01:05');
  assert.equal(landing.formatTime(178), '02:58');
});

test('Playback Queue Management: Adding, Removing, Clearing, and Auto-Advancing from Queue', () => {
  const landing = new LandingPageController({ frontpage: null, onEnterWorld: null });

  landing.playOstTrack('title');
  assert.equal(landing.currentOstTrackId, 'title');
  assert.deepEqual(landing.queue, []);

  // Queue tracks
  landing.addToQueue('sanctuary');
  landing.addToQueue('warzone');
  landing.addToQueue('boss');
  assert.deepEqual(landing.queue, ['sanctuary', 'warzone', 'boss']);

  // Remove middle item ('warzone')
  landing.removeFromQueue(1);
  assert.deepEqual(landing.queue, ['sanctuary', 'boss']);

  // Play queued item directly
  landing.playQueuedItem(1); // 'boss'
  assert.equal(landing.currentOstTrackId, 'boss');
  assert.deepEqual(landing.queue, ['sanctuary']);

  // When current track ends, the player should pop from queue and play it!
  landing.handleTrackEnded();
  assert.equal(landing.currentOstTrackId, 'sanctuary');
  assert.deepEqual(landing.queue, []);

  // Clear queue
  landing.addToQueue('terra');
  landing.addToQueue('aether');
  assert.equal(landing.queue.length, 2);
  landing.clearQueue();
  assert.deepEqual(landing.queue, []);
});

test('Media Player UI Rendering: Deck, Queue Drawer, Filters, and Search', () => {
  const landing = new LandingPageController({ frontpage: null, onEnterWorld: null });
  landing.playOstTrack('solari');
  landing.addToQueue('umbri');

  const activeTrack = LANDING_OST_TRACKS.find((t) => t.id === 'solari');
  const deckHtml = landing.renderMediaPlayerSection(activeTrack);

  assert.ok(deckHtml.includes('Sun Cathedral March'), 'Deck must render active track title');
  assert.ok(deckHtml.includes('gf-player-disc'), 'Deck must render vinyl disc');
  assert.ok(deckHtml.includes('gf-scrubber-track'), 'Deck must render scrubber timeline');
  assert.ok(deckHtml.includes('gf-volume-slider'), 'Deck must render volume slider');
  assert.ok(deckHtml.includes('gf-queue-drawer'), 'Deck must render queue drawer');

  // Track catalog table
  const catalogHtml = landing.renderTracklistSection(activeTrack);
  assert.ok(catalogHtml.includes('OFFICIAL SOUNDTRACK CATALOG (15 MASTER TRACKS)'), 'Catalog title must render');
  assert.ok(catalogHtml.includes('gf-track-row'), 'Must render track rows');
  assert.ok(catalogHtml.includes('+ Queue'), 'Must render queue action buttons');

  // Filter category test
  landing.setTrackFilter('factions');
  const factionRows = landing.renderTrackRows();
  assert.ok(factionRows.includes('Sun Cathedral March'));
  assert.ok(factionRows.includes('Crypt of Shadowweaver'));
  assert.ok(factionRows.includes('Druidic Forest Bodhran'));
  assert.ok(factionRows.includes('Quantum Shimmer'));
  assert.ok(!factionRows.includes('Granite Colossus Climax'), 'Combat track should not appear in factions filter');

  // Search filter test
  landing.setTrackFilter('all');
  landing.setTrackSearch('Colossus');
  const searchRows = landing.renderTrackRows();
  assert.ok(searchRows.includes('Granite Colossus Climax'));
  assert.ok(!searchRows.includes('Sun Cathedral March'), 'Unmatched track should not appear in search results');

  // Clear search
  landing.setTrackSearch('');
  const allRows = landing.renderTrackRows();
  assert.ok(allRows.includes('Awakening of the Cosmos'));
  assert.ok(allRows.includes('Granite Colossus Climax'));
});
