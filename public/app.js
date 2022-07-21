

const firebaseConfig = {
    apiKey: "AIzaSyDeCSSaaqBzGY7fADL8ndGAVzeJFmxAK6k",
    authDomain: "vvscodeweb-c0453.firebaseapp.com",
    databaseURL: "https://vvscodeweb-c0453-default-rtdb.firebaseio.com/",
    projectId: "vvscodeweb-c0453",
    storageBucket: "vvscodeweb-c0453.appspot.com",
    messagingSenderId: "1041652245769",
    appId: "1:1041652245769:web:9de367b7e3a9f968b55fd8",
    measurementId: "G-ZHN3DBQS3J"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//Reference contactInfo collections
let contactInfo = firebase.database().ref('info');

//Listen for submit
// document.getElementById('contact-form').addEventListener('submit', submitForm);
document.getElementById('contactForm').addEventListener('submit', submitForm);

function submitForm(e) {
    e.preventDefault();
    console.log("email form submitted");

    //get input values
    let name = getInputVal('name');
    let email = getInputVal('email');
    let subject = getInputVal('subject');
    let message = getInputVal('message');
//    let time = firebase.database.Timestamp.fromDate(new Date());


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