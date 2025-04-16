import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { registerUser } from "../services/userService";
import axios from "axios";

// Import the API function

const Sign = () => {
  // Otp

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registeremail, setregisterEmail] = useState("");
  const [otpVerified, setotpVerified] = useState(false);
  // Sign_up

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  // const [email, setEmail] = useState("");
  let status = "";
  let socketId = "";

  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/auth/user", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const login = () => {
    window.open("http://localhost:8000/auth/google", "_self");
  };

  const logout = () => {
    axios
      .get("http://localhost:8000/auth/logout", { withCredentials: true })
      .then(() => setUser(null));
  };

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("avatar", avatar);
    formData.append("coverImage", coverImage);
    formData.append("status", status);
    formData.append("socketId", socketId);
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

  // Otp function

  const sendOtp = async () => {
    try {
      const response = await axios.post("/api/v1/users/otp", { email });
      console.log(response);
      console.log(response.data.data.email);
      console.log(response.data.data.otp);
      setVerifyOtp(response.data.data.otp);
      setregisterEmail(response.data.data.email);
      setOtpSent(true);
    } catch (error) {
      console.error("Try again", error);
    }
  };

  const verify = () => {
    console.log(otp, verifyOtp);

    if (otp === verifyOtp) {
      console.log("V", registeremail);
      setotpVerified(true);
    } else {
      console.log("You gave the wrong OTP");
    }
  };

  // JSX

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to bg-indigo-400 p-4">
      <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Your Account
        </h2>
        

        {/* Email Input & OTP Verification */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={sendOtp}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">
            Send OTP
          </button>
        </div>

        {/* OTP Verification */}
        {otpSent && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="otp">
              OTP
            </label>
            <input
              id="otp"
              type="text"
              placeholder="Enter your OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={verify}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">
              Verify OTP
            </button>
          </div>
        )}

        {/* OTP Verified Hole Nicher Fields Show Hobe */}
        {otpVerified && (
          <>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="avatar">
                Avatar
              </label>
              <input
                id="avatar"
                type="file"
                onChange={(e) => setAvatar(e.target.files[0])}
                accept="image/*"
                className="w-full text-gray-700"
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="coverImage">
                Cover Image
              </label>
              <input
                id="coverImage"
                type="file"
                onChange={(e) => setCoverImage(e.target.files[0])}
                accept="image/*"
                className="w-full text-gray-700"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300"
              onClick={handleRegister}>
              Register
            </button>
          </>
        )}

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login here
          </a>
        </p>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default Sign;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useLocation } from "react-router-dom";
// import { registerUser } from "../services/userService";
// import axios from "axios";

// // Import the API function

// const Sign = () => {
//   // Otp

//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [verifyOtp, setVerifyOtp] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [registeremail, setregisterEmail] = useState("");
//   const [otpVerified, setotpVerified] = useState(false);
//   // Sign_up

//   const [fullName, setFullName] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [avatar, setAvatar] = useState(null);
//   const [coverImage, setCoverImage] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const navigate = useNavigate();
//   const location = useLocation();
//   // const [email, setEmail] = useState("");
//   let status = "";
//   let socketId = "";

//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     axios
//       .get("http://localhost:8000/auth/user", { withCredentials: true })
//       .then((res) => setUser(res.data))
//       .catch(() => setUser(null));
//   }, []);

//   const login = () => {
//     window.open("http://localhost:8000/auth/google", "_self");
//   };

//   const logout = () => {
//     axios
//       .get("http://localhost:8000/auth/logout", { withCredentials: true })
//       .then(() => setUser(null));
//   };

//   useEffect(() => {
//     if (location.state?.email) {
//       setEmail(location.state.email);
//     }
//   }, [location.state]);

//   const handleRegister = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("fullName", fullName);
//     formData.append("username", username);
//     formData.append("email", email);
//     formData.append("password", password);
//     formData.append("avatar", avatar);
//     formData.append("coverImage", coverImage);
//     formData.append("status", status);
//     formData.append("socketId", socketId);
//     try {
//       console.log("Form Data", [...formData]);
//       console.log(email);
//       const response = await registerUser(formData);
//       console.log(response);
//       const userName = response.data.fullName;
//       const userId = response.data._id;
//       navigate("/layout", { state: { userId, userName } });
//     } catch (error) {
//       // Detailed error handling
//       if (error.response) {
//         // Server responded with a status other than 2xx
//         console.error("Error Response:", error.response);
//         setErrorMessage(
//           `Error: ${error.response.data.message || "Something went wrong"}`
//         );
//       } else if (error.request) {
//         // Request was made but no response was received
//         console.error("Error Request:", error.request);
//         setErrorMessage("No response from server. Please try again.");
//       } else {
//         // Something else happened while setting up the request
//         console.error("Error Message:", error.message);
//         setErrorMessage(error.message);
//       }
//     }
//   };

