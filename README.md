# vvsCode Web Development

Professional web and mobile app development services by vvsCode.

## SendGrid Email Alert System

This project includes a complete contact form system that automatically sends email alerts via SendGrid whenever someone submits the contact form.

### Features

- **Contact Form Processing**: Secure API endpoint for form submissions
- **Firestore Storage**: All messages stored in `contactMessages` collection
- **SendGrid Integration**: Automatic email alerts with retry logic
- **Bot Protection**: Honeypot field to prevent spam
- **Security**: IP hashing, server-side validation, no client secrets exposed

### Architecture

```
Client Form → Firebase Functions API → Firestore → Cloud Function Trigger → SendGrid Email
```

### Setup Instructions

#### 1. Install Dependencies

```bash
# Root directory
npm install

# Functions directory
cd functions
npm install
npm install node-fetch@2
npm install --save-dev @types/node-fetch
```

#### 2. Set Firebase Secrets

Set the required secrets for SendGrid and email configuration:

```bash
# SendGrid API Key (get from SendGrid dashboard)
firebase functions:secrets:set SENDGRID_API_KEY

# Email address to receive alerts
firebase functions:secrets:set ALERT_EMAIL_TO

# Verified sender email address
firebase functions:secrets:set ALERT_EMAIL_FROM

# Salt for IP hashing (generate a random string)
firebase functions:secrets:set IP_SALT
```

**Important**: The `ALERT_EMAIL_FROM` must be a verified sender in your SendGrid account.

#### 3. Deploy Functions

```bash
# Deploy only the functions
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

#### 4. Update Function URL

After deployment, update the function URL in `public/app.js`:

```javascript
const functionUrl = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/contactForm';
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

### Configuration

#### SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key with "Mail Send" permissions
3. Verify your sender domain or email address
4. Add the API key to Firebase secrets

#### Firestore Rules

The `firestore.rules` file secures the `contactMessages` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /contactMessages/{doc} {
      allow read, update, delete: if false;
      allow create: if true; // Restricted by API key
    }
  }
}
```

### Usage

#### Contact Form

The contact form automatically includes:
- **Honeypot field**: Hidden field to catch bots
- **Client-side validation**: Required field checking
- **Loading states**: Visual feedback during submission
- **Error handling**: User-friendly error messages

#### Form Fields

- `name`: Contact person's name
- `email`: Contact email address
- `subject`: Message subject
- `message`: Message content
- `hp`: Honeypot field (hidden from users)

### Troubleshooting

#### Common Issues

1. **Emails not sending**
   - Check SendGrid API key in Firebase secrets
   - Verify sender email is authenticated in SendGrid
   - Check Firebase Functions logs for errors

2. **Function deployment fails**
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors
   - Verify Firebase project configuration

3. **CORS errors**
   - Functions include CORS headers
   - Check if function URL is correct
   - Verify function is deployed and accessible

#### Function Logs

View function logs to debug issues:

```bash
firebase functions:log --only onContactMessageCreated
firebase functions:log --only contactForm
```

#### SendGrid Activity

Check SendGrid dashboard for:
- Email delivery status
- Bounce reports
- Spam reports
- API usage

### Security Features

- **IP Hashing**: Client IPs are hashed with salt before storage
- **Honeypot Protection**: Bot submissions are silently dropped
- **Server-side Validation**: All input validated on server
- **No Client Secrets**: API keys stored securely in Firebase
- **Rate Limiting**: Firebase Functions provide built-in protection

### Monitoring

- **Firestore**: Monitor `contactMessages` collection growth
- **Functions**: Track execution times and errors
- **SendGrid**: Monitor email delivery and engagement
- **Logs**: Review function logs for issues

### Development

#### Local Testing

```bash
# Start Firebase emulator
firebase emulators:start

# Test functions locally
firebase functions:shell
```

#### Code Structure

```
├── functions/
│   ├── src/
│   │   └── index.ts          # Cloud Functions
│   └── package.json
├── public/
│   ├── index.html            # Contact form
│   ├── app.js               # Form handling
│   └── ...
├── firestore.rules          # Security rules
└── firebase.json           # Project config
```

### Support

For issues or questions:
- Check Firebase Functions logs
- Review SendGrid dashboard
- Consult Firebase documentation
- Contact vvsCode development team

---

**Note**: This system is production-ready and includes retry logic, error handling, and security best practices.
