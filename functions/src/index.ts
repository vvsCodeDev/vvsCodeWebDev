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
import fetch from "node-fetch";
import * as crypto from "crypto";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// Define secrets for SendGrid configuration
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
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
    cors: true,
    region: "us-central1",
  },
  async (req, res) => {
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
    secrets: [sendgridApiKey, alertEmailTo, alertEmailFrom],
    retry: true,
    region: "us-central1",
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

      // Send email via SendGrid
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: alertEmailTo.value() }],
            },
          ],
          from: { email: alertEmailFrom.value() },
          subject: subject,
          content: [
            {
              type: "text/plain",
              value: textContent,
            },
            {
              type: "text/html",
              value: htmlContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `SendGrid API error: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      console.log(`Contact email sent successfully for document ${docId}`);
    } catch (error) {
      console.error(`Failed to send contact email for document ${docId}:`, error);
      throw error; // This will trigger retry due to retry: true
    }
  }
);
