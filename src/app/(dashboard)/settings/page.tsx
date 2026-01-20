"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Label, Card, Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { User, Lock, Bell, Palette, Trash2 } from "lucide-react";

type Tab = "profile" | "password" | "appearance";

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState<Tab>("profile");
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");

  const supabase = createClient();

  React.useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  React.useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
    }

    setIsSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully" });
      (e.target as HTMLFormElement).reset();
    }

    setIsSaving(false);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Apply theme
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const tabs = [
    { id: "profile" as Tab, name: "Profile", icon: User },
    { id: "password" as Tab, name: "Password", icon: Lock },
    { id: "appearance" as Tab, name: "Appearance", icon: Palette },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-48">
          <nav className="flex flex-row gap-1 lg:flex-col">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {message && (
            <div
              className={`mb-4 rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-medium">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={fullName || user?.email || "U"}
                    className="h-16 w-16"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Profile Photo
                    </p>
                    <p className="text-sm text-gray-500">
                      Photo is synced from your login provider
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <Button type="submit" isLoading={isSaving}>
                  Save Changes
                </Button>
              </form>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-medium">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" isLoading={isSaving}>
                  Update Password
                </Button>
              </form>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-medium">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Theme</Label>
                  <div className="flex gap-3">
                    {[
                      { id: "light", name: "Light" },
                      { id: "dark", name: "Dark" },
                      { id: "system", name: "System" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          handleThemeChange(option.id as "light" | "dark" | "system")
                        }
                        className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                          theme === option.id
                            ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
