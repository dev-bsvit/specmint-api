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

// AI Enhancement prompt - STRICT PIXEL-PERFECT
const ENHANCEMENT_PROMPT = `Ты эксперт-верстальщик. Твоя задача: создать ТОЧНУЮ инструкцию для Pixel-Perfect верстки на основе предоставленной спецификации и скриншота.

⚠️ КРИТИЧЕСКИЕ ПРАВИЛА (НАРУШЕНИЕ = ОШИБКА):
1. КОПИРУЙ ТОЛЬКО цвета из секции "4. Color Palette" - НЕ выдумывай свои цвета!
2. КОПИРУЙ ТОЛЬКО размеры из секций "6. Complete Layer Hierarchy" и "11. Layout & Style Map" - НЕ округляй!
3. КОПИРУЙ точные значения: border-radius, padding, gap - ИЗ секции "1. Frame Properties" (Auto Layout)!
4. КОПИРУЙ шрифты из секции "5. Typography Styles" и "9. Text Layers" - НЕ изобретай свои!
5. КОПИРУЙ spacing из секции "3. Spacing Between Sections" - точные значения gap!
6. ЕСЛИ элемента НЕТ в "6. Complete Layer Hierarchy" - НЕ УПОМИНАЙ его в ответе!
7. ОБЯЗАТЕЛЬНО укажи: scrollbar стиль (если есть overflow), все отступы, все border-radius

📋 ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ОТВЕТА:

## 🎯 Видимые элементы (по порядку из Layer Hierarchy)
Перечисли ВСЕ элементы из секции "6. Complete Layer Hierarchy" в том же порядке:
- [Layer name 1] (type) - краткое описание
- [Layer name 2] (type) - краткое описание
...

## 📐 ТОЧНЫЕ размеры (копируй из секции 6 и 11!)
\`\`\`
Frame: [WIDTH из секции 1]x[HEIGHT из секции 1]px

Layer Hierarchy (копируй точные значения):
├─ [Layer name]: [WIDTH]x[HEIGHT]px @([X], [Y])px
│  ├─ fill: [HEX из секции 4]
│  ├─ radius: [VALUE]px (копируй точное значение!)
│  ├─ padding: [TOP]/[RIGHT]/[BOTTOM]/[LEFT]px (из autolayout)
│  ├─ gap: [VALUE]px (из itemSpacing)
│  └─ children: [COUNT]
├─ [Next layer]: ...
\`\`\`

## 🎨 ТОЧНЫЕ цвета (ТОЛЬКО из секции 4!)
Копируй ВСЕ цвета из "4. Color Palette" БЕЗ изменений:
\`\`\`
[Копируй каждую строку из секции 4 Color Palette]
Например:
- #242422 — opacity: 1
- #FFFFFF — opacity: 0.15
- #000000 — opacity: 1
...
\`\`\`

## 📝 ТОЧНЫЕ шрифты (ТОЛЬКО из секции 5 и 9!)
Копируй ВСЕ шрифты из "5. Typography Styles" и применяй к текстам из "9. Text Layers":
\`\`\`
[Копируй каждую строку из секции 5]
Например:
- Inter | 14px | weight:500 | line-height:20px | letter-spacing:0
- Inter | 12px | weight:400 | line-height:16px | letter-spacing:0
...

Применение (из секции 9):
- "SpecMint" → Inter 14px weight 500
- "12 Tokens" → Inter 12px weight 400
\`\`\`

## 📱 Layout (копируй из секции 1 "Auto Layout")
\`\`\`
Frame Auto Layout:
  - Direction: [layoutMode из секции 1]
  - Gap: [itemSpacing]px
  - Padding: [top]px [right]px [bottom]px [left]px
  - Primary align: [primaryAxisAlignItems]
  - Counter align: [counterAxisAlignItems]

[Для каждого child с autolayout копируй те же параметры]
\`\`\`

## 🔍 Критичные детали

### Spacing (копируй из секции 3)
\`\`\`
Vertical gaps (копируй точные значения):
[Копируй из секции 3 "Spacing Between Sections"]

Horizontal gaps (если есть):
[Копируй из секции 3]
\`\`\`

### Border Radius (копируй из секции 6 и 11)
\`\`\`
[Layer name]: radius [VALUE]px (копируй точное значение из секции 11)
[Layer name]: radius TL [X]px, TR [Y]px, BL [Z]px, BR [W]px
\`\`\`

### Scrollbar (если элемент имеет overflow)
Если на скриншоте виден scrollbar:
\`\`\`
Scrollbar:
  - width: [определи по скриншоту]px
  - track: [цвет из секции 4]
  - thumb: [цвет из секции 4]
  - thumb-radius: [определи]px
\`\`\`

### Effects (копируй из секции 11)
Если у элемента есть effects (shadows, blur):
\`\`\`
[Layer name]: [скопируй точное описание effect из секции 11]
\`\`\`

❗ ПРОВЕРОЧНЫЙ ЧЕКЛИСТ ПЕРЕД ОТПРАВКОЙ:
- ✓ Все HEX-коды скопированы из "4. Color Palette" БЕЗ изменений?
- ✓ Все размеры (width/height/x/y) скопированы из "6. Complete Layer Hierarchy"?
- ✓ Все border-radius скопированы из "11. Layout & Style Map"?
- ✓ Все padding/gap скопированы из "1. Frame Properties" Auto Layout?
- ✓ Все шрифты скопированы из "5. Typography Styles"?
- ✓ Все spacing скопированы из "3. Spacing Between Sections"?
- ✓ Scrollbar стиль описан (если виден на скриншоте)?
- ✓ НЕ добавил элементы, которых НЕТ в "6. Complete Layer Hierarchy"?
- ✓ Сохранен порядок элементов из секции 6?

СПЕЦИФИКАЦИЯ ДЛЯ АНАЛИЗА:
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
      max_tokens: 4096, // Increased for detailed spec
      temperature: 0.1, // Very low for strict adherence
      messages: [
        {
          role: 'system',
          content: `Ты эксперт-верстальщик. Твоя задача: КОПИРОВАТЬ точные значения из спецификации БЕЗ интерпретации.

