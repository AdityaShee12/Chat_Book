import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/userService";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch } from "react-redux";
import { API } from "../Backend_API";

const Sign_up = () => {
  const [profilepic, setProfilepic] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(true);
  const [registeremail, setregisterEmail] = useState("");
  const [otpVerified, setotpVerified] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [about, setAbout] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // OAuth login
  const login = () => {
    window.open(`${API}/auth/google`, "_self");
  };

  // send OTP
  const sendOtp = async () => {
    try {
      const response = await axios.post(`${API}/api/v1/users/otp`, { email });
      console.log(response);
      console.log(response.data.data.email);
      console.log(response.data.data.otp);
      setVerifyOtp(response.data.data.otp);
      setregisterEmail(response.data.data.email);
      setOtpSent(false);
      setotpVerified(true);
    } catch (error) {
      console.error("Try again", error);
    }
  };

  // Verify OTP
  const verify = () => {
    console.log(otp, verifyOtp);

    if (otp === verifyOtp) {
      console.log("V", registeremail);
      setotpVerified(false);
      setCreateAccount(true);
    } else {
      console.log("You gave the wrong OTP");
    }
  };

  // Sign IN
  const signIn = () => {
    navigate("/sign_in");
  };

  // Choose Avatar
  const chooseAvatar = () => {
    const regex = /^[a-z0-9._]+$/;
    if (!regex.test(userName)) {
      alert(
        "Username must contain only lowercase letters, numbers, dot, underscore."
      );
    } else {
      setCreateAccount(false);
      setProfilepic(true);
    }
  };

  // Handling registration
  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("userName", userName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("about", about);
    if (avatar) formData.append("avatar", avatar);
    try {
      console.log("Form Data", [...formData]);
      console.log(email);
      const response = await registerUser(formData);
      console.log(response);
      dispatch(setUserId({ userId: response.data._id }));
      dispatch(setUserName({ userName: response.data.fullName }));
      dispatch(setUserAvatar({ userAvatar: response.data.avatar }));
      dispatch(setUserAbout({ userAbout: response.data.about }));
      navigate("/layout");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-[3rem] pt-[4rem] pb-[4rem] lg:text-[3.5rem] xl:text-[3rem] xl:p-[3rem]">
        ChatBook
      </div>
      <div
        className="w-[70vw] h-auto border border-slate-400 rounded-md flex flex-col items-center lg:w-[30rem]
        xl:w-[30vw] xl:h-auto
      ">
        {otpSent && (
          <>
            <button
              className="m-[18%] bg-blue-700 text-white text-[1.3rem] rounded-xl w-[60vw] h-[7vh] lg:m-[15%] lg:w-[39vw] lg:text-[1.7rem]
            xl:w-[25vw] xl:text-[1rem] xl:m-[8%]">
              Login with Google
            </button>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem]"
            />
            <button
              onClick={sendOtp}
              className="w-[60vw] h-[7vh] m-[8%] border rounded-xl border-slate-400 text-xl font-semibold lg:w-[39vw] lg:text-[1.7rem]  xl:w-[25vw] xl:text-[1rem]
              transition duration-300 hover:shadow-lg hover:shadow-sky-400">
              Send OTP
            </button>
            <button
              className="w-[60vw] h-[7vh] border rounded-xl mb-[10%] border-slate-400 text-xl font-semibold lg:w-[39vw] lg:text-[1.7rem]  xl:w-[25vw] xl:text-[1rem]"
              onClick={signIn}>
              Sign in
            </button>
          </>
        )}
        {otpVerified && (
          <>
            <input
              type="number"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
              }}
              placeholder="Enter your OTP"
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] m-[18%] lg:m-[15%] xl:m-[8%]"
            />
            <button
              onClick={verify}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] mb-[18%] lg:mb-[15%] xl:mb-[8%]">
              Verify your OTP
            </button>
          </>
        )}
        {createAccount && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
              }}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] m-[18%] lg:m-[15%] xl:m-[8%]"
            />
            <input
              type="text"
              placeholder="Username"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] mt-[18%] lg:mt-[15%] xl:mt-[8%]"
            />
            <button
              onClick={chooseAvatar}
              className="w-[60vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] m-[18%] lg:m-[15%] xl:m-[8%]  transition duration-300 hover:shadow-lg hover:shadow-sky-400">
              Next
            </button>
          </>
        )}
      </div>
      {profilepic && (
        <div className="w-[20rem] flex flex-col items-center border md:w-[34rem] lg:w-[30rem] xl:w-[26rem] h-auto border-slate-400 rounded-xl">
          <label className="cursor-pointer">
            <div className="bg-slate-300 w-[10rem] h-[10rem] rounded-full flex justify-center items-center m-[1rem]">
              {avatar ? (
                <img
                  src={URL.createObjectURL(avatar)}
                  alt="Problem occur on photo"
                  className="h-full rounded-full"
                />
              ) : (
                <div>Upload profilepic</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setAvatar(e.target.files[0]);
              }}
              className="hidden"
            />
          </label>
          <textarea
            value={about}
            onChange={(e) => {
              setAbout(e.target.value);
            }}
            className="w-[65vw] h-[7vh] border border-slate-400 text-xl rounded-xl pl-2  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem] m-[10%] lg:m-[15%] xl:m-[3%] xl:mt-[5%]"
            placeholder="Write something about yourself..."></textarea>
          <button
            onClick={handleRegister}
            className="w-[65vw] h-[5vh] border border-slate-400 text-xl rounded-xl pl-2 mb-[1.3rem]  lg:w-[39vw] lg:text-[1.7rem]]  xl:w-[25vw] xl:text-[1rem]  transition duration-300 hover:shadow-lg hover:shadow-sky-400">
            Next
          </button>
        </div>
      )}
      <p className="text-center text-gray-600 m-7 border border-slate-400 rounded-md md:w-[34rem] md:text-[2rem] lg:text-[1.4rem] lg:w-[30rem] xl:text-[1rem] xl:w-[26rem] h-auto p-4 ">
        Already have an account?{" "}
        <div
          className="inline-block text-blue-500 hover:text-blue-600 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-blue-500 hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
          onClick={signIn}>
          Login here
        </div>
      </p>
    </div>
  );
};
export default Sign_up;
