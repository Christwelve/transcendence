import Cookies from 'js-cookie'

const API_BASE_URL = "http://localhost:8000/api";

export const fetchUserData = async () => {
  const response = await fetch(`${API_BASE_URL}/user/data/`, {
    method: "GET",
    credentials: "include", // Include cookies for session-based data
  });

  if (!response.ok) {
    console.error("Failed to fetch user data:", response.statusText);
    throw new Error("An unexpected error occurred");
  }

  const user = await response.json();
  const authToken = Cookies.get('authToken');

  // Set auth token if not present
  if (!authToken && user.token) {
    Cookies.set('authToken', user.token);
  }

  return user;
};

/**
 * This replicates the two different code paths from the original App.js:
 *  1) If `authenticated` is true, it uses the same logic we had under `if (authenticated) {...}`
 *  2) Otherwise, it uses the second block of login logic, including checks for 2FA.
 */
export const userLogin = async (user, authenticated) => {
  if (authenticated) {
    // == AUTHENTICATED BRANCH ==
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      credentials: "include",
      body: user,
    });

    const userData = await response.json();

    if (!response.ok) {
      // Match original logic
      if (response.status === 400 || response.status === 404) {
        throw new Error("Wrong credentials!");
      } else if (response.status === 401) {
        throw new Error("Unable to authenticate!");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }

    return userData;

  } else {
    // == NON-AUTHENTICATED BRANCH ==
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        credentials: "include",
        body: user,
      });

      if (response.status === 400 || response.status === 404) {
        throw new Error("Wrong credentials!");
      } 
      else if (response.status === 401) {
        // This is the scenario where the backend might request 2FA
        // In the original code we were settting userStatus("2fa")
        // Here, we just throw an error so that our caller knows it’s 2FA time
        throw new Error("2fa");
      }
      else if (response.status === 200) {
        const userData = await response.json();
        return userData;
      } 
      else {
        throw new Error("An unexpected error occurred");
      }
    } catch (error) {
      console.error("Network error:", error.message);
      throw error;
    }
  }
};

export const loginWith42 = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/42/login/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to get authorization URL:", response.statusText);
    throw new Error("An unexpected error occurred");
  }

  return response.json();
};
