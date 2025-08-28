// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, setting up contact form...');
  
  const contactForm = document.getElementById('contactForm');
  const alertMessage = document.getElementById('alertMessage');
  const submitBtn = document.getElementById('submitBtn');

  console.log('Contact form element:', contactForm);
  console.log('Alert message element:', alertMessage);
  console.log('Submit button element:', submitBtn);

  if (contactForm) {
    console.log('Adding submit event listener to contact form...');
    
    contactForm.addEventListener('submit', async function(e) {
      console.log('Form submit event triggered');
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Prevented default form submission');
      
      // Get form data
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        hp: formData.get('hp') // Honeypot field
      };

      console.log('Form data:', data);

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> SENDING...';
      
      try {
        // Get the Firebase Functions URL
        // This will be your deployed function URL
        const functionUrl = 'https://us-west1-vvscodeweb-c0453.cloudfunctions.net/contactForm';
        
        console.log('Sending request to:', functionUrl);
        console.log('Current origin:', window.location.origin);
        console.log('Form data being sent:', data);
        
        // Test if the function is reachable first
        try {
          console.log('Testing OPTIONS request...');
          const testResponse = await fetch(functionUrl, {
            method: 'OPTIONS',
            headers: {
              'Origin': window.location.origin,
            }
          });
          console.log('OPTIONS test response:', testResponse.status, testResponse.statusText);
          console.log('OPTIONS response headers:', Object.fromEntries(testResponse.headers.entries()));
        } catch (testError) {
          console.log('OPTIONS test failed:', testError);
          console.error('OPTIONS error details:', testError);
        }
        
        console.log('Sending POST request with origin:', window.location.origin);
        console.log('Making POST request...');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify(data)
        });

        console.log('Response received:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response URL:', response.url);

        const result = await response.json();
        console.log('Response body:', result);

        if (response.ok && result.ok) {
          // Success
          console.log('Form submitted successfully');
          showAlert('Your message has been sent successfully!', 'success');
          contactForm.reset();
        } else {
          // Error from API
          console.log('API returned error:', result.error);
          showAlert(result.error || 'Failed to send message. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        showAlert('Network error. Please check your connection and try again.', 'error');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa fa-paper-plane"></i> SEND MESSAGE';
      }
    });
    
    console.log('Submit event listener added successfully');
  } else {
    console.error('Contact form element not found!');
  }

  function showAlert(message, type) {
    console.log('Showing alert:', message, type);
    if (alertMessage) {
      alertMessage.textContent = message;
      alertMessage.style.display = 'block';
      alertMessage.style.color = type === 'success' ? 'green' : 'red';
      
      // Hide alert after 5 seconds
      setTimeout(() => {
        alertMessage.style.display = 'none';
      }, 5000);
    } else {
      console.error('Alert message element not found!');
    }
  }
});
