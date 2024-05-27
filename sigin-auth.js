function login() {
  chrome.runtime.sendMessage({ type: 'login' });
}

document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;


  // Replace this with your actual login API call
  fetch('http://localhost:5500/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      chrome.storage.local.set({'users': username});

      login();
      console.log("heloo")
      chrome.storage.sync.set({ loggedIn: true }, function() {
        // Redirect to popup.html
        window.location.href = 'popup.html';
      });
    } else {
      document.getElementById('error-message').textContent = 'Invalid login credentials';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
  });
});



