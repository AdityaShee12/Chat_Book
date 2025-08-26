import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import { debounce } from "lodash";
import axios from "axios";
import socket from "../socket.js";
import { AiOutlineSearch } from "react-icons/ai";

const Search = ({ userId, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const [selectUser, setSelectUser] = useState(false);

  function decryptMessage(encryptedText) {
    const bytes = CryptoJS.AES.decrypt(
      encryptedText,
      CryptoJS.enc.Hex.parse(secretKey),
      {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    console.log("SD", bytes.toString(CryptoJS.enc.Utf8));

    return bytes.toString(CryptoJS.enc.Utf8);
  }

  const fetchRecentChats = async () => {
    setTimeout(async () => {
      try {
        const response = await axios.get(
          `/api/v1/users/userList?userId=${userId}`
        );
        if (response.data) {
          const updatedData = response.data.map((data) => ({
            ...data,
            lastMessage: {
              ...data.lastMessage,
              text: decryptMessage(data.lastMessage.text),
            },
          }));
          setRecentUsers(updatedData);
          console.log("Data", updatedData);
        }
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    }, 100);
  };

  const fetchUsers = debounce(async (searchText) => {
    if (!searchText.trim()) {
      setUsers([]);
      return;
    }

    try {
      const response = await axios.get(
        `/api/v1/users/searchUser?query=${searchText}&userId=${userId}`
      );
      const usersWithUUID = response.data.map((user) => ({
        ...user,
      }));
      console.log("Data", usersWithUUID);
      setUsers(usersWithUUID);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, 300);

  const searchRecentChat = () => {
    setRecentUsers((prevUsers) => {
      let updatedUsers = [...prevUsers];
      users.forEach((newUser) => {
        const index = updatedUsers.findIndex(
          (user) => user._id === newUser._id
        );
        if (index !== -1) {
          const [matchedUser] = updatedUsers.splice(index, 1);
          updatedUsers.unshift(matchedUser);
        } else {
          updatedUsers.unshift(newUser);
        }
      });
      return updatedUsers;
    });
  };

  const handleSelectUser = (user) => {
    setSelectUser(true);
    const recieverName = user.fullName.replace(/\s+/g, "");
    navigate(`/layout/chat/${recieverName}`, {
      state: { userId, userName, user },
    });

    setQuery("");

    setRecentUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter(
        (recentUser) => recentUser._id === user._id || recentUser.lastMessage
      );

      // Ensure user is at the top
      const userIndex = updatedUsers.findIndex((u) => u._id === user._id);
      if (userIndex !== -1) {
        const [matchedUser] = updatedUsers.splice(userIndex, 1);
        updatedUsers.unshift(matchedUser);
      }

      return updatedUsers;
    });
  };

  const handleLastMessage = (data) => {
    const { userId, sms, fileType, fileName } = data;
    const t = decryptMessage(sms);
    setTimeout(() => {
      setRecentUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                lastMessage: {
                  ...user.lastMessage,
                  text: fileType
                    ? "" // No text for files
                    : t,
                  fileType,
                  fileName,
                },
              }
            : user
        )
      );
    }, 1000);
  };

  useEffect(() => {
    socket.emit("new-user-joined", userId);
  }, []);

  useEffect(() => {
    fetchRecentChats();
    socket.on("last message", handleLastMessage);
  }, []);

  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  useEffect(() => {
    searchRecentChat();
  }, [users]);

  useEffect(() => {
    setSelectUser(location.pathname.startsWith("/layout/chat"));
  }, [location.pathname]);

  return (
    <div className={`${selectUser ? "lg:block hidden" : "visible"}`}>
      {/* Searchbar */}
      <div className="relative flex justify-center mt-[1.2rem] ml-[0.9rem] mr-[0.9rem]">
        <AiOutlineSearch
          size={21}
          className="absolute left-[1rem] top-[0.6rem] text-slate-600"
        />
        <input
          type="text"
          value={query}
          placeholder="Search or start a new chat"
          onChange={(e) => {
            setQuery(e.target.value);
            fetchUsers(e.target.value);
          }}
          className="placeholder-slate-400 pl-[3rem] text-[1rem] w-full h-[2.3rem] border-2 rounded-3xl"
        />
      </div>
      {/* Searching list */}
      <ul className="pt-[1.5rem] pl-[0.6rem]">
        {recentUsers.map((user) => (
          <li
            key={user._id}
            className="flex gap-3 p-2 font-mono"
            onClick={() => handleSelectUser(user)}>
            <img
              src={user.avatar}
              className="w-[2.7rem] h-[2.7rem] rounded-full object-cover"
            />
            <div className="flex flex-col ">
              {/* min-w-0 is important for truncate */}
              <p className="font-bold text-[1rem] pl-[0.5rem]">
                {user.fullName}
              </p>
              <p className="text-gray-600 text-[1rem] truncate w-40 pl-[0.5rem]">
                {user.lastMessage?.fileType ? (
                  user.lastMessage.fileType.startsWith("image/") ? (
                    <>
                      <span role="img" aria-label="image">
                        📷
                      </span>{" "}
                      Photo
                    </>
                  ) : user.lastMessage.fileType.startsWith("video/") ? (
                    <>
                      <span role="img" aria-label="video">
                        🎥
                      </span>{" "}
                      Video
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="file">
                        📄
                      </span>{" "}
                      {user.lastMessage.fileName
                        ? user.lastMessage.fileName
                            .split(".")
                            .pop()
                            .toUpperCase() + " file"
                        : "File"}
                    </>
                  )
                ) : user.lastMessage?.text &&
                  user.lastMessage.text.length > 40 ? (
                  user.lastMessage.text.slice(0, 40) + "..."
                ) : (
                  user.lastMessage?.text
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>{" "}
    </div>
  );
};

export default Search;
