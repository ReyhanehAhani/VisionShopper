#!/usr/bin/env node

/**
 * Diagnostic script to list available Google Gemini models
 * that support generateContent and vision capabilities
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔍 Fetching available models from Google Generative AI...\n');

try {
  // Use REST API directly to list models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  const data = await response.json();
  const allModels = data.models || [];

  console.log(`📊 Found ${allModels.length} total models\n`);

  // Filter models that support generateContent
  const modelsWithGenerateContent = allModels.filter(model => 
    model.supportedGenerationMethods && 
    model.supportedGenerationMethods.includes('generateContent')
  );

  console.log(`✅ Models supporting generateContent: ${modelsWithGenerateContent.length}\n`);

  // Display models that support generateContent
  console.log('=' .repeat(80));
  console.log('MODELS SUPPORTING generateContent (for text/image analysis):');
  console.log('=' .repeat(80));
  
  modelsWithGenerateContent.forEach((model, index) => {
    console.log(`\n${index + 1}. Model Name: ${model.name}`);
    console.log(`   Display Name: ${model.displayName || 'N/A'}`);
    console.log(`   Description: ${model.description || 'N/A'}`);
    console.log(`   Version: ${model.version || 'N/A'}`);
    console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
    console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
    console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
    
    // Check for vision capability (multimodal models typically support images)
    const supportsVision = model.inputTokenLimit > 30000 || 
                          (model.description && (
                            model.description.toLowerCase().includes('multimodal') ||
                            model.description.toLowerCase().includes('vision') ||
                            model.description.toLowerCase().includes('image')
                          ));
    
    if (supportsVision) {
      console.log(`   ✅ LIKELY SUPPORTS VISION/MULTIMODAL`);
    }
  });

  // Extract exact model name strings (without "models/" prefix for SDK usage)
  console.log('\n' + '='.repeat(80));
  console.log('EXACT MODEL NAMES TO USE IN YOUR CODE:');
  console.log('='.repeat(80));
  console.log('\nCopy these exact strings for the @ai-sdk/google provider:\n');
  
  modelsWithGenerateContent.forEach((model, index) => {
    // Remove "models/" prefix if present
    const modelName = model.name.replace(/^models\//, '');
    console.log(`${index + 1}. "${modelName}"`);
  });

  // Show preferred models for vision tasks
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDED MODELS FOR VISION/IMAGE ANALYSIS:');
  console.log('='.repeat(80));
  
  const visionModels = modelsWithGenerateContent.filter(model => {
    const modelName = (model.name || '').toLowerCase();
    const desc = (model.description || '').toLowerCase();
    return (
      modelName.includes('flash') || 
      modelName.includes('pro') ||
      desc.includes('multimodal') ||
      desc.includes('vision') ||
      model.inputTokenLimit > 30000
    );
  });

  if (visionModels.length > 0) {
    visionModels.forEach((model, index) => {
      const modelName = model.name.replace(/^models\//, '');
      console.log(`${index + 1}. "${modelName}" - ${model.displayName || model.name}`);
    });
  } else {
    console.log('⚠️  No models specifically identified as vision-capable.');
    console.log('   Try the models listed above - most Gemini models support images.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Diagnostic complete!');
  console.log('='.repeat(80) + '\n');

} catch (error) {
  console.error('\n❌ ERROR fetching models:');
  console.error('   Error type:', error.constructor?.name || 'Unknown');
  console.error('   Error message:', error.message || 'No message');
  if (error.stack) {
    console.error('\n   Stack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}
