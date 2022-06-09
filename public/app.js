require('dotenv').config();

// Import the functions you need from the SDKs you need
//import { initializeApp } from "/firebase/app";
//import { getAnalytics } from "/firebase/analytics";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDERID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//Reference contactInfo collections
let contactInfo = firebase.database().ref("info");

//Listen for submit
document.querySelector("contact-form").addEventListener("submit", submitForm);

function submitForm(e) {
    e.preventDefault();
    console.log("email form submitted");

    //get input values
    // let name = document.querySelector(".name").value;
    // let email = document.querySelector(".email").value;
    // let subject = document.querySelector(".subject").value;
    // let message = document.querySelector(".message").value;

    // saveContactInfo(name, email, subject, message);
}


//Save info to Firebase
function saveContactInfo(name, email, subject, message) {
    let newContactInfo = contactInfo.push();

    newContactInfo.set({
        name: name,
        email: email,
        subject: subject,
        message: message,
    });
}