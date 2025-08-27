import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import { debounce } from "lodash";
import axios from "axios";
import socket from "../socket.js";
import { AiOutlineSearch } from "react-icons/ai";
import { setSelectUser } from "../features/userSlice.js";
import { useDispatch, useSelector } from "react-redux";
import { API } from "../Backend_API.js";

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const dispatch = useDispatch();
  const { userId, userName } = useSelector((state) => state.user);
  const [selectedUser, setSelectedUser] = useState(false);

  // For message decryption
  function decryptMessage(encryptedText) {
    if (encryptedText) {
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
  }

  // Store previous chat
  const fetchRecentChats = async () => {
    setTimeout(async () => {
      try {
        const response = await axios.get(
          `${API}/api/v1/users/userList?userId=${userId}`
        );
        console.log("Res", response);

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

  // It is fetch users those are matchs with search query
  const fetchUsers = debounce(async (searchText) => {
    if (!searchText.trim()) {
      setUsers([]);
      return;
    }
    try {
      const response = await axios.get(
        `${API}/api/v1/users/searchUser?query=${searchText}&userId=${userId}`
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

  // It is work for make first position of searchable users on userlist
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

  // After sending last message userlist update code
  const handleLastMessage = (data) => {
    const { userId, sms, fileType, fileName, sentRequest, receiveRequest } =
      data;
    const t = decryptMessage(sms);
    setTimeout(() => {
      setRecentUsers((prevUsers) => {
        let updatedUsers = prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                lastMessage: {
                  ...user.lastMessage,
                  text: fileType ? "" : t,
                  fileType,
                  fileName,
                },
              }
            : user
        );
        const index = updatedUsers.findIndex((u) => u._id === userId);
        if (index > -1) {
          const [moved] = updatedUsers.splice(index, 1);
          updatedUsers.unshift(moved);
        }
        return updatedUsers;
      });
    }, 1000);
  };

  // After selecting user from userlist
  const handleSelectUser = (user) => {
    const recieverName = user.fullName.replace(/\s+/g, "");
    console.log("selectId", user._id);
    dispatch(
      setSelectUser({
        receiverId: user._id,
        receiverName: user.fullName,
        receiverAvatar: user.avatar,
      })
    );
    setTimeout(() => {
      navigate(`/layout/chat/${recieverName}`);
    }, 300);
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

  // This code for show online after online
  useEffect(() => {
    socket.emit("new-user-joined", userId, userName);
  }, []);

  // After sending last message userlist update code
  useEffect(() => {
    fetchRecentChats();
    socket.on("last message", handleLastMessage);
  }, []);

  // fetchusers code (show users for typing query)
  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  // searchRecentChat code (user transfer to first index for searching)
  useEffect(() => {
    searchRecentChat();
  }, [users]);

  return (
    <div className={`${selectedUser ? "lg:block hidden" : "visible"}`}>
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
            className="flex gap-3 p-2 font-mono cursor-pointer"
            onClick={() => handleSelectUser(user)}>
            <img
              src={user.avatar}
              className="w-[2.7rem] h-[2.7rem] rounded-full object-cover"
            />
            <div className="flex flex-col">
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