import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Duet",
  description: "Terms of Service for Duet - Your couple planning companion",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Last updated: {lastUpdated}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Agreement to Terms
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            By accessing or using Duet (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Description of Service
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Duet is a couple planning application that allows partners to collaboratively
            plan events, share ideas, and coordinate their schedules. The Service includes
            optional integration with Google Calendar.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            User Accounts
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            To use Duet, you must:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Create an account with a valid email address</li>
            <li>Be at least 13 years of age</li>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
          </ul>
          <p className="mt-2 text-[var(--text-secondary)]">
            You are responsible for all activity that occurs under your account.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Acceptable Use
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            You agree not to:
          </p>
          <ul className="mt-2 list-disc pl-6 text-[var(--text-secondary)]">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Upload malicious content or code</li>
            <li>Impersonate another person or entity</li>
            <li>Use the Service to harass, abuse, or harm others</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            User Content
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            You retain ownership of content you create in Duet (events, ideas, notes, etc.).
            By using the Service, you grant us a limited license to store and display your
            content as necessary to provide the Service.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            You are solely responsible for the content you create and share within the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Third-Party Integrations
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Duet offers optional integration with third-party services such as Google Calendar.
            Your use of these integrations is subject to the third party&apos;s terms of service
            and privacy policy. We are not responsible for the practices of third-party services.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Disclaimer of Warranties
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
            kind, either express or implied. We do not guarantee that the Service will be
            uninterrupted, secure, or error-free.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Limitation of Liability
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            To the maximum extent permitted by law, we shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use
            of the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Termination
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We may suspend or terminate your access to the Service at any time for violation
            of these terms or for any other reason at our discretion. You may delete your
            account at any time.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Changes to Terms
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            We may modify these Terms of Service at any time. We will notify users of
            significant changes by posting a notice on the Service. Continued use of the
            Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Contact Us
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            If you have any questions about these Terms of Service, please contact us at:
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
          <Link href="/privacy" className="hover:text-[var(--text-primary)]">
            Privacy Policy
          </Link>
          <Link href="/login" className="hover:text-[var(--text-primary)]">
            Login
          </Link>
        </div>
      </footer>
    </main>
  );
}
