// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcSNvPWRrz3uxqandnEeIfG8NzyEd6NMA",
  authDomain: "vcwi-115c6.firebaseapp.com",
  databaseURL: "https://vcwi-115c6-default-rtdb.firebaseio.com",
  projectId: "vcwi-115c6",
  storageBucket: "vcwi-115c6.appspot.com",
  messagingSenderId: "625669501307",
  appId: "1:625669501307:web:0eb55bf4cb881610b20dde",
  measurementId: "G-H6M403YJWG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//Reference contactInfo collections
let contactInfo = firebase.database().ref('info');

//Listen for submit
document.getElementById("contact-form").addEventListener("submit", submitForm);

function submitForm(e) {
    e.preventDefault();
    //console.log("email form submitted");

    //get input values
    let name = getInputVal('name');
    let email = getInputVal('email');
    let subject = getInputVal('subject');
    let message = getInputVal('message');

    saveContactInfo(name, email, subject, message);

    // Show alert
    document.querySelector('.alert').style.display = 'block';

    // Hide alert after 3 seconds
    setTimeout(function(){
        document.querySelector('.alert').style.display = 'none';
    },3000);

    // Clear form
    document.getElementById('contactForm').reset();
}


//Save info to Firebase
function saveContactInfo(name, email, subject, message) {
    let newContactInfo = contactInfo.push();

    newContactInfo.set({
        name: name,
        email: email,
        subject: subject,
        message: message
    });
}