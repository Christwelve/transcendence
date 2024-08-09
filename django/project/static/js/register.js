window.addEventListener("load", function () {
  console.log("register.js loaded");

  var password = document.getElementById("password");
  var confirm_password = document.getElementById("password2");
  var length = document.getElementById("length");
  var letter = document.getElementById("letter");
  var capital = document.getElementById("capital");
  var number = document.getElementById("number");
  var special = document.getElementById("special");
  var validation = document.getElementById("password-validation");

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  var hasLength = false;
  var hasLetter = false;
  var hasCapital = false;
  var hasNumber = false;
  var hasSpecial = false;
  var password_val = null;
  var confirm_password_val = null;
  var valid = false;

  console.log(password);
  password.addEventListener("keyup", function () {
    password_val = password.value;

    if (password_val.length >= 12) {
      length.classList.remove("invalid");
      length.classList.add("valid");
      hasLength = true;
    } else {
      length.classList.remove("valid");
      length.classList.add("invalid");
      hasLength = false;
    }

    // Validate lowercase letters
    if (password_val.match(/[a-z]/)) {
      letter.classList.remove("invalid");
      letter.classList.add("valid");
      hasLetter = true;
    } else {
      letter.classList.remove("valid");
      letter.classList.add("invalid");
      hasLetter = false;
    }

    // Validate capital letters
    if (password_val.match(/[A-Z]/)) {
      capital.classList.remove("invalid");
      capital.classList.add("valid");
      hasCapital = true;
    } else {
      capital.classList.remove("valid");
      capital.classList.add("invalid");
      hasCapital = false;
    }

    // Validate numbers
    if (password_val.match(/[0-9]/)) {
      number.classList.remove("invalid");
      number.classList.add("valid");
      hasNumber = true;
    } else {
      number.classList.remove("valid");
      number.classList.add("invalid");
      hasNumber = false;
    }

    // Validate special characters
    if (password_val.match(/[!@#$%^&*]/)) {
      special.classList.remove("invalid");
      special.classList.add("valid");
      hasSpecial = true;
    } else {
      special.classList.remove("valid");
      special.classList.add("invalid");
      hasSpecial = false;
    }
  });


  confirm_password.addEventListener("keyup", function () {
    confirm_password_val = confirm_password.value;

    function isIdentical(password, confirm_password) {
      if (password === confirm_password) {
        console.log("Passwords match:", password, confirm_password);
        return true;
      } else {
        console.log("Passwords do not match:", password, confirm_password);
        return false;
      }
    }

    if (
      hasLength &&
      hasLetter &&
      hasCapital &&
      hasNumber &&
      hasSpecial &&
      isIdentical(password_val, confirm_password_val)
    ) {
      valid = true;
      validation.classList.add("hidden");
    } else {
      valid = false;
      validation.classList.remove("hidden");
    }
    console.log("Valid password:", valid);
  });

  var showPasswordButton = document.getElementById("togglePassword");
  var showVerifyPasswordButton = document.getElementById(
    "toggleVerifyPassword"
  );

  showPasswordButton.addEventListener("click", function () {
    if (password.type === "password") {
      password.type = "text";
      showPasswordButton.innerHTML = "Hide";
    } else {
      password.type = "password";
      showPasswordButton.innerHTML = "Show";
    }
  });

  showVerifyPasswordButton.addEventListener("click", function () {
    if (confirm_password.type === "password") {
      confirm_password.type = "text";
      showVerifyPasswordButton.innerHTML = "Hide";
    } else {
      confirm_password.type = "password";
      showVerifyPasswordButton.innerHTML = "Show";
    }
  });

  const form = document.querySelector("#registerForm");

  form.addEventListener("submit", function (event) {
	  event.preventDefault();

	  const formData = new FormData(form);
	  const csrfToken = getCookie('csrftoken');  // Assuming this function fetches the CSRF token

	  fetch("/register", {
		  method: 'POST',
		  headers: {
			  'X-CSRFToken': csrfToken,
			  'Accept': 'application/json',
		  },
		  body: formData,
	  })
	  .then(response => response.json())
	  .then(data => {
		  if (data.success) {
			  window.location.href = data.redirect_url;
		  } else {
			  console.error("Errors:", data.errors);
			  // Display errors to the user
		  }
	  })
	  .catch(error => console.error("Error:", error));
  });
});
