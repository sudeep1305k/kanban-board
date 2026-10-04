import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in_progress', 'done'];

function validate(body, { partial }) {
  const out = {};
  if (body.title !== undefined || !partial) {
    const title = String(body.title ?? '').trim();
    if (!title || title.length > 200) return { error: 'Title is required (max 200 characters)' };
    out.title = title;
  }
  if (body.description !== undefined) {
    const description = String(body.description);
    if (description.length > 2000) return { error: 'Description too long (max 2000)' };
    out.description = description;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: 'Invalid status' };
    out.status = body.status;
  }
  if (body.priority !== undefined) {
    const p = Number(body.priority);
    if (![1, 2, 3].includes(p)) return { error: 'Priority must be 1, 2 or 3' };
    out.priority = p;
  }
  return { data: out };
}

router.get('/', (req, res) => {
  const where = ['user_id = ?'];
  const params = [req.userId];
  if (req.query.status && STATUSES.includes(req.query.status)) {
    where.push('status = ?');
    params.push(req.query.status);
  }
  if (req.query.search) {
    where.push('title LIKE ?');
    params.push(`%${req.query.search}%`);
  }
  const rows = db
    .prepare(`SELECT * FROM tasks WHERE ${where.join(' AND ')} ORDER BY priority ASC, id DESC`)
    .all(...params);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { data, error } = validate(req.body || {}, { partial: false });
  if (error) return res.status(400).json({ error });
  const { lastInsertRowid } = db
    .prepare('INSERT INTO tasks (user_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, data.title, data.description ?? '', data.status ?? 'todo', data.priority ?? 2);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid));
});

function findOwn(req, res) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) res.status(404).json({ error: 'Task not found' });
  return task;
}

router.patch('/:id', (req, res) => {
  const task = findOwn(req, res);
  if (!task) return;
  const { data, error } = validate(req.body || {}, { partial: true });
  if (error) return res.status(400).json({ error });
  const merged = { ...task, ...data };
  db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?').run(
    merged.title,
    merged.description,
    merged.status,
    merged.priority,
    task.id
  );
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

router.delete('/:id', (req, res) => {
  const task = findOwn(req, res);
  if (!task) return;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.status(204).end();
});

export default router;
