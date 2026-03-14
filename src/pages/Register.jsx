import RegisterForm from "../components/auth/RegisterForm"
import "../styles/auth.css"

export default function Register() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Sign up</h1>
                </div>
                <RegisterForm />
            </div>
        </div>
    )
}
