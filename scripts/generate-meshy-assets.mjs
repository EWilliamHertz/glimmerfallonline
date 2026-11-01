import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";

// Initialize Fal.ai credentials
const FAL_KEY = process.env.FAL_KEY || "fal_sk_c9523495ce1b4a748c30307c15c08fb7:6a77b3f09e6783021c6ad002310fe7e9";
fal.config({ credentials: FAL_KEY });

// Production asset queue mapped directly to GlimmerFall card artwork database
const ASSET_QUEUE = [
  {
    name: "resonance_node",
    description: "Mana Crystal (Aether Resource Font)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp",
    targetPolycount: 3000,
  },
  {
    name: "solari_hero",
    description: "Solari Vanguard (Paladin / Lightbringer Player Character)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp",
    targetPolycount: 12000,
  },
  {
    name: "nexus_core",
    description: "Chronocore Prism (Central Nexus Monolith 25 HP Objective)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp",
    targetPolycount: 6000,
  },
  {
    name: "umbri_minion",
    description: "Void Stalker (Hostile Void Mob / Patroller)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp",
    targetPolycount: 8000,
  },
  {
    name: "terra_golem",
    description: "Granite Behemoth (Terra Ancient Sentinel / World Boss)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp",
    targetPolycount: 10000,
  },
  {
    name: "solari_blade",
    description: "Solari Spellblade (Radiant Broadsword Weapon)",
    imageUrl: "https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/solari_spellblade_0344d442-PANPl85JYkgDviSTmx9BLwBJIPvVfG.webp",
    targetPolycount: 2500,
  },
];

async function downloadGLB(url, destination) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destination, Buffer.from(arrayBuffer));
}

async function processAsset(asset, outputDir) {
  const dest = path.join(outputDir, `${asset.name}.glb`);

  // Skip if already generated to preserve the $3.50 credit budget
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`[Cache Hit] ${asset.name}.glb exists (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB). Skipping generation.`);
    return;
  }

  console.log(`\n======================================================`);
  console.log(`[Fal.ai] Generating: ${asset.name} (${asset.description})`);
  console.log(`Target Polycount: ${asset.targetPolycount} | Image: ${asset.imageUrl}`);
  console.log(`======================================================`);

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
        console.log(`[${asset.name}] Status: ${update.status} (pos: ${update.queue_position ?? 0})`);
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
      console.log(`[${asset.name}] GLB URL: ${modelUrl}`);
      console.log(`Downloading ${asset.name}.glb into ${dest}...`);
      await downloadGLB(modelUrl, dest);
      console.log(`Success -> ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      console.warn(`[${asset.name}] Could not locate GLB URL in response:`, resultData);
    }
  } catch (err) {
    console.error(`[${asset.name}] Generation error:`, err.message || err);
  }
}

async function main() {
  const outputDir = path.resolve("./public/models");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const asset of ASSET_QUEUE) {
    await processAsset(asset, outputDir);
  }

  console.log("\n Asset batch generation cycle complete!");
}

main();
