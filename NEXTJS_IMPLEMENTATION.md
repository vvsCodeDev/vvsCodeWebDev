# Next.js 15 Implementation (Future Migration)

This document contains the Next.js 15 (App Router) + TypeScript implementation for the SendGrid email alert system.

## Project Structure

```
src/
├── app/
│   └── api/
│       └── contact/
│           └── route.ts          # API route for contact form
├── lib/
│   └── firebaseAdmin.ts          # Firebase Admin initialization
└── components/
    └── ContactForm.tsx           # React contact form component
```

## 1. Firebase Admin Setup

### `src/lib/firebaseAdmin.ts`

```typescript
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin in a singleton guard
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminApp = getApps()[0];
export const adminDb = getFirestore(adminApp);

// Helper function to get Firestore instance
export const getFirestoreInstance = () => adminDb;
```

## 2. API Route

### `src/app/api/contact/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirestoreInstance } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  hp: z.string().optional(), // Honeypot field
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, email, subject, message, hp } = validation.data;

    // Honeypot check
    if (hp) {
      console.log('Honeypot field filled, dropping bot submission');
      return NextResponse.json({ ok: true });
    }

    // Extract headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Unknown';
    
    // Get IP and hash it
    const ip = request.headers.get('x-forwarded-for') || 
               request.ip || 
               'Unknown';
    
    const ipHash = crypto
      .createHash('sha256')
      .update(ip + (process.env.IP_SALT || 'default-salt'))
      .digest('hex');

    // Create contact message
    const contactData = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date(),
      status: 'received',
      meta: {
        ua: userAgent,
        referer: referer,
      },
      ipHash,
      honeypotHit: false,
    };

    // Write to Firestore
    const db = getFirestoreInstance();
    const docRef = await db.collection('contactMessages').add(contactData);
    
    console.log(`Contact message created with ID: ${docRef.id}`);

    return NextResponse.json({ 
      ok: true, 
      messageId: docRef.id 
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 3. React Contact Form Component

### `src/components/ContactForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      // Add honeypot field
      const dataWithHoneypot = {
        ...formData,
        hp: '', // Empty honeypot field
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithHoneypot),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        setAlert({
          type: 'success',
          message: 'Your message has been sent successfully!',
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setAlert({
          type: 'error',
          message: result.error || 'Failed to send message. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setAlert({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="w3-container w3-padding-32 w3-center">
      <h2 className="w3-border-bottom w3-border-light-grey w3-padding-16">Contact</h2>
      <p>Let's get in touch and talk about your next project</p>
      
      {alert && (
        <div 
          className={`alert ${alert.type === 'success' ? 'w3-green' : 'w3-red'}`}
          style={{ marginBottom: '20px' }}
        >
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <input
          className="w3-input w3-border w3-padding-16"
          type="text"
          placeholder="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ marginBottom: '16px' }}
        />
        
        <input
          className="w3-input w3-border w3-padding-16"
          type="email"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ marginBottom: '16px' }}
        />
        
        <input
          className="w3-input w3-border w3-padding-16"
          type="text"
          placeholder="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          style={{ marginBottom: '16px' }}
        />
        
        <textarea
          className="w3-input w3-border w3-padding-16"
          placeholder="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          style={{ marginBottom: '16px' }}
        />

        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="hp"
          style={{ 
            position: 'absolute', 
            left: '-9999px',
            visibility: 'hidden'
          }}
          tabIndex={-1}
          autoComplete="off"
        />

        <button
          className="w3-button w3-black w3-section"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="fa fa-spinner fa-spin"></i> SENDING...
            </>
          ) : (
            <>
              <i className="fa fa-paper-plane"></i> SEND MESSAGE
            </>
          )}
        </button>
      </form>
    </div>
  );
}
```

## 4. Environment Variables

### `.env.local`

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# IP Hashing
IP_SALT=your-random-salt-string

# SendGrid (if using direct API calls instead of Cloud Functions)
SENDGRID_API_KEY=your-sendgrid-api-key
ALERT_EMAIL_TO=justin@vvscode.net
ALERT_EMAIL_FROM=noreply@vvscode.net
```

## 5. Dependencies

### `package.json` additions

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "firebase-admin": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

## 6. Usage in Page

### `src/app/page.tsx`

```typescript
import ContactForm from '@/components/ContactForm';

export default function HomePage() {
  return (
    <main>
      {/* Other content */}
      <ContactForm />
      {/* Other content */}
    </main>
  );
}
```

## Key Differences from Firebase Functions

1. **API Route**: Uses Next.js App Router instead of Firebase Functions
2. **Firebase Admin**: Direct initialization instead of Cloud Functions environment
3. **Environment Variables**: Uses `.env.local` instead of Firebase secrets
4. **Component-based**: React component with hooks instead of vanilla JS
5. **Type Safety**: Full TypeScript support with Zod validation

## Migration Steps

1. Install Next.js dependencies
2. Copy the component and API route files
3. Set up environment variables
4. Update Firebase Admin configuration
5. Test the form submission
6. Deploy to your hosting platform

## Benefits of Next.js Approach

- **Better Type Safety**: Full TypeScript support
- **Server-side Rendering**: Better SEO and performance
- **API Routes**: Built-in API endpoints
- **React Ecosystem**: Rich component libraries
- **Development Experience**: Hot reloading, better debugging
- **Deployment**: Multiple hosting options (Vercel, Netlify, etc.)
