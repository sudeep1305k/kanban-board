import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import TaskCard from './TaskCard.jsx';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(2);
  const [error, setError] = useState('');

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) return onLogout();
      setError(err.message);
    },
    [onLogout]
  );

  const load = useCallback(async () => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      setTasks(await api.listTasks(query));
    } catch (err) {
      handleError(err);
    }
  }, [search, handleError]);

  // Debounce searching so we do not call the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const task = await api.createTask({ title, priority });
      setTasks((prev) => [task, ...prev]);
      setTitle('');
      setError('');
    } catch (err) {
      handleError(err);
    }
  }

  async function moveTask(id, status) {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t))); // optimistic update
    try {
      await api.updateTask(id, { status });
    } catch (err) {
      setTasks(previous); // roll back if the server rejects it
      handleError(err);
    }
  }

  async function removeTask(id) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      setTasks(previous);
      handleError(err);
    }
  }

  function onDrop(e, status) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) moveTask(id, status);
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Kanban Board</h1>
        <div className="topbar-right">
          <span className="muted">{user.email}</span>
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="toolbar">
        <form className="add-form" onSubmit={addTask}>
          <input placeholder="New task title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </select>
          <button>Add task</button>
        </form>
        <input
          className="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="columns">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <section
              key={col.key}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <h2>
                {col.label} <span className="count">{items.length}</span>
              </h2>
              {items.map((t) => (
                <TaskCard key={t.id} task={t} onDelete={removeTask} />
              ))}
              {items.length === 0 && <p className="muted empty">Drop tasks here</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
