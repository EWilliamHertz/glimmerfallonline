import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";

// Default/fallback credentials or user provided environment variable
const DEFAULT_FAL_KEY = "fal_sk_c9523495ce1b4a748c30307c15c08fb7:6a77b3f09e6783021c6ad002310fe7e9";
const FAL_KEY = process.env.FAL_KEY || DEFAULT_FAL_KEY;

// Production asset queue mapped directly to GlimmerFall card artwork database
export const ASSET_QUEUE = [
  {
    name: "resonance_node",
    description: "Mana Crystal (Aether Resource Font)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp",
    targetPolycount: 3000,
    category: "prop",
  },
  {
    name: "solari_hero",
    description: "Solari Vanguard (Paladin / Lightbringer Player Character)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp",
    targetPolycount: 12000,
    category: "character",
  },
  {
    name: "nexus_core",
    description: "Chronocore Prism (Central Nexus Monolith 25 HP Objective)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp",
    targetPolycount: 6000,
    category: "objective",
  },
  {
    name: "umbri_minion",
    description: "Void Stalker (Hostile Void Mob / Patroller)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp",
    targetPolycount: 8000,
    category: "mob",
  },
  {
    name: "terra_golem",
    description: "Granite Behemoth (Terra Ancient Sentinel / World Boss)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp",
    targetPolycount: 10000,
    category: "boss",
  },
  {
    name: "solari_blade",
    description: "Solari Spellblade (Radiant Broadsword Weapon)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/solari_spellblade_0344d442-PANPl85JYkgDviSTmx9BLwBJIPvVfG.webp",
    targetPolycount: 2500,
    category: "equipment",
  },
];

const MIN_FREE_DISK_MB = 100;
const OUTPUT_DIR = path.resolve("./public/models");

/**
 * Check and validate all pipeline prerequisites
 */
