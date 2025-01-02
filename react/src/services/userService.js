import Cookies from 'js-cookie'
import { protocol, hostname } from '../utils/scheme'


const API_BASE_URL = `${protocol}//${hostname}/api`;

export const fetchUserData = async () => {
  const response = await fetch(`${API_BASE_URL}/user/data/`, {
    method: "GET",
    credentials: "include", // Include cookies for session-based data
    headers: {
      'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
    },
  });

  if (!response.ok) {
    let errMsg = "An unexpected error occurred";
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errMsg = errorData.error;
      }
    } catch (parseError) {
      console.error("Failed to parse error JSON:", parseError);
    }

    const err = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const user = await response.json();
  const authToken = Cookies.get('authToken');
  if (!authToken && user.token) {
    Cookies.set('authToken', user.token);
  }

  const jwtToken = Cookies.get('jwtToken');
  if (!jwtToken && user.jwtToken) {
    Cookies.set('jwtToken', user.jwtToken);
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
