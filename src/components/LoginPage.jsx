import React from "react";

import PasswordVisibilityButton from "./PasswordVisibilityButton";

export default function LoginPage({ username, password, setUsername, setPassword, login, lockUntil = 0 }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const locked = lockUntil > Date.now();

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-leaf" aria-hidden="true" />
          <h1>D-FARM</h1>
          <h2>บิลเงินสดกรณีเครื่องขัดข้อง</h2>
          <p>D-FARM CASH BILL (SYSTEM ERROR)</p>
        </div>

        <div className="login-input-row">
          <span className="login-field-icon" aria-hidden="true">⌾</span>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="login-input-row password-field">
          <span className="login-field-icon" aria-hidden="true">▢</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <PasswordVisibilityButton open={showPassword} onClick={() => setShowPassword((value) => !value)} />
        </div>

        {locked && <div className="security-note">ระบบล็อกชั่วคราว กรุณารอสักครู่</div>}
        <button className="login-submit" onClick={login} disabled={locked} type="button">
          <span aria-hidden="true">↪</span>
          Login
        </button>
      </div>
    </div>
  );
}