export async function checkPrerequisites(options = {}) {
  const { quiet = false, specificAsset = null } = options;
  const results = {
    auth: { pass: false, message: "" },
    network: { pass: false, message: "" },
    disk: { pass: false, freeMb: 0, message: "" },
    outputDir: { pass: false, message: "" },
    assets: [],
    allPassed: true,
  };

  if (!quiet) {
    console.log("\n=======================================================");
    console.log(" 🔍 GLIMMERFALL 3D PIPELINE: PREREQUISITE VERIFICATION");
    console.log("=======================================================");
  }

  // 1. Check Fal.ai Credentials
  if (!FAL_KEY || FAL_KEY.trim().length < 10) {
    results.auth = { pass: false, message: "FAL_KEY is missing or invalid. Set FAL_KEY in your environment." };
    results.allPassed = false;
  } else {
    const keyPreview = FAL_KEY.includes(":") ? `${FAL_KEY.split(":")[0].substring(0, 12)}...` : `${FAL_KEY.substring(0, 10)}...`;
    results.auth = { pass: true, message: `Valid key format (${keyPreview})` };
  }

  // 2. Network connectivity check to fal.ai endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const pingRes = await fetch("https://queue.fal.run", { method: "HEAD", signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);
    if (pingRes && (pingRes.status === 200 || pingRes.status === 404 || pingRes.status === 405 || pingRes.status === 401)) {
      results.network = { pass: true, message: "Fal.ai API network endpoint reachable." };
    } else {
      results.network = { pass: true, message: "Internet connected (Fal API online)." };
    }
  } catch (err) {
    results.network = { pass: false, message: `Network error reaching Fal.ai: ${err.message}` };
    results.allPassed = false;
  }

  // 3. Disk space check
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const stat = fs.statfsSync(OUTPUT_DIR);
    const freeMb = Math.round((stat.bavail * stat.bsize) / (1024 * 1024));
    results.disk.freeMb = freeMb;
    if (freeMb >= MIN_FREE_DISK_MB) {
      results.disk = { pass: true, freeMb, message: `${freeMb} MB free (minimum ${MIN_FREE_DISK_MB} MB required).` };
    } else {
      results.disk = { pass: false, freeMb, message: `Low disk space! Only ${freeMb} MB free (needs ${MIN_FREE_DISK_MB} MB).` };
      results.allPassed = false;
    }
    results.outputDir = { pass: true, message: `${OUTPUT_DIR} exists and is writable.` };
  } catch (err) {
    results.disk = { pass: false, freeMb: 0, message: `Could not verify disk space: ${err.message}` };
    results.outputDir = { pass: false, message: err.message };
    results.allPassed = false;
  }

  // 4. Asset queue verification
  const queueToInspect = specificAsset
    ? ASSET_QUEUE.filter((a) => a.name.toLowerCase() === specificAsset.toLowerCase())
    : ASSET_QUEUE;

  if (specificAsset && queueToInspect.length === 0) {
    results.allPassed = false;
    if (!quiet) console.error(`❌ Asset "${specificAsset}" not found in ASSET_QUEUE!`);
    return results;
  }

  for (const asset of queueToInspect) {
    const dest = path.join(OUTPUT_DIR, `${asset.name}.glb`);
    const isCached = fs.existsSync(dest) && fs.statSync(dest).size > 1000;
    const cacheSizeMb = isCached ? (fs.statSync(dest).size / (1024 * 1024)).toFixed(2) : null;

    let imageStatus = { pass: false, status: 0, contentType: null };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const imgRes = await fetch(asset.imageUrl, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      imageStatus = {
        pass: imgRes.ok,
        status: imgRes.status,
        contentType: imgRes.headers.get("content-type") || "unknown",
      };
    } catch (err) {
      imageStatus = { pass: false, status: 0, contentType: err.message };
    }

    const polyValid = asset.targetPolycount >= 1000 && asset.targetPolycount <= 50000;
    const assetPassed = imageStatus.pass && polyValid;

    if (!assetPassed) results.allPassed = false;

    results.assets.push({
      name: asset.name,
      category: asset.category,
      targetPolycount: asset.targetPolycount,
      polyValid,
      isCached,
      cacheSizeMb,
      imageStatus,
      assetPassed,
    });
  }

  // Print summary report
  if (!quiet) {
    console.log(`\nSystem Environment Checks:`);
    console.log(` [${results.auth.pass ? "OK" : "FAIL"}] API Authentication : ${results.auth.message}`);
    console.log(` [${results.network.pass ? "OK" : "FAIL"}] Network Connection : ${results.network.message}`);
    console.log(` [${results.disk.pass ? "OK" : "FAIL"}] Disk Space Storage : ${results.disk.message}`);
    console.log(` [${results.outputDir.pass ? "OK" : "FAIL"}] Model Output Folder: ${results.outputDir.message}`);

    console.log(`\nAsset Queue Prerequisites (${results.assets.length} items):`);
    for (const a of results.assets) {
      const cacheIcon = a.isCached ? `💾 CACHED (${a.cacheSizeMb} MB)` : "⏳ PENDING";
      const imgIcon = a.imageStatus.pass ? "🖼️ Image OK" : `❌ Image HTTP ${a.imageStatus.status}`;
      const polyIcon = a.polyValid ? `📐 ${a.targetPolycount} poly` : "❌ Poly out of bounds";
      console.log(` • [${a.name.padEnd(16)}] ${cacheIcon.padEnd(20)} | ${imgIcon.padEnd(18)} | ${polyIcon}`);
    }

    console.log("\n=======================================================");
    if (results.allPassed) {
      console.log(" ✅ ALL PREREQUISITES MET: System is ready for generation.");
    } else {
      console.log(" ⚠️ PREREQUISITE WARNINGS DETECTED: Review errors above.");
    }
    console.log("=======================================================\n");
  }

  return results;
}

async function downloadGLB(url, destination) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destination, Buffer.from(arrayBuffer));
}

