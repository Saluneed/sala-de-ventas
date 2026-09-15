import { supabaseAdmin } from './supabase';

export interface Document {
  id: number;
  title: string;
  content: string;
  type: string;
  source?: string;
  created_at: string;
}

// Guardar un documento en la base de conocimiento
export async function saveDocument(
  title: string,
  content: string,
  type: 'book' | 'transcription' | 'case' | 'image' | 'audio',
  source?: string
): Promise<Document> {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert({
      title,
      content,
      type,
      source,
    })
    .select()
    .single();

  if (error) throw new Error(`Error saving document: ${error.message}`);
  return data;
}

// Buscar documentos relevantes (búsqueda simple por texto)
export async function searchDocuments(query: string, limit = 5): Promise<Document[]> {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit);

  if (error) throw new Error(`Error searching documents: ${error.message}`);
  return data || [];
}

// Obtener todos los documentos de un tipo específico
export async function getDocumentsByType(
  type: 'book' | 'transcription' | 'case' | 'image' | 'audio'
): Promise<Document[]> {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error getting documents: ${error.message}`);
  return data || [];
}

// Obtener contexto relevante para una pregunta (para usar en el prompt de Claude)
export async function getContextForQuestion(question: string): Promise<string> {
  try {
    const documents = await searchDocuments(question, 3);
    
    if (documents.length === 0) {
      return '';
    }

    let context = '\n📚 CONTEXTO DE BASE DE CONOCIMIENTO:\n\n';
    documents.forEach((doc, index) => {
      context += `${index + 1}. ${doc.title} (${doc.type})\n`;
      context += `${doc.content.substring(0, 300)}...\n\n`;
    });

    return context;
  } catch (error) {
    console.error('Error getting context:', error);
    return '';
  }
}