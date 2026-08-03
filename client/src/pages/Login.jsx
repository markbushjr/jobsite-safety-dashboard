import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-brand">
        <span className="login-brand__mark">Jobsite Safety Compliance</span>
        <h1 className="login-brand__headline">
          Every site. Every week. One record of compliance.
        </h1>
        <div className="login-brand__stamp">
          <span>Weekly inspection log</span>
          <strong>Status: Active</strong>
        </div>
      </aside>

      <div className="login-form-side">
        <div className="login-card">
          <p className="login-card__eyebrow">Sign in</p>
          <h1>Access your dashboard</h1>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
