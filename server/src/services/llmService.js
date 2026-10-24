export async function callDeepSeek(messages, { model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro', temperature = 0.2 } = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(240000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
      reasoning_effort: 'high',
      extra_body: { thinking: { type: 'enabled' } },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw Object.assign(new Error(`DeepSeek request failed (${response.status}): ${text.slice(0, 300)}`), { providerStatus: response.status });
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}
