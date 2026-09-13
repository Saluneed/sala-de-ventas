import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database error', error);
    throw error;
  }
}

export async function getUser(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getUserById(id: number) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createUser(email: string, password: string, name: string) {
  const result = await query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
    [email, password, name]
  );
  return result.rows[0];
}

export async function updateUserMode(userId: number, unlocked: boolean) {
  const result = await query(
    'UPDATE users SET mode_unlocked = $1 WHERE id = $2 RETURNING *',
    [unlocked, userId]
  );
  return result.rows[0];
}

export async function createConversation(userId: number, mode: string, title?: string) {
  const result = await query(
    'INSERT INTO conversations (user_id, mode, title) VALUES ($1, $2, $3) RETURNING *',
    [userId, mode, title || `Conversación ${new Date().toLocaleDateString()}`]
  );
  return result.rows[0];
}

export async function getConversations(userId: number, mode: string) {
  const result = await query(
    'SELECT * FROM conversations WHERE user_id = $1 AND mode = $2 ORDER BY created_at DESC',
    [userId, mode]
  );
  return result.rows;
}

export async function getConversationMessages(conversationId: number) {
  const result = await query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows;
}

export async function addMessage(conversationId: number, role: string, content: string, imageUrl?: string) {
  const result = await query(
    'INSERT INTO messages (conversation_id, role, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [conversationId, role, content, imageUrl || null]
  );
  return result.rows[0];
}

export async function addKnowledgeBase(title: string, content: string, category: string) {
  const result = await query(
    'INSERT INTO knowledge_base (title, content, category) VALUES ($1, $2, $3) RETURNING *',
    [title, content, category]
  );
  return result.rows[0];
}

export async function getKnowledgeBase(category?: string) {
  if (category) {
    const result = await query('SELECT * FROM knowledge_base WHERE category = $1', [category]);
    return result.rows;
  }
  const result = await query('SELECT * FROM knowledge_base');
  return result.rows;
}