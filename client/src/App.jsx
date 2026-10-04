import { useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import Board from './components/Board.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved && localStorage.getItem('token') ? JSON.parse(saved) : null;
  });

  function handleAuth({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return user ? (
    <Board user={user} onLogout={handleLogout} />
  ) : (
    <AuthForm onAuth={handleAuth} />
  );
}
