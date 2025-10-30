/**
 * Health check endpoint
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      claude: hasAnthropic ? 'configured' : 'not configured',
      openai: hasOpenAI ? 'configured' : 'not configured'
    },
    version: '1.0.0'
  });
};
