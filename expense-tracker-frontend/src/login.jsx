import "./Auth.css";
import { useState } from "react";

function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const token = await response.text();

      localStorage.setItem("token", token);

      onLogin();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
  <div className="auth-page">
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p className="auth-subtitle">
        Login to continue to your expense tracker
      </p>

      <form className="auth-form" onSubmit={handleLogin}>
        <label>Username</label>

        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">
          Login
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      <p className="auth-switch">
        Don't have an account?
        <button className="auth-link" onClick={onShowRegister}>
          Register
        </button>
      </p>
    </div>
  </div>
);
}

export default Login;