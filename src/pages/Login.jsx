import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authenticateUser, getCurrentUser } from '../lib/storage.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (getCurrentUser()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await authenticateUser(email, password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate('/home');
  };

  return (
    <div className="page login-page">
      <div className="auth-card">
        <h1>Bienvenue</h1>
        <p>Connectez-vous pour découvrir vos films et séries.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <div className="auth-footer">
          <span>Pas de compte ?</span>
          <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}
