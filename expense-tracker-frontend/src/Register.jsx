import "./Auth.css";
import { useState } from "react";

function Register({ onShowLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Registration failed");
      }

      setMessage("Registration successful! Please login.");
      setUsername("");
      setPassword("");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
  <div className="auth-page">
    <div className="auth-card">
      <h2>Create account</h2>
      <p className="auth-subtitle">
        Create your account to start tracking expenses
      </p>

      <form className="auth-form" onSubmit={handleRegister}>
        <label>Username</label>

        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">
          Register
        </button>
      </form>

      {message && (
        <p className="auth-message">{message}</p>
      )}

      {error && (
        <p className="auth-error">{error}</p>
      )}

      <p className="auth-switch">
        Already have an account?
        <button className="auth-link" onClick={onShowLogin}>
          Login
        </button>
      </p>
    </div>
  </div>
);
}

export default Register;