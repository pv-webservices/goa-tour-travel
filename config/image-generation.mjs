// Central configuration for server-side OpenAI image generation.
// Change models, quality levels or sizes here; scripts/generate-images.mjs reads everything from this file.
// The API key is never stored here: it is read from the OPENAI_API_KEY environment variable.

export const imageConfig = {
  endpoint: 'https://api.openai.com/v1/images/generations',
  models: {
    flare: process.env.OPENAI_IMAGE_MODEL_FLARE || 'gpt-image-2.5-flare',
    sunburst: process.env.OPENAI_IMAGE_MODEL_SUNBURST || 'gpt-image-2.5-sunburst',
  },
  quality: {
    default: process.env.OPENAI_IMAGE_QUALITY_DEFAULT || 'medium',
    premium: process.env.OPENAI_IMAGE_QUALITY_PREMIUM || 'high',
  },
  sizes: {
    square: '1024x1024',
    landscape: '1536x1024',
    portrait: '1024x1536',
  },
  outputFormat: 'png',
  // Generated originals stay outside public/; optimized WebP versions are written to public/media.
  outputDir: 'assets-src/ai',
  timeoutMs: 240_000,
};

// Traits that justify the premium model. Anything else routes to Flare.
const SUNBURST_TRAITS = new Set([
  'hero',
  'premium-banner',
  'multiple-subjects',
  'photorealistic-people',
  'complex-lighting',
  'detailed-commercial-scene',
  'product-consistency',
  'reference-image',
]);

/** Pick model + quality automatically from a job's declared priority and traits. */
export function routeImageJob(job) {
  const needsSunburst = job.forceSunburst || (job.traits || []).some((t) => SUNBURST_TRAITS.has(t));
  const isImportant = job.priority === 'high' || job.priority === 'hero';
  return {
    model: needsSunburst ? imageConfig.models.sunburst : imageConfig.models.flare,
    quality: isImportant ? imageConfig.quality.premium : imageConfig.quality.default,
    size: imageConfig.sizes[job.orientation || 'landscape'],
  };
}
