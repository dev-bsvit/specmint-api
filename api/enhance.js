/**
 * SpecMint API - Enhance Endpoint
 *
 * Receives design specification and screenshot,
 * sends to AI (Claude/OpenAI) for enhanced analysis,
 * returns improved specification.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');

// Initialize AI clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// AI Enhancement prompt - PIXEL-PERFECT focused
const ENHANCEMENT_PROMPT = `Ты эксперт по Pixel-Perfect верстке. Получаешь скриншот дизайна и техническую спецификацию.

ЗАДАЧА: Создать КРАТКУЮ спецификацию для точной верстки. Только критичные данные для Pixel-Perfect реализации.

ВЫДАЙ В ФОРМАТЕ:

## 🎯 Структура (HTML семантика)
[Кратко: какие теги использовать]

## 📐 Размеры и отступы
[Точные значения: width, height, padding, margin, gap]

## 🎨 Стили
[Цвета, шрифты, border-radius, shadows - точные значения]

## 📱 Layout
[Flexbox/Grid параметры: direction, justify, align, gap]

## ⚠️ Важные детали
[Что легко упустить при верстке]

ПРАВИЛА:
- Максимум 2000 символов
- Только конкретные значения из спеки
- Никаких общих советов
- Только то что нужно для верстки

СПЕЦИФИКАЦИЯ:
`;

/**
 * Enhance specification using Claude (Anthropic)
 */
async function enhanceWithClaude(specMd, specJson, screenshot) {
  if (!anthropic) {
    throw new Error('Claude API key not configured');
  }

  try {
    // Prepare messages for Claude
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: ENHANCEMENT_PROMPT + '\n\n' + specMd
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshot
            }
          }
        ]
      }
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: messages
    });

    // Extract enhanced text
    const enhancedSpec = response.content[0].text;

    return {
      success: true,
      enhanced: enhancedSpec,
      model: 'claude-3.5-sonnet',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens
    };

  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Enhance specification using GPT-4o (OpenAI) with vision
 */
async function enhanceWithOpenAI(specMd, specJson, screenshot) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('Calling OpenAI GPT-4o with vision...');

    // Call GPT-4o API (supports vision)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest GPT-4 with vision support
      max_tokens: 2000, // Reduced for compact output
      temperature: 0.3, // Lower temp for more focused output
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по Pixel-Perfect верстке. Даёшь КРАТКИЕ точные спецификации. Максимум 2000 символов. Только факты, никаких общих советов.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: ENHANCEMENT_PROMPT + '\n\n' + specMd
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: 'high' // Request high-detail analysis
              }
            }
          ]
        }
      ]
    });

    // Extract enhanced text
    const enhancedSpec = response.choices[0].message.content;

    console.log('OpenAI response received:', {
      model: response.model,
      tokensUsed: response.usage.total_tokens,
      specLength: enhancedSpec.length
    });

    return {
      success: true,
      enhanced: enhancedSpec,
      model: 'gpt-4o',
      tokensUsed: response.usage.total_tokens
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
}

/**
 * Main API handler
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { specMd, specJson, screenshot, provider = 'openai' } = req.body; // Default to OpenAI

    // Validate input
    if (!specMd || !screenshot) {
      return res.status(400).json({
        error: 'Missing required fields: specMd and screenshot are required'
      });
    }

    // Check screenshot size (max 20MB base64)
    if (screenshot.length > 20 * 1024 * 1024) {
      return res.status(400).json({
        error: 'Screenshot too large (max 20MB)'
      });
    }

    console.log(`Enhancing specification using ${provider}...`);
    console.log(`Spec length: ${specMd.length} chars`);
    console.log(`Screenshot length: ${screenshot.length} chars`);

    // Call AI provider
    let result;
    if (provider === 'openai' && openai) {
      result = await enhanceWithOpenAI(specMd, specJson, screenshot);
    } else if (provider === 'claude' && anthropic) {
      result = await enhanceWithClaude(specMd, specJson, screenshot);
    } else {
      // Fallback: try available provider
      if (anthropic) {
        result = await enhanceWithClaude(specMd, specJson, screenshot);
      } else if (openai) {
        result = await enhanceWithOpenAI(specMd, specJson, screenshot);
      } else {
        return res.status(503).json({
          error: 'No AI provider configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY'
        });
      }
    }

    // Return enhanced specification
    return res.status(200).json(result);

  } catch (error) {
    console.error('Enhancement error:', error);

    return res.status(500).json({
      error: 'Enhancement failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
