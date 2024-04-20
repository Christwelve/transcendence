document.getElementById('loginForm').addEventListener('submit', function(event) {
	if (!document.getElementById('username').value || !document.getElementById('password').value) {
	  event.preventDefault();
	}
  });

  document.getElementById('togglePassword').addEventListener('click', function() {
	var passwordInput = document.getElementById('password');
	var passwordButtonType = document.getElementById('togglePassword');
	if (passwordInput.type === 'password') {
	  passwordInput.type = 'text';
	  passwordButtonType.textContent = 'Hide';
	} else {
	  passwordInput.type = 'password';
	  passwordButtonType.textContent = 'Show';
	}
  });