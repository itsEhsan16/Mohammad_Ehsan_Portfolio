"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Github, Linkedin, Twitter, AlertCircle, CheckCircle2 } from "lucide-react"
import { SectionTitle } from "./section-title"
import { useThree } from "@/contexts/three-context"
import emailjs from "@emailjs/browser"
import dynamic from "next/dynamic"

// Dynamically import Three.js components with no SSR
const ThreeSectionIndicator = dynamic(
  () => import("./three-section-indicator").then((mod) => mod.ThreeSectionIndicator),
  { ssr: false },
)

// Form validation
const validateForm = (formState) => {
  const errors = {}

  if (!formState.user_name.trim()) {
    errors.user_name = "Name is required"
  }

  if (!formState.user_email.trim()) {
    errors.user_email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.user_email)) {
    errors.user_email = "Please enter a valid email address"
  }

  if (!formState.message.trim()) {
    errors.message = "Message is required"
  }

  return errors
}

export function Contact() {
  const { isThreeEnabled } = useThree()
  const [formState, setFormState] = useState({
    user_name: "",
    user_email: "",
    message: "",
    phone: "", // Honeypot field
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if honeypot field is filled (spam bot)
    if (formState.phone) {
      // Silently reject spam submissions
      setSubmitResult({
        success: true,
        message: "Your message has been sent successfully! I'll get back to you soon.",
      })
      return
    }

    // Validate form
    const validationErrors = validateForm(formState)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      // Your actual EmailJS credentials
      const serviceId = "service_zdy1hr8"
      const templateId = "template_gak0qzl"
      const publicKey = "HGDZySatoxddY7vP6"

      const result = await emailjs.sendForm(serviceId, templateId, formRef.current, publicKey)

      if (result.status === 200) {
        setSubmitResult({
          success: true,
          message: "Your message has been sent successfully! I'll get back to you soon.",
        })
        // Reset form on success
        setFormState({ user_name: "", user_email: "", message: "", phone: "" })
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitResult({
        success: false,
        message: "Failed to send your message. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          {isMounted && isThreeEnabled ? (
            <ThreeSectionIndicator title="Contact" number="05" />
          ) : (
            <SectionTitle title="Contact" number="05" />
          )}
          <p className="text-muted-foreground max-w-2xl">
            Have a project in mind or want to discuss potential opportunities? Feel free to reach out.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
            <p className="text-muted-foreground mb-6">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:your.email@example.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  mdehsan2737@gmail.com
                </a>
              </div>

              <div className="flex gap-4">
                <a
                  href="https://github.com/itsEhsan16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-card hover:bg-card/80 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/mohammad-ehsan-23aaba290/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-card hover:bg-card/80 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/Md_Ehsan16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-card hover:bg-card/80 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field - hidden from users but bots will fill it */}
              <div className="hidden">
                <label htmlFor="phone">Phone (Do not fill this out)</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
                {/* Hidden reply_to field for EmailJS reply-to header */}
                <input
                  type="hidden"
                  name="reply_to"
                  value={formState.user_email}
                  readOnly
                />
              </div>

              <div>
                <label htmlFor="user_name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="user_name"
                  name="user_name"
                  value={formState.user_name}
                  onChange={handleChange}
                  className={errors.user_name ? "border-red-500" : ""}
                  placeholder="Your name"
                />
                {errors.user_name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.user_name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="user_email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formState.user_email}
                  onChange={handleChange}
                  className={errors.user_email ? "border-red-500" : ""}
                  placeholder="your.email@example.com"
                />
                {errors.user_email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.user_email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  className={`min-h-32 ${errors.message ? "border-red-500" : ""}`}
                  placeholder="Your message"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>

              {submitResult && (
                <div
                  className={`p-4 rounded-md mt-4 flex items-start gap-2 ${
                    submitResult.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {submitResult.success ? (
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <p>{submitResult.message}</p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
