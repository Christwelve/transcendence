import Cookies from 'js-cookie'

const API_BASE_URL = "http://localhost:8000/api";

export const fetchUserData = async () => {
  const response = await fetch(`${API_BASE_URL}/user/data/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  const userData = await response.json();
  const authToken = Cookies.get('authToken');
  if (!authToken) {
    Cookies.set('authToken', userData.token);
  }

  return userData;
};

export const loginUser = async (user) => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: "POST",
    credentials: "include",
    body: user,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }

  return response.json();
};

export const loginWith42 = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/42/login/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get authorization URL");
  }

  return response.json();
};
