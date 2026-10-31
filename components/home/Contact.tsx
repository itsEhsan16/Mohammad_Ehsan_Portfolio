"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Icon } from "@/components/ui/Icon";
import { CopyEmail } from "@/components/chrome/FooterBits";
import { chime, click } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface FormState {
  user_name: string;
  user_email: string;
  message: string;
  phone: string; // honeypot
}
type Errors = Partial<Record<"user_name" | "user_email" | "message", string>>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const SUCCESS = "Your message has been sent successfully! I'll get back to you soon.";

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.user_name.trim()) e.user_name = "Name is required";
  if (!f.user_email.trim()) e.user_email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.user_email)) e.user_email = "Please enter a valid email address";
  if (!f.message.trim()) e.message = "Message is required";
  return e;
}

/**
 * Contact form — same EmailJS contract as v1 (fields user_name, user_email,
 * message, reply_to + the `phone` honeypot). EmailJS is loaded on submit.
 */
export function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>({ user_name: "", user_email: "", message: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof Errors]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    click();
    if (form.phone) {
      setStatus({ kind: "sent" }); // silently drop bots
      return;
    }
    const v = validate(form);
    if (Object.keys(v).length) {
      setErrors(v);
      const first = Object.keys(v)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      // not configured (e.g. preview deploys): hand off to the mail app instead of failing
      const body = encodeURIComponent(`${form.message}\n\n— ${form.user_name} (${form.user_email})`);
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Hello from ${form.user_name}`)}&body=${body}`;
      setStatus({ kind: "error", message: "The form isn't configured here — opening your email app instead." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const emailjs = (await import("@emailjs/browser")).default;
      const res = await emailjs.sendForm(serviceId, templateId, formRef.current!, {
        publicKey,
        limitRate: { id: "contact", throttle: 10000 },
      });
      if (res.status !== 200) throw new Error(`EmailJS ${res.status}`);
      setStatus({ kind: "sent" });
      setForm({ user_name: "", user_email: "", message: "", phone: "" });
      chime();
    } catch (err) {
      console.warn("Contact form failed", err);
      setStatus({ kind: "error", message: "Failed to send your message. Please try again later." });
    }
  };

  const field = "peer w-full border-0 border-b border-fg/40 bg-transparent px-0 pb-3 pt-2 text-[clamp(1.1rem,1.6vw,1.45rem)] text-fg placeholder:text-faint focus:border-signal focus:outline-none focus:ring-0 transition-colors";

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative px-gutter py-[clamp(6rem,12vw,11rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel index="06" title="Contact" />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <SplitReveal as="h2" type="lines" id="contact-title" className="t-display text-huge">
            Let&apos;s build something <span className="t-serif normal-case text-signal-text">worth shipping.</span>
          </SplitReveal>
        </div>
      </div>

      <div className="mt-[clamp(3rem,6vw,5rem)] grid grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 space-y-6 lg:col-span-4 lg:col-start-1">
          <p className="max-w-[40ch] text-[17px] leading-relaxed text-fg/85">
            Have a project in mind or want to discuss potential opportunities? Feel free to reach out.
          </p>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">
            I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
          </p>
          <div className="pt-2">
            <p className="t-label mb-3 text-muted">Or write directly</p>
            <CopyEmail />
          </div>
          <ul className="t-label flex flex-wrap gap-x-5 gap-y-2 pt-2 text-fg/85">
            {site.socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-signal-text">
                  {s.label} <Icon name="arrow-up-right" size={11} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="col-span-12 space-y-8 lg:col-span-7 lg:col-start-6"
          aria-describedby="form-status"
        >
          {/* honeypot — hidden from people, irresistible to bots */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="phone">Phone (Do not fill this out)</label>
            <input type="text" id="phone" name="phone" value={form.phone} onChange={onChange} tabIndex={-1} autoComplete="off" />
            <input type="hidden" name="reply_to" value={form.user_email} readOnly />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Field label="01 — Your name" error={errors.user_name} htmlFor="user_name">
              <input id="user_name" name="user_name" autoComplete="name" value={form.user_name} onChange={onChange} placeholder="Jane Doe" className={field} aria-invalid={!!errors.user_name} aria-describedby={errors.user_name ? "user_name-err" : undefined} />
            </Field>
            <Field label="02 — Your email" error={errors.user_email} htmlFor="user_email">
              <input id="user_email" name="user_email" type="email" autoComplete="email" value={form.user_email} onChange={onChange} placeholder="jane@company.com" className={field} aria-invalid={!!errors.user_email} aria-describedby={errors.user_email ? "user_email-err" : undefined} />
            </Field>
          </div>
          <Field label="03 — Tell me about it" error={errors.message} htmlFor="message">
            <textarea id="message" name="message" rows={4} value={form.message} onChange={onChange} placeholder="A launch page, a web app, a role…" className={cn(field, "resize-none")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-err" : undefined} />
          </Field>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="t-label group inline-flex items-center gap-3 rounded-full bg-signal px-7 py-4 text-[12px] font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {status.kind === "sending" ? "Sending…" : "Send message"}
              <Icon name="arrow-up-right" size={14} className="transition-transform group-hover:rotate-45" />
            </button>
            <p id="form-status" role="status" aria-live="polite" className={cn("t-label text-[11px]", status.kind === "error" ? "text-signal-text" : "text-muted")}>
              {status.kind === "sent" ? `✓ ${SUCCESS}` : status.kind === "error" ? status.message : "Usually replies within a couple of days."}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="t-label block text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-err`} className="t-label mt-2 text-[11px] text-signal-text">
          {error}
        </p>
      )}
    </div>
  );
}
