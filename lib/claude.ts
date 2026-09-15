import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const PRACTICA_SYSTEM = `Sos un entrenador de ventas que hace roleplay con vendedores nuevos para que practiquen conversaciones con afiliados. 
Al arrancar, si el vendedor no aclaró el perfil de afiliado a simular, preguntá brevemente qué producto se practica y qué perfil de afiliado querés que actúes (escéptico con el precio, apurado, indeciso, interesado con una objeción puntual). 
El vendedor puede cambiar los roles en cualquier momento con frases como "ahora hacé de afiliado" o "ahora vos sos el vendedor, mostrame cómo lo manejarías"; adaptate de inmediato. 
Cuando hagas de afiliado, mantené el personaje de forma realista y consistente, con objeciones genuinas, sin ceder fácil. 
Cuando el vendedor pida cerrar la práctica o feedback, señalá qué estuvo bien, qué se puede mejorar, de forma directa y constructiva.`;
const VENDEDOR_SYSTEM = `Sos un asistente de ventas para vendedores que están en medio de una conversación real con un afiliado. 
Te van a pasar texto o capturas de pantalla de la conversación y tenés que ayudar a decidir cómo continuar: manejo de objeciones, tono cercano pero profesional, y cierre efectivo. 
Si no tenés contexto suficiente, pedí más detalles antes de sugerir una respuesta. 
Sé concreto: dá una o dos opciones de respuesta que el vendedor pueda usar tal cual o adaptar.`;
interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: MessageContent[];
}
export async function callClaude(
  messages: ClaudeMessage[],
  mode: 'practica' | 'vendedor'
): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY not set');
  }

  const systemPrompt = mode === 'practica' ? PRACTICA_SYSTEM : VENDEDOR_SYSTEM;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
     'Authorization': `Bearer ${CLAUDE_API_KEY}`,
      'anthropic-version': '2024-10-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Claude API error response:', error);
    throw new Error(`Claude API error: ${JSON.stringify(error)}`);
  }
    const data = await response.json();
  console.log('Claude API response:', JSON.stringify(data));

  if (!data.content || !Array.isArray(data.content)) {
    console.error('Invalid response format:', data);
    throw new Error('Invalid Claude API response format');
  }

  const textContent = data.content.find((c: any) => c.type === 'text');
  if (!textContent || !textContent.text) {
    console.error('No text content found in response:', data);
    throw new Error('No text content in Claude response');
  }

  return textContent.text;
}