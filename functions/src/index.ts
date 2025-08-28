/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import * as crypto from "crypto";
import { Resend } from "resend";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// Define secrets for email configuration
const resendApiKey = defineSecret("RESEND_API_KEY");
const alertEmailTo = defineSecret("ALERT_EMAIL_TO");
const alertEmailFrom = defineSecret("ALERT_EMAIL_FROM");
const ipSalt = defineSecret("IP_SALT");

// Interface for contact message document
interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  status: string;
  meta: {
    ua: string;
    referer: string;
  };
  ipHash: string;
  honeypotHit: boolean;
}

// HTTP endpoint for contact form submission
export const contactForm = onRequest(
  {
    secrets: [ipSalt],
    cors: false,
    region: "us-west1",
  },
  async (req, res) => {
    // Handle CORS manually - allow multiple origins for development and production
    const allowedOrigins = [
      'https://vvscodeweb-c0453.web.app',
      'https://vvscodeweb-c0453.firebaseapp.com',
      'http://localhost:5000',
      'http://localhost:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000'
    ];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    } else {
      // Fallback to production origin for security
      res.set('Access-Control-Allow-Origin', 'https://vvscodeweb-c0453.web.app');
    }
    
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { name, email, subject, message, hp } = req.body;

      // Honeypot check - if hp field is filled, silently return success
      if (hp) {
        console.log("Honeypot field filled, dropping bot submission");
        res.status(200).json({ ok: true });
        return;
      }

      // Basic validation
      if (!name || !email || !subject || !message) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Extract headers for metadata
      const userAgent = req.headers["user-agent"] || "Unknown";
      const referer = req.headers["referer"] || "Unknown";
      
      // Get IP address and hash it
      const ip = req.headers["x-forwarded-for"] || 
                 req.connection?.remoteAddress || 
                 req.socket?.remoteAddress || 
                 "Unknown";
      
      const ipHash = crypto
        .createHash("sha256")
        .update(ip + ipSalt.value())
        .digest("hex");

      // Create contact message document
      const contactData: ContactMessage = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date(),
        status: "received",
        meta: {
          ua: userAgent,
          referer: referer,
        },
        ipHash,
        honeypotHit: false,
      };

      // Write to Firestore
      const docRef = await db.collection("contactMessages").add(contactData);
      
      console.log(`Contact message created with ID: ${docRef.id}`);

      res.status(200).json({ 
        ok: true, 
        messageId: docRef.id 
      });

    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Firestore trigger: when a new contact message is created
export const onContactMessageCreated = onDocumentCreated(
  {
    document: "contactMessages/{docId}",
    secrets: [resendApiKey, alertEmailTo, alertEmailFrom],
    retry: true,
    region: "us-west1",
  },
  async (event) => {
    const docId = event.params.docId;
    const data = event.data?.data() as ContactMessage;

    if (!data) {
      console.error(`No data found for document ${docId}`);
      return;
    }

          // Skip if this was a honeypot hit
      if (data.honeypotHit) {
        console.log(`Skipping honeypot hit for document ${docId}`);
        return;
      }
      
      console.log(`Processing contact message for document ${docId}:`, {
        name: data.name,
        email: data.email,
        subject: data.subject,
        honeypotHit: data.honeypotHit
      });

    try {
      // Prepare email content
      const subject = `📨 Contact: ${data.subject} — ${data.name}`;
      const textContent = `
New contact message from vvsCode.net

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent at: ${data.createdAt?.toDate?.() || new Date().toISOString()}
User Agent: ${data.meta?.ua || 'Unknown'}
Referer: ${data.meta?.referer || 'Unknown'}
IP Hash: ${data.ipHash}
      `.trim();

      const htmlContent = `
<h2>New contact message from vvsCode.net</h2>
<p><strong>Name:</strong> ${data.name}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<p><strong>Message:</strong></p>
<p>${data.message.replace(/\n/g, '<br>')}</p>
<hr>
<p><em>Sent at: ${data.createdAt?.toDate?.() || new Date().toISOString()}</em></p>
<p><em>User Agent: ${data.meta?.ua || 'Unknown'}</em></p>
<p><em>Referer: ${data.meta?.referer || 'Unknown'}</em></p>
<p><em>IP Hash: ${data.ipHash}</em></p>
      `.trim();

      // Send email via Resend
      console.log(`Attempting to send email via Resend to: ${alertEmailTo.value()}`);
      console.log(`From email: ${alertEmailFrom.value()}`);
      
      const resend = new Resend(resendApiKey.value());
      
      const { data: emailData, error } = await resend.emails.send({
        from: "onboarding@resend.dev", // Use Resend's verified domain
        to: ["justin@vvscode.net"], // Send to vvscode.net
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      if (error) {
        console.error(`Resend API error:`, error);
        throw new Error(`Resend API error: ${error.message}`);
      }
      
      console.log('Resend email sent successfully:', emailData);

      console.log(`Contact email sent successfully for document ${docId}`);
    } catch (error) {
      console.error(`Failed to send contact email for document ${docId}:`, error);
      throw error; // This will trigger retry due to retry: true
    }
  }
);
