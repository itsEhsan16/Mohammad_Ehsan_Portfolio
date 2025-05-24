"use server"

import { z } from "zod"
import nodemailer from "nodemailer"

// Define validation schema for form data
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
})

// Type for the form data
type FormData = z.infer<typeof formSchema>

// Type for the response
type SendEmailResponse = {
  success: boolean
  message: string
}

// Create a rate limiting map to prevent spam
const rateLimitMap = new Map<string, number>()

export async function sendEmail(formData: FormData): Promise<SendEmailResponse> {
  try {
    // Validate form data
    const validatedFields = formSchema.safeParse(formData)

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed. Please check your inputs.",
      }
    }

    const { name, email, message } = validatedFields.data

    // Rate limiting check
    const userKey = `${email}-${new Date().toISOString().split("T")[0]}`
    const currentCount = rateLimitMap.get(userKey) || 0

    if (currentCount >= 5) {
      return {
        success: false,
        message: "Too many requests. Please try again tomorrow.",
      }
    }

    rateLimitMap.set(userKey, currentCount + 1)

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER || "smtp.gmail.com",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || "portfolio@example.com",
      to: process.env.EMAIL_TO || "your.email@example.com",
      subject: `Portfolio Contact: Message from ${name}`,
      replyTo: email,
      text: `
        Name: ${name}
        Email: ${email}
        
        Message:
        ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff7b00;">New message from your portfolio</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #ff7b00;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `,
    }

    // Send the email
    await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: "Your message has been sent successfully! I'll get back to you soon.",
    }
  } catch (error) {
    console.error("Error sending email:", error)

    return {
      success: false,
      message: "Failed to send your message. Please try again later.",
    }
  }
}
