#!/bin/bash

echo "🚀 vvsCode SendGrid Email Alert System Setup"
echo "=============================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

echo "📋 Next steps to complete setup:"
echo ""

echo "1. 🔑 Set Firebase Secrets (run these commands one by one):"
echo "   firebase functions:secrets:set SENDGRID_API_KEY"
echo "   firebase functions:secrets:set ALERT_EMAIL_TO"
echo "   firebase functions:secrets:set ALERT_EMAIL_FROM"
echo "   firebase functions:secrets:set IP_SALT"
echo ""

echo "2. 🚀 Deploy Functions:"
echo "   firebase deploy --only functions"
echo ""

echo "3. 🌐 Deploy Everything:"
echo "   firebase deploy"
echo ""

echo "4. 🔧 Update Function URL:"
echo "   After deployment, update the functionUrl in public/app.js with your actual project ID"
echo ""

echo "5. 📧 Test the Contact Form:"
echo "   Submit a test message and check:"
echo "   - Firestore for new document"
echo "   - Function logs for email sending"
echo "   - Your inbox for the alert email"
echo ""

echo "📚 For detailed instructions, see README.md"
echo "🔍 For troubleshooting, see the troubleshooting section in README.md"
echo ""

echo "🎯 Current Firebase Project:"
firebase projects:list | grep "vvscodeweb-c0453" || echo "   Project ID: vvscodeweb-c0453"
echo ""

echo "✨ Setup script completed!"
