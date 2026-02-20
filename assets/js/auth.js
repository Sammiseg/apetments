"use strict";

// Auth state
let currentUser = null;

// Load user from localStorage
function loadUser() {
  const userData = localStorage.getItem('apetments_user');
  if (userData) {
    currentUser = JSON.parse(userData);
    updateNavbar();
  }
}

// Save user to localStorage
function saveUser(user) {
  currentUser = user;
  localStorage.setItem('apetments_user', JSON.stringify(user));
  updateNavbar();
}

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem('apetments_user');
  updateNavbar();
}

// Update navbar based on auth state
function updateNavbar() {
  const loginLink = document.querySelector('.navbar-nav .nav-link[href="#login"]');
  if (!loginLink) return;

  const parent = loginLink.parentElement;

  if (currentUser) {
    // Logged in: show dropdown
    parent.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-link nav-link dropdown-toggle" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          ${currentUser.firstName} ${currentUser.lastName}
        </button>
        <ul class="dropdown-menu" aria-labelledby="profileDropdown">
          <li><a class="dropdown-item" href="#profile">Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
        </ul>
      </div>
    `;
  } else {
    // Not logged in: show login/register
    parent.innerHTML = '<a class="nav-link" href="#" onclick="showAuthModal()">Login / Register</a>';
  }
}

// Show auth modal
function showAuthModal() {
  const modalHtml = `
    <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="authModalLabel">Login / Register</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <ul class="nav nav-tabs" id="authTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button" role="tab">Login</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register" type="button" role="tab">Register</button>
              </li>
            </ul>
            <div class="tab-content mt-3" id="authTabsContent">
              <!-- Login Tab -->
              <div class="tab-pane fade show active" id="login" role="tabpanel">
                <form id="loginForm">
                  <div class="mb-3">
                    <label for="loginEmail" class="form-label">Email</label>
                    <input type="email" class="form-control" id="loginEmail" required>
                  </div>
                  <div class="mb-3">
                    <label for="loginPassword" class="form-label">Password</label>
                    <input type="password" class="form-control" id="loginPassword" required>
                  </div>
                  <button type="submit" class="btn btn-primary">Login</button>
                </form>
              </div>
              <!-- Register Tab -->
              <div class="tab-pane fade" id="register" role="tabpanel">
                <div id="registerSteps">
                  <!-- Step 1: User Info -->
                  <div id="registerStep1">
                    <form id="registerForm1">
                      <div class="mb-3">
                        <label for="firstName" class="form-label">First Name</label>
                        <input type="text" class="form-control" id="firstName" required>
                      </div>
                      <div class="mb-3">
                        <label for="lastName" class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="lastName" required>
                      </div>
                      <div class="mb-3">
                        <label for="phone" class="form-label">Phone Number</label>
                        <input type="tel" class="form-control" id="phone" required>
                      </div>
                      <div class="mb-3">
                        <label for="registerEmail" class="form-label">Email</label>
                        <input type="email" class="form-control" id="registerEmail" required>
                      </div>
                      <div class="mb-3">
                        <label for="registerPassword" class="form-label">Password</label>
                        <input type="password" class="form-control" id="registerPassword" required>
                        <small class="form-text text-muted">At least 6 characters, 1 uppercase, 1 lowercase, 1 special character (!?@#$%^&*).</small>
                      </div>
                      <button type="submit" class="btn btn-primary">Send Verification Code</button>
                    </form>
                  </div>
                  <!-- Step 2: Verification -->
                  <div id="registerStep2" style="display: none;">
                    <p>We've sent a verification code to your email. Please enter it below:</p>
                    <form id="registerForm2">
                      <div class="mb-3">
                        <label for="verificationCode" class="form-label">Verification Code</label>
                        <input type="text" class="form-control" id="verificationCode" required maxlength="6">
                      </div>
                      <button type="submit" class="btn btn-primary">Verify & Complete Registration</button>
                      <button type="button" class="btn btn-secondary ms-2" onclick="backToStep1()">Back</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('authModal');
  if (existingModal) existingModal.remove();

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('authModal'));
  modal.show();

  // Setup form handlers
  setupAuthForms();
}

// Setup form event listeners
function setupAuthForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      if (!validatePassword(password)) {
        alert('Password must be at least 6 characters long, with at least 1 uppercase letter, 1 lowercase letter, and 1 special character (!?@#$%^&*).');
        return;
      }

      // Simulate login (check localStorage)
      const users = JSON.parse(localStorage.getItem('apetments_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        saveUser(user);
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        alert('Login successful!');
      } else {
        alert('Invalid email or password');
      }
    });
  }

  // Register step 1
  const registerForm1 = document.getElementById('registerForm1');
  if (registerForm1) {
    registerForm1.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const phone = document.getElementById('phone').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;

      if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      if (!validatePassword(password)) {
        alert('Password must be at least 6 characters long, with at least 1 uppercase letter, 1 lowercase letter, and 1 special character (!?@#$%^&*).');
        return;
      }

      // Store temp data
      sessionStorage.setItem('registerData', JSON.stringify({ firstName, lastName, phone, email, password }));

      // Simulate sending verification code
      alert(`Verification code sent to ${email}. (For demo: use 123456)`);

      // Show step 2
      document.getElementById('registerStep1').style.display = 'none';
      document.getElementById('registerStep2').style.display = 'block';
    });
  }

  // Register step 2
  const registerForm2 = document.getElementById('registerForm2');
  if (registerForm2) {
    registerForm2.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('verificationCode').value;

      if (code === '123456') { // Demo code
        const registerData = JSON.parse(sessionStorage.getItem('registerData'));
        const user = {
          ...registerData,
          id: Date.now()
        };

        // Save to users
        const users = JSON.parse(localStorage.getItem('apetments_users') || '[]');
        users.push(user);
        localStorage.setItem('apetments_users', JSON.stringify(users));

        saveUser(user);
        sessionStorage.removeItem('registerData');
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        alert('Registration successful!');
      } else {
        alert('Invalid verification code');
      }
    });
  }
}

function backToStep1() {
  document.getElementById('registerStep2').style.display = 'none';
  document.getElementById('registerStep1').style.display = 'block';
}

// Add validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*?]).{6,}$/;
  return passwordRegex.test(password);
}

// Initialize
document.addEventListener('DOMContentLoaded', loadUser);