КРИТИЧНЫЕ ПРАВИЛА:
1. КОПИРУЙ HEX-коды ТОЛЬКО из секции "4. Color Palette" - НЕ изобретай свои цвета!
2. КОПИРУЙ размеры ТОЛЬКО из секций "6. Complete Layer Hierarchy" и "11. Layout & Style Map" - НЕ округляй!
3. КОПИРУЙ border-radius, padding, gap ТОЛЬКО из секций 1, 6, 11 - точные значения!
4. КОПИРУЙ шрифты ТОЛЬКО из секции "5. Typography Styles" - НЕ придумывай свои!
5. ОБЯЗАТЕЛЬНО укажи scrollbar стили (если виден на скриншоте)
6. ОБЯЗАТЕЛЬНО укажи overflow для элементов с прокруткой
7. НЕ добавляй элементы, которых НЕТ в "6. Complete Layer Hierarchy"

Спецификация содержит секции:
- Секция 1: Frame Properties (размеры фрейма, Auto Layout)
- Секция 3: Spacing Between Sections (точные gap значения)
- Секция 4: Color Palette (все HEX коды)
- Секция 5: Typography Styles (все шрифты)
- Секция 6: Complete Layer Hierarchy (полное дерево слоев)
- Секция 9: Text Layers (текстовое содержимое)
- Секция 11: Layout & Style Map (детальные стили)

Используй ТОЛЬКО данные из этих секций. Используй структурированный формат с code blocks.
ТОЛЬКО точные факты из спеки + скриншота. НЕ интерпретируй, НЕ улучшай - КОПИРУЙ!`
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
