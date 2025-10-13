import { useState } from "react";
import {
  AiOutlineMessage,
  AiOutlinePhone,
  AiOutlineEye,
  AiOutlineSetting,
  AiOutlineUser,
} from "react-icons/ai";
import { FaCamera, FaPen } from "react-icons/fa";
import { useNavigate, Outlet } from "react-router-dom";
import Search from "../services/searchServices.jsx";
import { SiOpenai } from "react-icons/si";
import { useEffect, useRef } from "react";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import StatusUpload from "../services/statusUpload.jsx";
import AiAssistant from "../services/AiAssistant.jsx";
import { setUserAvatar, setUserAbout, clearUser } from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const Layout = () => {
  const [email, setEmail] = useState();
  const [searchbarWidth, setSearchbarWidth] = useState(30); // Sidebar width in percentage
  const [showFullImage, setShowFullImage] = useState(false);
  const contextRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [originalY, setOriginalY] = useState(null);
  const [fullName, setFullName] = useState("");
  const [dragStyle, setDragStyle] = useState("");
  const [barStyle, setBarStyle] = useState("");
  const windowWidth = window.innerWidth;
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
  });
  const { userId, userName, userAvatar, userAbout } = useSelector(
    (state) => state.user
  );
  const [menuAnimation, setMenuAnimation] = useState(false);
  const [statusClick, setStatusClick] = useState(false);
  const dispatch = useDispatch();
  const [editedAbout, setEditedAbout] = useState(userAbout);
  const [isZoomed, setIsZoomed] = useState(false);

  // useeffect for contextMenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.show]);

  // Mouse Drag to Resize Sidebar
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragStyle("cursor-ew-resize");
    setBarStyle("w-[1rem]");
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 30 && newWidth <= 70) {
      setSearchbarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setDragStyle("");
    setBarStyle("");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // open context menu
  const openContextMenu = (event) => {
    const rect = event.target.getBoundingClientRect();
    let positionX = rect.left - 20;
    let positionY = rect.top;
    const menuHeight = 265; // Approximate height of context menu
    const menuWidth = 268; // Approximate width of context menu
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // Adjust vertically if overflowing bottom
    if (rect.top + menuHeight > viewportHeight) {
      positionY = rect.top - menuHeight;
    }
    // Adjust horizontally if overflowing right
    if (rect.left + menuWidth > viewportWidth) {
      positionX = rect.right - menuWidth;
    }
    setOriginalY(positionY);
    setContextMenu({
      show: true,
      x: positionX,
      y: positionY,
    });
    setMenuAnimation(false);
    setTimeout(() => setMenuAnimation(true), 300);
  };

  // close context menu
  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
    });
  };

  // Update proiflepic section
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0] || null;
    const formData = new FormData();
    formData.append("userId", userId);
    if (file) formData.append("avatar", file);

    try {
      const response = await axios.post(
        "https://real-time-chat-application-klxp.onrender.com/api/v1/users/profilePicChange",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const updated = response.data.data;
      dispatch(setUserAvatar({ userAvatar: updated.avatar }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Update about section
  const handleProfileAboutChange = async (editedText) => {
    try {
      const response = await axios.post(
        "https://real-time-chat-application-klxp.onrender.com/api/v1/users/profileAboutChange",
        {
          userId,
          about: editedText,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const updated = response.data.data;
      dispatch(setUserAbout({ userAbout: updated.about }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    const response = await axios.post(
      "https://real-time-chat-application-klxp.onrender.com/api/v1/users/logout",
      { userId },
      {
        withCredentials: true,
      }
    );
    navigate("/sign_in");
    dispatch(clearUser());
  };

  // Status upload system
  const statusUploaed = () => {
    setStatusClick(true);
  };

  const chat = () => {
    setStatusClick(false);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${dragStyle}`}>
      {/* Header no hand */}
      <h2 className="font-mono text-[1.5rem] pt-[0.3rem] pl-[0.9rem] xl:pl-[0.7rem] bg-slate-200">
        {statusClick ? <span>Status</span> : <span>ChatBook</span>}
      </h2>
      {/* Main Content (Sidebar + Search Section + outlet) */}
      <div className="lg:flex flex-1">
        {/* Left content(icons) */}
        <div className="hidden lg:flex flex-col justify-between items-center py-6 bg-slate-200">
          {/* Upper Icons (3 icons) */}
          <div className="flex flex-col justify-between items-center gap-[1.5rem]">
            <button
              onClick={() => chat()}
              className="p-2 rounded-full hover:bg-gray-200">
              <AiOutlineMessage size={24} />
            </button>
            <button
              onClick={() => statusUploaed()}
              className="p-2 rounded-full hover:bg-gray-200">
              <AiOutlineEye size={24} />
            </button>
          </div>
          {/* Bottom Icons (2 icons) */}
          <div className="flex flex-col justify-between items-center gap-[1.8rem] mt-[15rem]">
            <button className="p-2 rounded-full hover:bg-gray-200">
              <AiOutlineSetting size={24} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-200"
              onClick={(e) => {
                openContextMenu(e);
              }}>
              <AiOutlineUser size={24} />
            </button>
            {contextMenu.show && (
              <div
                ref={contextRef}
                className={`absolute rounded-xl w-72 h-72 p-4 z-50 shadow-2xl border bg-slate-400 translate-x-4 transition-all duration-300 ease-out ${
                  menuAnimation
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-20"
                }`}
                style={{
                  top: contextMenu.y,
                  left: contextMenu.x,
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Profile section */}
                <div className="flex flex-col items-start relative w-full">
                  <div className="relative">
                    <div className="relative w-24 h-24">
                      {isZoomed ? (
                        <TransformWrapper
                          initialScale={1}
                          wheel={{ step: 0.1 }}
                          pinch={{ step: 5 }}
                          doubleClick={{ disabled: true }}>
                          <TransformComponent>
                            <img
                              src={userAvatar}
                              alt="Profile"
                              className="w-[48vw] h-[95vh]"
                              onClick={() => setShowFullImage(true)}
                            />
                          </TransformComponent>
                        </TransformWrapper>
                      ) : (
                        <img
                          src={userAvatar}
                          alt="Profile"
                           onClick={() => setIsZoomed(true)}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      )}
                      <label className="absolute -bottom-1 -right-1 bg-white border border-gray-300 p-1 rounded-full shadow cursor-pointer">
                        <FaCamera className="text-blue-600 text-xs" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleProfilePicChange}
                        />
                      </label>
                    </div>
                    <p className="mt-3 font-medium text-sm">{userName}</p>
                  </div>

                  <div className="w-full mt-3 relative">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editedAbout}
                          onChange={(e) => setEditedAbout(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded text-sm resize-none bg-white text-gray-800"
                          rows={2}
                        />
                        <button
                          onClick={() => {
                            handleProfileAboutChange(editedAbout);
                            setIsEditing(false);
                          }}
                          className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition">
                          Save
                        </button>
                      </>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <p className="text-sm text-gray-800">
                          {userAbout || "No about info"}
                        </p>
                        <FaPen
                          className="text-blue-500 text-xs cursor-pointer ml-2"
                          onClick={() => {
                            setEditedAbout(userAbout);
                            setIsEditing(true);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-2">{email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-4 w-full text-center bg-red-100 hover:bg-red-200 text-red-600 py-1 rounded-md transition">
                  Log out
                </button>
              </div>
            )}
            {showFullImage && (
              <div
                className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
                onClick={() => setShowFullImage(false)}>
                <img
                  src={userAvatar}
                  alt="Full Profile"
                  className="max-w-full max-h-full object-contain rounded-none"
                />
              </div>
            )}
          </div>
        </div>
        {/* Searchbar and status upload and show  */}
        {statusClick ? (
          userId ? (
            <div
              style={{
                width: windowWidth < 1024 ? "100%" : `${searchbarWidth - 3.5}%`,
              }}>
              <StatusUpload />
            </div>
          ) : (
            <div>Loading...</div>
          )
        ) : (
          <div
            style={{
              width: windowWidth < 1024 ? "100%" : `${searchbarWidth - 3.5}%`,
            }}>
            <Search />
          </div>
        )}

        {/* Draggable Resizer */}
        <div
          className={`hidden lg:block w-[0.1rem] bg-slate-400 cursor-ew-resize hover:w-[1rem] ${barStyle}`}
          onMouseDown={handleMouseDown}></div>
        {/* Right Content (ChatPage via Outlet) */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
