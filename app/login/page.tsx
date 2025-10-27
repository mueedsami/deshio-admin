"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import users from "@/data/users.json";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    // Find user in users.json
    const user = users.users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      setError("Invalid username or password.");
      return;
    }

    // Clear error
    setError("");

    // Save user info to localStorage
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userId", user.id.toString());
    localStorage.setItem("userName", user.fullName);
    localStorage.setItem("userEmail", user.email);

    // Store additional role-specific data
    if (user.role === "store_manager" && user.storeId) {
      localStorage.setItem("storeId", user.storeId);
      localStorage.setItem("storeName", user.storeName || "");
    }

    if (user.role === "social_commerce_manager" && user.platforms) {
      localStorage.setItem("platforms", JSON.stringify(user.platforms));
    }

    console.log("Logged in:", user.fullName, "Role:", user.role);

    // Navigate to dashboard after login
    router.push("/dashboard");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Full-screen background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/shopping-cart.jpg"
          alt="Shopping Cart"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white/50 to-white/90"></div>
      </div>

      {/* Right-side Login Form */}
      <div className="relative z-10 ml-auto w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white backdrop-blur-sm rounded-3xl shadow-2xl p-10 space-y-6">
          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-base text-gray-500">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form Inputs */}
          <div className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
            >
              Sign In
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6 pt-4 border-t border-gray-200">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-gray-900 hover:text-gray-700 font-semibold hover:underline"
            >
              Create Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}