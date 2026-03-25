// login.jsx
"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");


        if (!username || !password) {
            setError("Username and password are required");
            return;
        }

        const response = await fetch("http://localhost:8000/users/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("access_token", result.access_token);
            localStorage.setItem("refresh_token", result.refresh);

            navigate("/profile");
        } else {
            console.log("Error during login");
            setError(result.detail || "Invalid username or password");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">

            {error && (
                <p style={{ color: "red", marginBottom: "10px" }}>
                    {error}
                </p>
            )}

            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                />
            </div>

            <button type="submit" className="btn btn-primary full-width">
                Log in
            </button>

            <div className="divider">OR</div>

            <button type="button" className="social-btn">
                <span>Sign in with Google</span>
            </button>

            <p className="auth-link">
                Don't have an account? <Link to="/register">Create one</Link>
            </p>
        </form>
    );
}