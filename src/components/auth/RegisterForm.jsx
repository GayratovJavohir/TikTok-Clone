"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"

export default function RegisterForm() {

    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const [serverError, setServerError] = useState("")

    const onSubmit = async (data) => {
        setServerError("")

        const response = await fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (response.ok) {
            const loginRes = await fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    password: data.password
                })
            });

            const loginData = await loginRes.json();
            console.log(loginData)

            localStorage.setItem("access_token", loginData.access_token);
            localStorage.setItem("refresh_token", loginData.refresh);

            navigate("/");
        } else {
            console.log("Error creating user")
            if (result.username) setServerError(result.username[0])
            if (result.email) setServerError(result.email[0])
            if (result.password) setServerError(result.password[0])
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="form">

            {serverError && (
                <p style={{ color: "red", marginBottom: "10px" }}>
                    {serverError}
                </p>
            )}

            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    className="input"
                    {...register("username", {
                        required: "Username is required",
                        minLength: {
                            value: 4,
                            message: "Username must be at least 4 characters"
                        }
                    })}
                />

                {errors.username && (
                    <p style={{ color: "red" }}>{errors.username.message}</p>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="first_name">Firstname</label>
                <input
                    id="first_name"
                    className="input"
                    {...register("first_name", { required: "Firstname is required" })}
                />
                {errors.first_name && (
                    <p style={{ color: "red" }}>{errors.first_name.message}</p>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="last_name">Lastname</label>
                <input
                    id="last_name"
                    className="input"
                    {...register("last_name", { required: "Lastname is required" })}
                />
                {errors.last_name && (
                    <p style={{ color: "red" }}>{errors.last_name.message}</p>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                    type="email"
                    id="email"
                    className="input"
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email format"
                        }
                    })}
                />
                {errors.email && (
                    <p style={{ color: "red" }}>{errors.email.message}</p>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    className="input"
                    {...register("password", {
                        required: "Password is required",
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                        }
                    })}
                />
                {errors.password && (
                    <p style={{ color: "red" }}>{errors.password.message}</p>
                )}
            </div>

            <button type="submit" className="btn btn-primary full-width">
                Create Account
            </button>

            <div className="divider">OR</div>

            <button type="button" className="social-btn">
                <span>Sign up with Google</span>
            </button>

            <p className="auth-link">
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </form>
    )
}
