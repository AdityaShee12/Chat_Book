import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Otp = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registeremail, setregisterEmail] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      const response = await axios.post("https://chat-book-u2yq.onrender.com/api/v1/users/otp", { email });
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

      navigate("/register", { state: { email: registeremail } });
    } else {
      console.log("You gave the wrong OTP");
    }
  };

  return (
    <div>
      <input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
      <button onClick={sendOtp}>Send OTP</button>

      {/* OTP ফিল্ড এবং Next বাটন কেবল তখনই দেখাবে যখন OTP পাঠানো হয়েছে */}
      {otpSent && (
        <>
          <input
            id="otp"
            type="text"
            placeholder="Enter your OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button onClick={verify}>Next</button>
        </>
      )}
    </div>
  );
};

export default Otp;
