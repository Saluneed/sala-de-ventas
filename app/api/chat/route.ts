import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getConversationMessages, addMessage, createConversation, getConversations, getUserById } from '@/lib/db';
import { callClaude } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { conversationId, message, mode, imageData } = await request.json();

    if (!message || !mode) {
      return NextResponse.json(
        { error: 'Mensaje y modo requeridos' },
        { status: 400 }
      );
    }
        // Verificar que el usuario puede usar este modo
    if (mode === 'vendedor') {
      const user = await getUserById(decoded.userId);
      if (!user.mode_unlocked) {
        return NextResponse.json(
          { error: 'Modo vendedor bloqueado' },
          { status: 403 }
        );
      }
    }

    // Crear conversación si no existe
    let convId = conversationId;
    if (!convId) {
      const newConv = await createConversation(decoded.userId, mode);
      convId = newConv.id;
    }

    // Obtener historial de mensajes
    const messages = await getConversationMessages(convId);

    // Guardar el mensaje del usuario
    await addMessage(convId, 'user', message, imageData?.preview || null);
        // Formatear mensajes para Claude
    const claudeMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Agregar el nuevo mensaje del usuario
    claudeMessages.push({
      role: 'user',
      content: message
    });
        // Llamar a Claude
    const assistantResponse = await callClaude(claudeMessages, mode as 'practica' | 'vendedor');

    // Guardar la respuesta
    await addMessage(convId, 'assistant', assistantResponse);

    return NextResponse.json({
      success: true,
      conversationId: convId,
      response: assistantResponse,
      messages: [
        ...messages,
        { role: 'user', content: message, id: Date.now() },
        { role: 'assistant', content: assistantResponse, id: Date.now() + 1 }
      ]
    });
      } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el mensaje' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const conversationId = url.searchParams.get('conversationId');
        if (conversationId) {
      const messages = await getConversationMessages(parseInt(conversationId));
      return NextResponse.json({ messages });
    }

    if (mode) {
      const conversations = await getConversations(decoded.userId, mode);
      return NextResponse.json({ conversations });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}