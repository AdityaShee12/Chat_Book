import React, { useState } from "react";
import { loginUser } from "../services/userService.jsx";
import { useNavigate } from "react-router-dom";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch } from "react-redux";

const Sign_in = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    const credentials = {
      fullName,
      email,
      password,
    };
    try {
      const user = await loginUser(credentials);
      console.log(user);
      dispatch(setUserId({ userId: user.data.loggedInUser._id }));
      dispatch(setUserName({ userName: user.data.loggedInUser.fullName }));
      dispatch(setUserAvatar({ userAvatar: user.data.loggedInUser.avatar }));
      dispatch(setUserAbout({ userAbout: user.data.loggedInUser.about }));
      navigate("/layout");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="h-screen p-4 flex flex-col items-center justify-center space-y-4">
      <div className="max-w-xl sm:max-w-sm md:max-w-md w-full p-8 rounded-xl flex flex-col  items-center border border-gray-300 space-y-4">
        <h1 className="text-4xl text-center font-bold mb-4 font-mono">
          Chat_Book
        </h1>
        <input
          id="email"
          type="email"
          placeholder="Phone number, username or email"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none bg-slate-100"
        />
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none bg-slate-100"
        />{" "}
        <button
          onClick={handleLogin}
          className="mt-4 max-w-xs sm:max-w-sm md:max-w-md w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300 text-center">
          Sign in
        </button>
        <div>Forgot password?</div>
      </div>
      <div className="max-w-xs sm:max-w-sm md:max-w-md w-full p-4 rounded-xl flex items-center justify-center border border-gray-300 text-gray-700 text-center">
        Don't have an account?
        <a href="/sign_up" className="ml-1 text-blue-500 hover:underline">
          {" "}
          Sign up
        </a>
      </div>
    </div>
  );
};

export default Sign_in;