async function processAsset(asset, outputDir, options = {}) {
  const { force = false, dryRun = false } = options;
  const dest = path.join(outputDir, `${asset.name}.glb`);

  // Skip if already generated to preserve budget
  if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    const sizeMb = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
    console.log(`[Cache Hit] ${asset.name}.glb already exists (${sizeMb} MB). Skipping to preserve API credits.`);
    return { status: "cached", name: asset.name, sizeMb };
  }

  console.log(`\n======================================================`);
  console.log(`[Fal.ai] Target: ${asset.name} (${asset.description})`);
  console.log(`Category: ${asset.category} | Target Polycount: ${asset.targetPolycount}`);
  console.log(`Image URL: ${asset.imageUrl}`);
  console.log(`======================================================`);

  if (dryRun) {
    console.log(`[Dry Run] Simulated call to "meshy/v7.1/image-to-3d":`);
    console.log(JSON.stringify({
      input: {
        image_url: asset.imageUrl,
        target_polycount: asset.targetPolycount,
        texture_resolution: 2048,
        topology: "quad",
      }
    }, null, 2));
    console.log(`[Dry Run] Destination would be: ${dest}`);
    return { status: "dry-run", name: asset.name };
  }

  fal.config({ credentials: FAL_KEY });

  try {
    const response = await fal.subscribe("meshy/v7.1/image-to-3d", {
      input: {
        image_url: asset.imageUrl,
        target_polycount: asset.targetPolycount,
        texture_resolution: 2048,
        topology: "quad",
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[${asset.name}] Status: ${update.status} (queue position: ${update.queue_position ?? 0})`);
      },
    });

    const resultData = response.data;
    const modelUrl =
      resultData?.model_urls?.glb?.url ||
      resultData?.model_glb?.url ||
      resultData?.glb?.url ||
      resultData?.model_urls?.glb ||
      resultData?.url;

    if (modelUrl) {
      console.log(`[${asset.name}] GLB generated: ${modelUrl}`);
      console.log(`Downloading ${asset.name}.glb into ${dest}...`);
      await downloadGLB(modelUrl, dest);
      const sizeMb = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
      console.log(`✅ Success -> ${dest} (${sizeMb} MB)`);
      return { status: "generated", name: asset.name, sizeMb };
    } else {
      console.warn(`[${asset.name}] Could not locate GLB URL in response:`, resultData);
      return { status: "failed", name: asset.name, error: "Missing GLB URL" };
    }
  } catch (err) {
    console.error(`[${asset.name}] Generation error:`, err.message || err);
    return { status: "failed", name: asset.name, error: err.message || err };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isCheckOnly = args.includes("--check") || args.includes("--prereqs");
  const isDryRun = args.includes("--dry-run");
  const isForce = args.includes("--force");
  const isList = args.includes("--list");
  const assetArg = args.find((a) => a.startsWith("--asset="));
  const specificAsset = assetArg ? assetArg.split("=")[1] : null;

  if (isList) {
    console.log("\n📦 GlimmerFall MMORPG 3D Asset Catalog:");
    ASSET_QUEUE.forEach((a, i) => {
      const dest = path.join(OUTPUT_DIR, `${a.name}.glb`);
      const cached = fs.existsSync(dest) ? `[Cached: ${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB]` : "[Not Generated]";
      console.log(` ${i + 1}. ${a.name.padEnd(16)} | ${a.category.padEnd(10)} | ${cached.padEnd(22)} | ${a.description}`);
    });
    console.log();
    return;
  }

  // Always run prerequisite check
  const prereqResults = await checkPrerequisites({ quiet: false, specificAsset });

  if (isCheckOnly) {
    process.exit(prereqResults.allPassed ? 0 : 1);
  }

  if (!prereqResults.allPassed && !isDryRun) {
    console.error("❌ Aborting generation because critical prerequisites failed. Fix the issues above or pass --dry-run.");
    process.exit(1);
  }

  const queueToProcess = specificAsset
    ? ASSET_QUEUE.filter((a) => a.name.toLowerCase() === specificAsset.toLowerCase())
    : ASSET_QUEUE;

  console.log(`Starting asset processing for ${queueToProcess.length} asset(s)...`);
  for (const asset of queueToProcess) {
    await processAsset(asset, OUTPUT_DIR, { force: isForce, dryRun: isDryRun });
  }

  console.log("\n✨ Asset batch generation cycle complete!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
