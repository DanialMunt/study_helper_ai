export function extractJson(raw: string): any {

  const text = raw.trim();


  if (text.startsWith('{')) {
    return JSON.parse(text);
  }


  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in LLM response');
  }

  return JSON.parse(match[0]);
}
