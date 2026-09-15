import { NextRequest, NextResponse } from 'next/server';
import { saveDocument } from '@/lib/knowledge-base';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, source } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, type' },
        { status: 400 }
      );
    }

    const validTypes = ['book', 'transcription', 'case', 'image', 'audio'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const document = await saveDocument(title, content, type, source);

    return NextResponse.json({
      success: true,
      message: 'Documento guardado exitosamente',
      document,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Error al guardar el documento' },
      { status: 500 }
    );
  }
}