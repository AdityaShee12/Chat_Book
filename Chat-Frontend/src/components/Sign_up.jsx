import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/userService";
import { API } from "../Backend_API";

const Sign_up = () => {
  const [step1, setStep1] = useState(true);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verif, setVerif] = useState(true);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registeremail, setregisterEmail] = useState("");
  const [otpVerified, setotpVerified] = useState(false);
  // Sign_up
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [about, setAbout] = useState();
  const [coverImage, setCoverImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const login = () => {
    window.open("http://localhost:8000/auth/google", "_self");
  };

  const sendOtp = async () => {
    try {
      const response = await axios.post(`${API}/api/v1/users/otp`, { email });
      console.log(response);
      console.log(response.data.data.email);
      console.log(response.data.data.otp);
      setVerifyOtp(response.data.data.otp);
      setregisterEmail(response.data.data.email);
      setOtpSent(true);
      setVerif(false);
    } catch (error) {
      console.error("Try again", error);
    }
  };
  const verify = () => {
    console.log(otp, verifyOtp);

    if (otp === verifyOtp) {
      console.log("V", registeremail);
      setOtpSent(false);
      setotpVerified(true);
    } else {
      console.log("You gave the wrong OTP");
    }
  };
  const signIn = () => {
    navigate("/sign_in");
  };
  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("about", about);
    if (avatar) formData.append("avatar", avatar);
    try {
      console.log("Form Data", [...formData]);
      console.log(email);
      const response = await registerUser(formData);
      console.log(response);
      const userName = response.data.fullName;
      const userId = response.data._id;
      navigate("/layout", { state: { userId, userName } });
    } catch (error) {
      // Detailed error handling
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Error Response:", error.response);
        setErrorMessage(
          `Error: ${error.response.data.message || "Something went wrong"}`
        );
      } else if (error.request) {
        // Request was made but no response was received
        console.error("Error Request:", error.request);
        setErrorMessage("No response from server. Please try again.");
      } else {
        // Something else happened while setting up the request
        console.error("Error Message:", error.message);
        setErrorMessage(error.message);
      }
    }
  };
  const step2 = () => {
    setStep1(false);
  };
  return (
    <div className="h-screen p-4 flex flex-col items-center justify-center space-y-4">
      {/* Main Signup/Login Box */}
      <div className="max-w-xs sm:max-w-sm md:max-w-md w-full p-8 rounded-xl flex flex-col items-center border border-gray-300">
        <h1 className="text-4xl text-center font-bold mb-4 font-mono">
          Chat_Book
        </h1>
        <p className="text-lg text-center mb-6 font-mono">
          Sign up to experience seamless chatting, file sharing, video calls,
          and upload stories.
        </p>{" "}
        {step1 === true && (
          <>
            {verif && (
              <button
                onClick={login}
                className="mb-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Login with Google
              </button>
            )}
            {verif && (
              <div className="flex flex-col space-y-4 w-full">
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none bg-slate-100"
                />
                <button
                  onClick={sendOtp}
                  className="w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300 text-center">
                  Send OTP
                </button>
              </div>
            )}
            {otpSent && (
              <div className="w-full mt-4">
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter your OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none bg-slate-100"
                />
                <button
                  onClick={verify}
                  className="mt-3 w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300 text-center">
                  Verify OTP
                </button>
              </div>
            )}
            {otpVerified && (
              <>
                <div className="w-full mt-4">
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="w-full mt-4">
                  <input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="w-full mt-4">
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300 text-center"
                  onClick={step2}>
                  Next
                </button>
              </>
            )}
          </>
        )}
        {step1 === false && (
          <>
            <div className="w-full flex flex-col items-center mt-6">
              <label className="relative cursor-pointer">
                <div className="w-32 h-32 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center shadow-md">
                  {avatar ? (
                    <img
                      src={URL.createObjectURL(avatar)}
                      alt="Avatar"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">Upload</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Write something about yourself..."
                className="mt-4 w-full p-2 border border-gray-300 rounded shadow-sm resize-none"
                rows={4}
              />
              <button
                onClick={handleRegister}
                className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow">
                Sign up
              </button>
            </div>
          </>
        )}
        <button
          onClick={signIn}
          className="mt-4 w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300 text-center">
          Sign in
        </button>
      </div>

      {/* "Have an account? Log in" Box */}
      <div className="max-w-xs sm:max-w-sm md:max-w-md w-full p-4 rounded-xl flex items-center justify-center border border-gray-300 text-gray-700 text-center">
        Have an account?{" "}
        <a href="/sign_in" className="ml-1 text-blue-500 hover:underline">
          Log in
        </a>
      </div>
    </div>
  );
};

export default Sign_up;
