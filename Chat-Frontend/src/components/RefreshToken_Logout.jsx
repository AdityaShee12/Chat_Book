import React from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, refreshAccessToken } from "../services/userService"; // Import your service functions

const Setting = () => {
  const navigate = useNavigate();

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("Logged out successfully");
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle Refresh Token
  const handleRefreshToken = async () => {
    try {
      const response = await refreshAccessToken();
      const { accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken); // Save new access token
      console.log("Access token refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh access token:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600">
      <h1 className="text-4xl font-bold text-white mb-6">User Actions</h1>

      {/* Refresh Token Button */}
      <button
        onClick={handleRefreshToken}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg mb-4 transition duration-300 ease-in-out transform hover:scale-105">
        Refresh Access Token
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
        Logout
      </button>
    </div>
  );
};

export default Setting;
