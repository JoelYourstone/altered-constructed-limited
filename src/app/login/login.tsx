"use client";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function Login() {
  useEffect(() => {
    void signIn("auth0");
  }, []);
  return <div>Logging in...</div>;
}
