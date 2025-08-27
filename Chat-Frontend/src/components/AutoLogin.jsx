import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { refreshAccessToken } from "../services/userService";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";

const AutoLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId, userName, userAvatar, userAbout } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (userId && userName) navigate("/layout");
  }, [userId, userAvatar, userAbout]);

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const response = await refreshAccessToken();
        dispatch(setUserId({ userId: response.data._id }));
        dispatch(setUserName({ userName: response.data.fullName }));
        dispatch(setUserAvatar({ userAvatar: response.data.avatar }));
        dispatch(setUserAbout({ userAbout: response.data.about }));
      } catch (err) {
        navigate("/sign_in");
      }
    };
    tryAutoLogin();
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Checking authentication...
      </p>
    </div>
  );
};

export default AutoLogin;
