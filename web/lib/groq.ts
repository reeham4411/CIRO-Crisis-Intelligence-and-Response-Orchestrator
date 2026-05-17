import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function askGroq(
  systemPrompt: string,
  userPrompt: string,
  jsonMode = true
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  })
  return response.choices[0]?.message?.content ?? '{}'
}
