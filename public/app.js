

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
firebase.initializeApp(firebaseConfig);

//Reference contactInfo collections
let contactInfo = firebase.database().ref('info');

//Listen for submit
document.getElementById('contact-form').addEventListener('submit', submitForm);

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
    document.getElementById('contact-form').reset();
}

// Function to get form value
function getInputVal(id){
    return document.getElementById(id).value;
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