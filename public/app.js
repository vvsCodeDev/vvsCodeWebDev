// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const alertMessage = document.getElementById('alertMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        hp: formData.get('hp') // Honeypot field
      };

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> SENDING...';
      
      try {
        // Get the Firebase Functions URL
        // This will be your deployed function URL
        const functionUrl = 'https://us-central1-vvscodeweb-c0453.cloudfunctions.net/contactForm';
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.ok) {
          // Success
          showAlert('Your message has been sent successfully!', 'success');
          contactForm.reset();
        } else {
          // Error from API
          showAlert(result.error || 'Failed to send message. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa fa-paper-plane"></i> SEND MESSAGE';
      }
    });
  }

  function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.style.display = 'block';
    alertMessage.style.color = type === 'success' ? 'green' : 'red';
    
    // Hide alert after 5 seconds
    setTimeout(() => {
      alertMessage.style.display = 'none';
    }, 5000);
  }
});
