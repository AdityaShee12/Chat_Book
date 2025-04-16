import { useState } from "react";
import {
  AiOutlineMessage,
  AiOutlinePhone,
  AiOutlineEye,
  AiOutlineSetting,
  AiOutlineUser,
} from "react-icons/ai";
import { FaCamera, FaPen } from "react-icons/fa";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import Search from "../services/searchServices.jsx"; // Import Search component
import { FiLogIn } from "react-icons/fi";
import { useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../Backend_API.js";

const Layout = () => {
  const location = useLocation();
  const name = location.state?.userName;
  const userId = location.state?.userId;
  const user = {};
  const [dp, setDp] = useState();
  const [about, setAbout] = useState();
  const [email, setEmail] = useState();
  const [sidebarWidth, setSidebarWidth] = useState(20); // Sidebar width in percentage
  const [showFullImage, setShowFullImage] = useState(false);
  const contextRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedAbout, setEditedAbout] = useState(about);
  const [originalY, setOriginalY] = useState(null);
  const [fullName, setFullName] = useState("");
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
  });

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
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 50) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const openContextMenu = (event) => {
    event.preventDefault();
    const rect = event.target.getBoundingClientRect();
    

    let positionX = rect.left + 50;
    let positionY = rect.top + window.scrollY;
const menuHeight = 350; // Approximate height of context menu
    const menuWidth = 260; // Approximate width of context menu
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Adjust vertically if overflowing bottom
    if (rect.top + menuHeight > viewportHeight) {
      positionY = rect.top + window.scrollY - menuHeight;
    }

    // Adjust horizontally if overflowing right
    if (rect.left + menuWidth > viewportWidth) {
      positionX = rect.right - menuWidth - padding;
    }
    setOriginalY(positionY);
    setContextMenu({
      show: true,
      x: positionX,
      y: positionY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
    });
  };

  useEffect(() => {
    if (contextMenu.show && contextRef.current) {
      const menuHeight = contextRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const overflowY = originalY + menuHeight;

      if (overflowY > viewportHeight) {
        // Adjust upwards if overflow
        const adjustedY = Math.max(viewportHeight - menuHeight - 60, 10);
        setContextMenu((prev) => ({
          ...prev,
          y: adjustedY,
        }));
      } else {
        // If editing turned off, reset to original Y
        if (!isEditing) {
          setContextMenu((prev) => ({
            ...prev,
            y: originalY,
          }));
        }
      }
    }
  }, [contextMenu.show, isEditing, originalY]);

  useEffect(() => {
    const profile = async () => {
      setTimeout(async () => {
        try {
          const response = await axios.get(
            `https://real-time-chat-application-klxp.onrender.com/api/v1/users/profile?userId=${userId}`
          );
          console.log("Res",response);
          
          setFullName(response.data.data.fullName);
          setDp(response.data.data.avatar);
          setAbout(response.data.data.about);
          setEmail(response.data.data.email);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }, 100);
    };
    profile();
  }, [dp, about, email]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0] || null;
    const formData = new FormData();
    formData.append("userId", userId);
    if (file) formData.append("avatar", file);

    try {
      const response = await axios.post(
        `${API}/api/v1/users/profilePicChange`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const updated = response.data.data;
      setDp(updated.avatar);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileAboutChange = async (editedText) => {
    try {
      const response = await axios.post(
        `${API}/profileAboutChange`,
        {
          userId,
          about: editedText,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const updated = response.data.data;
      setAbout(updated.about);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = async () => {
    const response = await axios.post(
      `${API}/logout`,
      {},
      {
        withCredentials: true,
      }
    );
    navigate("/sign_in");
    return response.data;
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Header */}
      <div className="bg-gray-200 px-4 py-3 flex items-center flex-none">
        <h2 className="text-lg font-semibold">Chat-Book</h2>
      </div>

      {/* Main Content (Sidebar + Search Section) */}
      <div className="flex flex-1">
        {/* Left Fixed Sidebar */}
        <div className="w-16 flex flex-col justify-between items-center py-6 flex-none">
          {/* Upper Icons (3 icons) */}
          <div className="space-y-6 flex flex-col justify-between items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-200 transition">
              <AiOutlineMessage size={24} />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-200 transition rotate-90">
              <AiOutlinePhone size={24} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-200 transition">
              <AiOutlineEye size={24} />
            </button>
          </div>

          {/* Bottom Icons (2 icons) */}
          <div className="space-y-6 flex flex-col justify-between items-center mt-10">
            {/* <button
              className="p-2 rounded-full hover:bg-gray-200 transition">
              <AiOutlineSetting
                size={24}
                onContextMenu={(e) => openContextMenu(e)}
              />
            </button> */}
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={(e) => {
                openContextMenu(e);
              }}>
              <AiOutlineUser size={24} />
            </button>
            {contextMenu.show && (
              <div
                ref={contextRef}
                className="absolute rounded-xl p-4 w-72 z-50 shadow-2xl border border-blue-200 max-h-[350px] overflow-y-auto"
                style={{
                  top: contextMenu.y,
                  left: contextMenu.x,
                  background: "linear-gradient(135deg, #f0f4ff, #dceeff)",
                }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-start relative w-full">
                  {/* Profile Image Container */}
                  <div className=" relative">
                    <div>
                      <img
                        src={dp}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onClick={() => setShowFullImage(true)}
                      />
                      <label className="absolute bottom-1 right-1 bg-blue-100 p-1 rounded-full shadow cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleProfilePicChange}
                        />
                        <FaCamera className="text-blue-600 text-lg" />
                      </label>
                    </div>
                    <p className="mt-3 font-medium text-sm">{fullName}</p>
                  </div>

                  {/* About Section */}
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
                          {about || "No about info"}
                        </p>
                        <FaPen
                          className="text-blue-500 text-xs cursor-pointer ml-2"
                          onClick={() => {
                            setEditedAbout(about);
                            setIsEditing(true);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Email */}
                  <p className="text-sm text-gray-600 mt-2">{email}</p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="mt-4 w-full text-center bg-red-100 hover:bg-red-200 text-red-600 py-1 rounded-md transition">
                  Log out
                </button>
              </div>
            )}
            {showFullImage && (
              <div
                onClick={() => setShowFullImage(false)}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <img
                  src={dp}
                  alt="Full Profile"
                  className="w-80 h-80 rounded-full object-cover border-4 border-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Resizable Search Section */}
        <div
          className="bg-gray-100 p-4 border-r border-gray-300 flex-none transition-all duration-200"
          style={{
            width: `${sidebarWidth}%`,
            minWidth: "20%",
            maxWidth: "50%",
          }}>
          {/* Search Component */}
          <Search userId={userId} userName={name} />
        </div>
        {/* Draggable Resizer */}
        <div
          className="w-1 bg-slate-400 cursor-ew-resize flex-none"
          onMouseDown={handleMouseDown}></div>

        {/* Right Content (ChatPage via Outlet) */}
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