//   // Otp function

//   const sendOtp = async () => {
//     try {
//       const response = await axios.post("/api/v1/users/otp", { email });
//       console.log(response);
//       console.log(response.data.data.email);
//       console.log(response.data.data.otp);
//       setVerifyOtp(response.data.data.otp);
//       setregisterEmail(response.data.data.email);
//       setOtpSent(true);
//     } catch (error) {
//       console.error("Try again", error);
//     }
//   };

//   const verify = () => {
//     console.log(otp, verifyOtp);

//     if (otp === verifyOtp) {
//       console.log("V", registeremail);
//       setotpVerified(true);
//     } else {
//       console.log("You gave the wrong OTP");
//     }
//   };

//   // JSX

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to bg-indigo-400 p-4">
//       <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4 max-w-md w-full">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
//           Create Your Account
//         </h2>
        

//         {/* Email Input & OTP Verification */}
//         <div className="mb-4">
//           <label
//             className="block text-gray-700 text-sm font-bold mb-2"
//             htmlFor="email">
//             Email
//           </label>
//           <input
//             id="email"
//             type="email"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//           <button
//             onClick={sendOtp}
//             className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">
//             Send OTP
//           </button>
//         </div>

//         {/* OTP Verification */}
//         {otpSent && (
//           <div className="mb-4">
//             <label
//               className="block text-gray-700 text-sm font-bold mb-2"
//               htmlFor="otp">
//               OTP
//             </label>
//             <input
//               id="otp"
//               type="text"
//               placeholder="Enter your OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               required
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             />
//             <button
//               onClick={verify}
//               className="mt-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">
//               Verify OTP
//             </button>
//           </div>
//         )}

//         {/* OTP Verified Hole Nicher Fields Show Hobe */}
//         {otpVerified && (
//           <>
//             <div className="mb-4">
//               <label
//                 className="block text-gray-700 text-sm font-bold mb-2"
//                 htmlFor="fullName">
//                 Full Name
//               </label>
//               <input
//                 id="fullName"
//                 type="text"
//                 placeholder="Enter your full name"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//                 required
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               />
//             </div>
//             <div className="mb-4">
//               <label
//                 className="block text-gray-700 text-sm font-bold mb-2"
//                 htmlFor="username">
//                 Username
//               </label>
//               <input
//                 id="username"
//                 type="text"
//                 placeholder="Enter your username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               />
//             </div>
//             <div className="mb-4">
//               <label
//                 className="block text-gray-700 text-sm font-bold mb-2"
//                 htmlFor="password">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               />
//             </div>
//             <div className="mb-4">
//               <label
//                 className="block text-gray-700 text-sm font-bold mb-2"
//                 htmlFor="avatar">
//                 Avatar
//               </label>
//               <input
//                 id="avatar"
//                 type="file"
//                 onChange={(e) => setAvatar(e.target.files[0])}
//                 accept="image/*"
//                 className="w-full text-gray-700"
//               />
//             </div>
//             <div className="mb-4">
//               <label
//                 className="block text-gray-700 text-sm font-bold mb-2"
//                 htmlFor="coverImage">
//                 Cover Image
//               </label>
//               <input
//                 id="coverImage"
//                 type="file"
//                 onChange={(e) => setCoverImage(e.target.files[0])}
//                 accept="image/*"
//                 className="w-full text-gray-700"
//               />
//             </div>
//             <button
//               type="submit"
//               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300"
//               onClick={handleRegister}>
//               Register
//             </button>
//           </>
//         )}

//         <p className="text-center text-gray-600 mt-4">
//           Already have an account?{" "}
//           <a href="/login" className="text-blue-500 hover:underline">
//             Login here
//           </a>
//         </p>

//         {/* Error Message */}
//         {errorMessage && (
//           <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sign;

