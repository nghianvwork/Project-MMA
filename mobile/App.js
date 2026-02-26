import { useState } from "react";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import ResetSuccessScreen from "./src/screens/ResetSuccessScreen";
import VerifyOtpScreen from "./src/screens/VerifyOtpScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [session, setSession] = useState(null);
  const [resetFlow, setResetFlow] = useState({
    email: "",
    resetToken: "",
  });

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onJoinNow={() => setScreen("register")}
        onLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "register") {
    return (
      <RegisterScreen
        onBackToWelcome={() => setScreen("welcome")}
        onSwitchToLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "home") {
    return <HomeScreen session={session} />;
  }

  if (screen === "forgot-password") {
    return (
      <ForgotPasswordScreen
        onBackToLogin={() => setScreen("login")}
        onOtpSent={(email) => {
          setResetFlow({
            email,
            resetToken: "",
          });
          setScreen("verify-otp");
        }}
      />
    );
  }

  if (screen === "verify-otp") {
    return (
      <VerifyOtpScreen
        email={resetFlow.email}
        onBack={() => setScreen("forgot-password")}
        onBackToLogin={() => {
          setResetFlow({
            email: "",
            resetToken: "",
          });
          setScreen("login");
        }}
        onVerified={({ email, resetToken }) => {
          setResetFlow({
            email: email || resetFlow.email,
            resetToken,
          });
          setScreen("reset-password");
        }}
      />
    );
  }

  if (screen === "reset-password") {
    return (
      <ResetPasswordScreen
        email={resetFlow.email}
        resetToken={resetFlow.resetToken}
        onBack={() => setScreen("verify-otp")}
        onBackToLogin={() => {
          setResetFlow({
            email: "",
            resetToken: "",
          });
          setScreen("login");
        }}
        onResetSuccess={() => setScreen("reset-success")}
      />
    );
  }

  if (screen === "reset-success") {
    return (
      <ResetSuccessScreen
        onBackToLogin={() => {
          setResetFlow({
            email: "",
            resetToken: "",
          });
          setScreen("login");
        }}
      />
    );
  }

  return (
    <LoginScreen
      onLoginSuccess={(nextSession) => {
        setSession(nextSession || null);
        setScreen("home");
      }}
      onForgotPassword={() => {
        setResetFlow({
          email: "",
          resetToken: "",
        });
        setScreen("forgot-password");
      }}
      onBackToRegister={() => setScreen("register")}
    />
  );
}
