import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Duet",
  description: "Privacy Policy for Duet - Your couple planning companion",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "February 11, 2026";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/duet-logo.png"
            alt="Duet"
            width={200}
            height={58}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>

      <article className="prose prose-rose max-w-none">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Last updated: {lastUpdated}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Introduction
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Duet (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our couple planning application.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Information We Collect
          </h2>

          <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">
            Account Information
          </h3>
          <p className="mt-2 text-[var(--text-secondary)]">
            When you create an account, we collect:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Email address</li>
            <li>Password (stored securely using industry-standard hashing)</li>
            <li>Display name (optional)</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">
            User-Generated Content
          </h3>
          <p className="mt-2 text-[var(--text-secondary)]">
            We store content you create within the app, including:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Events and date plans</li>
            <li>Ideas and notes</li>
            <li>Comments and ratings</li>
            <li>Couple space settings</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">
            Google Calendar Data
          </h3>
          <p className="mt-2 text-[var(--text-secondary)]">
            If you choose to connect your Google Calendar, we access:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>
              <strong>Calendar list</strong> (calendar.readonly): To display your available calendars
            </li>
            <li>
              <strong>Calendar events</strong> (calendar.events): To sync events between Duet and Google Calendar
            </li>
            <li>
              <strong>Email address</strong> (userinfo.email): To link your Google account with your Duet account
            </li>
          </ul>
          <p className="mt-2 text-[var(--text-secondary)]">
            We only access calendar data when you explicitly connect your Google account and
            grant permission. You can disconnect Google Calendar at any time from your settings.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            How We Use Your Information
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We use your information to:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Provide and maintain our service</li>
            <li>Authenticate your account and keep it secure</li>
            <li>Sync your events with Google Calendar (if connected)</li>
            <li>Enable collaboration with your partner in shared spaces</li>
            <li>Send important service-related notifications</li>
            <li>Improve and develop new features</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Google API Services User Data Policy
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Duet&apos;s use and transfer of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 hover:text-rose-700 underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            Specifically, we:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Only use Google data for the features described in this policy</li>
            <li>Do not sell Google user data to third parties</li>
            <li>Do not use Google data for advertising purposes</li>
            <li>Do not transfer Google data to third parties except as necessary to provide the service</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Data Sharing and Third-Party Services
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We use the following third-party services to operate Duet:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>
              <strong>Vercel</strong>: Hosting and deployment
            </li>
            <li>
              <strong>Neon</strong>: Database storage
            </li>
            <li>
              <strong>Sentry</strong>: Error tracking and performance monitoring
            </li>
            <li>
              <strong>Google</strong>: Calendar integration (optional)
            </li>
          </ul>
          <p className="mt-2 text-[var(--text-secondary)]">
            We do not sell, rent, or share your personal information with third parties for
            marketing purposes.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Data Security
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We implement appropriate security measures to protect your information:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Passwords are hashed using industry-standard algorithms</li>
            <li>All data is transmitted over HTTPS</li>
            <li>Google OAuth tokens are encrypted at rest</li>
            <li>Session tokens are cryptographically signed</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Data Retention
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We retain your data for as long as your account is active. If you delete your
            account, we will delete your personal data within 30 days, except where we are
            required to retain it for legal purposes.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Your Rights
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            You have the right to:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Disconnect third-party integrations (like Google Calendar)</li>
            <li>Export your data</li>
          </ul>
          <p className="mt-2 text-[var(--text-secondary)]">
            To exercise these rights, please contact us using the information below.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Revoking Google Access
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            You can revoke Duet&apos;s access to your Google Calendar at any time:
          </p>
          <ol className="mt-2 list-decimal pl-6 text-[var(--text-secondary)]">
            <li>Within Duet: Go to Settings and click &quot;Disconnect&quot; next to Google Calendar</li>
            <li>
              Via Google: Visit{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-600 hover:text-rose-700 underline"
              >
                Google Account Permissions
              </a>
              {" "}and remove Duet from connected apps
            </li>
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Changes to This Policy
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page and updating the
            &quot;Last updated&quot; date.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Contact Us
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            <strong>Email</strong>: gekaluck@gmail.com
          </p>
        </section>
      </article>

      <footer className="mt-12 border-t border-[var(--panel-border)] pt-6">
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-primary)]">
            Home
          </Link>
          <Link href="/terms" className="hover:text-[var(--text-primary)]">
            Terms of Service
          </Link>
          <Link href="/login" className="hover:text-[var(--text-primary)]">
            Login
          </Link>
        </div>
      </footer>
    </main>
  );
}
