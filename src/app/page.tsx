import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CalendarCheck,
  Lightbulb,
  Heart,
  Share2,
  ArrowRight,
  MapPin,
  BookOpen,
} from "lucide-react";

import { getSessionUserId } from "@/lib/session";
import { listCoupleSpacesForUser } from "@/lib/couple-spaces";

export default async function Home() {
  const userId = await getSessionUserId();

  if (userId) {
    const spaces = await listCoupleSpacesForUser(userId);
    if (spaces.length === 0) {
      redirect("/spaces/onboarding");
    }
    redirect(`/spaces/${spaces[0]?.id}/calendar`);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ── Background gradient orbs ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* Top-right rose orb */}
        <div className="absolute -right-64 -top-64 h-[800px] w-[800px] rounded-full bg-rose-300/25 blur-[120px]" />
        {/* Top-left amber orb */}
        <div className="absolute -left-48 -top-32 h-[600px] w-[600px] rounded-full bg-amber-200/30 blur-[100px]" />
        {/* Centre-bottom pink orb */}
        <div className="absolute bottom-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-pink-200/20 blur-[100px]" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #2d2520 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Beta banner ── */}
      <div className="w-full border-b border-rose-200/60 bg-gradient-to-r from-rose-50/80 via-pink-50/80 to-amber-50/80 py-2.5 text-center text-xs font-medium text-[var(--accent-strong)] backdrop-blur-sm">
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)] align-middle" />
        Private beta — invite only
      </div>

      {/* ── Nav ── */}
      <header className="mx-auto flex max-w-5xl items-center justify-end px-6 py-5 md:px-10">
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/60"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[var(--accent-strong)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent)]"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-8 text-center md:px-10 md:pt-10">
        <Image
          src="/duet-logo.png"
          alt="Duet"
          width={300}
          height={88}
          className="mx-auto h-64 w-auto"
          priority
        />

        <h1
          className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Plan dates.{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #d94f5c 0%, #b83a48 40%, #d4944c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Remember
          </span>
          <br className="hidden sm:block" /> everything.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-muted)] md:text-xl">
          Duet is a private space for couples to plan upcoming dates, collect
          ideas, and revisit every shared memory — all in one place.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d94f5c] to-[#b83a48] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-rose-200/60 transition hover:shadow-rose-300/60 hover:brightness-110"
          >
            Create your space
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-8 py-3.5 text-base font-semibold text-[var(--text-primary)] backdrop-blur-sm transition hover:bg-white hover:shadow-md"
          >
            Log in
          </Link>
        </div>

        <p className="mt-7 text-sm text-[var(--text-tertiary)]">
          Free to get started · No credit card needed
        </p>
      </section>

      {/* ── Feature cards ── */}
      <section className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CalendarDays className="h-5 w-5 text-[var(--accent)]" />}
            iconBg="bg-[var(--accent-soft)]"
            title="Plan your next date"
            description="Schedule events, see the month at a glance, and never double-book."
          />
          <FeatureCard
            icon={
              <Lightbulb
                className="h-5 w-5"
                style={{ color: "var(--accent-secondary)" }}
              />
            }
            iconBg="bg-[#fff8f0]"
            title="Collect ideas together"
            description="A shared board for unscheduled plans. Turn any idea into a date when you're ready."
          />
          <FeatureCard
            icon={<Heart className="h-5 w-5 text-[var(--accent)]" />}
            iconBg="bg-[var(--accent-soft)]"
            title="Relive every memory"
            description="Past dates move to your archive automatically. Rate them, add photos, write notes."
          />
          <FeatureCard
            icon={<MapPin className="h-5 w-5 text-[var(--accent)]" />}
            iconBg="bg-[var(--accent-soft)]"
            title="Discover great places"
            description="Search and attach venues from Google Maps directly to any event."
          />
          <FeatureCard
            icon={
              <BookOpen
                className="h-5 w-5"
                style={{ color: "var(--accent-secondary)" }}
              />
            }
            iconBg="bg-[#fff8f0]"
            title="Notes for everything"
            description="Wishlists, reminders, inside jokes — kept together, not lost in chat."
          />
          <FeatureCard
            icon={<CalendarCheck className="h-5 w-5 text-[var(--accent)]" />}
            iconBg="bg-[var(--accent-soft)]"
            title="Google Calendar sync"
            description="Connect Google Calendar and send date night invites straight from the app."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative py-20">
        {/* Section background band */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="h-full w-full bg-gradient-to-b from-transparent via-white/50 to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <h2
            className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Three steps to your first date night
          </h2>
          <p className="mt-3 text-[var(--text-muted)]">
            Getting started takes under two minutes.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <Step
              number="1"
              title="Create your account"
              description="Sign up with just your name and email. No credit card, no hoops."
            />
            <Step
              number="2"
              title="Invite your partner"
              description="Share a 6-character code. Your partner joins your shared space instantly."
              connector
            />
            <Step
              number="3"
              title="Start planning"
              description="Add your first date, drop some ideas, and watch your space come to life."
            />
          </div>
        </div>
      </section>

      {/* ── Invite callout ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-white/70 px-8 py-14 text-center shadow-sm backdrop-blur-sm md:px-16">
          {/* Inner glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
          </div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
            <Share2 className="h-7 w-7 text-[var(--accent-strong)]" />
          </div>
          <h2
            className="mt-6 text-3xl font-semibold text-[var(--text-primary)] md:text-4xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Your partner gets an invite,
            <br />
            not an account setup headache.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--text-muted)]">
            You create the space, we give you a code. Your partner enters it
            once and they&apos;re in — no admin, no confusion.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d94f5c] to-[#b83a48] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-rose-200/60 transition hover:brightness-110"
          >
            Create your space free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-6 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  connector,
}: {
  number: string;
  title: string;
  description: string;
  connector?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {connector && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-5 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--panel-border)] to-transparent sm:block"
        />
      )}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-white text-sm font-bold text-[var(--accent-strong)] shadow-sm">
        {number}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  );
}
