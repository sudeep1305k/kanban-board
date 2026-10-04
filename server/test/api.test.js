import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.DB_PATH = ':memory:';
const { default: app } = await import('../src/app.js');

async function signup(email = 'a@example.com') {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
  return { Authorization: `Bearer ${res.body.token}` };
}

test('health check', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
});

test('register rejects weak password and bad email', async () => {
  const weak = await request(app).post('/api/auth/register').send({ email: 'x@example.com', password: '123' });
  assert.equal(weak.status, 400);
  const bad = await request(app).post('/api/auth/register').send({ email: 'nope', password: 'password123' });
  assert.equal(bad.status, 400);
});

test('duplicate email returns 409 and login works', async () => {
  const body = { email: 'dup@example.com', password: 'password123' };
  assert.equal((await request(app).post('/api/auth/register').send(body)).status, 201);
  assert.equal((await request(app).post('/api/auth/register').send(body)).status, 409);
  assert.equal((await request(app).post('/api/auth/login').send(body)).status, 200);
  const wrong = await request(app).post('/api/auth/login').send({ ...body, password: 'wrongpass1' });
  assert.equal(wrong.status, 401);
});

test('tasks require a token', async () => {
  assert.equal((await request(app).get('/api/tasks')).status, 401);
});

test('task CRUD, filter and search', async () => {
  const h = await signup('crud@example.com');
  const created = await request(app).post('/api/tasks').set(h).send({ title: 'Write report', priority: 1 });
  assert.equal(created.status, 201);
  const id = created.body.id;

  await request(app).post('/api/tasks').set(h).send({ title: 'Buy milk', status: 'done' });

  const done = await request(app).get('/api/tasks?status=done').set(h);
  assert.equal(done.body.length, 1);
  const found = await request(app).get('/api/tasks?search=report').set(h);
  assert.equal(found.body.length, 1);

  const moved = await request(app).patch(`/api/tasks/${id}`).set(h).send({ status: 'in_progress' });
  assert.equal(moved.body.status, 'in_progress');

  assert.equal((await request(app).delete(`/api/tasks/${id}`).set(h)).status, 204);
  assert.equal((await request(app).patch(`/api/tasks/${id}`).set(h).send({ title: 'x' })).status, 404);
});

test('validation errors and data isolation between users', async () => {
  const h1 = await signup('one@example.com');
  const h2 = await signup('two@example.com');
  assert.equal((await request(app).post('/api/tasks').set(h1).send({ title: '' })).status, 400);
  const bad = await request(app).post('/api/tasks').set(h1).send({ title: 'ok', status: 'weird' });
  assert.equal(bad.status, 400);

  const t = await request(app).post('/api/tasks').set(h1).send({ title: 'Private' });
  assert.equal((await request(app).patch(`/api/tasks/${t.body.id}`).set(h2).send({ title: 'hack' })).status, 404);
  assert.equal((await request(app).get('/api/tasks').set(h2)).body.length, 0);
});
