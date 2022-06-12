

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