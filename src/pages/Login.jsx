import LoginForm from "../components/auth/LoginForm"
import "../styles/auth.css"

export default function Login() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to your account</p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
