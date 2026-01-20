"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  BookOpen,
  Mic,
  Brain,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Rich Note Taking",
    description:
      "Create beautiful notes with our powerful editor. Format text, add headings, lists, and more.",
  },
  {
    icon: Mic,
    title: "Audio Transcription",
    description:
      "Record lectures and meetings. We'll automatically transcribe them to text using AI.",
  },
  {
    icon: Brain,
    title: "AI Study Modes",
    description:
      "Quiz yourself, get explanations, or practice with flashcards - all powered by AI.",
  },
  {
    icon: Sparkles,
    title: "Smart Organization",
    description:
      "Keep your notes organized with folders, favorites, and powerful search.",
  },
];

const benefits = [
  "Unlimited notes and folders",
  "Audio recording with AI transcription",
  "AI-powered study assistant",
  "Cloud sync across devices",
  "Dark mode support",
  "Mobile-friendly design",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-blue-600"
          >
            <BookOpen className="h-6 w-6" />
            KnoFlo
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
          Study smarter,{" "}
          <span className="text-blue-600">not harder</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          KnoFlo is your all-in-one study companion. Take notes, record lectures,
          and use AI to quiz yourself - all in one place.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
          Everything you need to ace your studies
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600 dark:text-gray-400">
          Powerful features designed specifically for students who want to learn
          more effectively.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-blue-600 py-20 dark:bg-blue-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Why students love KnoFlo
              </h2>
              <p className="mt-4 text-blue-100">
                Join thousands of students who are already studying smarter with
                KnoFlo.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-900">
              <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Get started for free
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Create your account in seconds and start taking smarter notes
                today.
              </p>
              <Link href="/signup">
                <Button className="w-full" size="lg">
                  Create Free Account
                </Button>
              </Link>
              <p className="mt-4 text-center text-sm text-gray-500">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-blue-600"
            >
              <BookOpen className="h-5 w-5" />
              KnoFlo
            </Link>
            <p className="text-sm text-gray-500">
              Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
