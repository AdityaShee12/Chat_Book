import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import socket from "../socket.js";
import { AiOutlinePhone, AiOutlineVideoCamera } from "react-icons/ai";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import { FiCopy, FiTrash2, FiStar } from "react-icons/fi";

const ChatPage = () => {
  const [state, setState] = useState("offline");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const location = useLocation();
  const OwnId = location.state?.userId;
  const OwnName = location.state?.userName;
  const reciever = location.state?.user;
  const ToId = reciever?._id;
  const ToName = reciever?.fullName;
  const dp = reciever?.avatar;
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const [deleteMessage, setDeleteMessage] = useState();
  const [identifier, setIdentifier] = useState("");
  let deletesms = false;
  const [delFunc, setDelFunc] = useState(false);
  const [everyone, setEveryone] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [roomId, setRoomId] = useState("abcd");
  const contextRef = useRef(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const [receivedFile, setReceivedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    message: "",
  });

  useEffect(() => {
    const recieveFunction = async () => {
      try {
        console.log("on1");
        socket.emit("reciever add", { OwnId, ToId });
      } catch (error) {
        console.log("RA Err", error);
      }
    };
    recieveFunction();

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
      return bytes.toString(CryptoJS.enc.Utf8);
    }

    socket.on("receive message", (data) => {
      const { identifier, fileName, fileType, fileData, sms } = data;

      let message =
        typeof sms === "string" && !sms.startsWith("http")
          ? decryptMessage(sms)
          : sms;
      let uint8Array;
      let blob;
      let fileURL;

      if (fileData) {
        // Convert ArrayBuffer to Uint8Array before creating blob
        uint8Array = new Uint8Array(fileData);
        blob = new Blob([uint8Array], { type: fileType });
        fileURL = URL.createObjectURL(blob);
      }
      setMessages((prev) => [
        ...prev,
        { sender: "Sender", identifier, message, fileName, fileType, fileURL },
      ]);
    });

    socket.on("state", (state) => setState(state));

    socket.on("storedSendersms", (messageData) => {
      const { identifier, text, file, timestamp } = messageData;
      const sms = decryptMessage(text);
      const fileURL = file?.fileData
        ? `data:${file.fileType};base64,${file.fileData}`
        : null;

      setMessages((prev) => [
        ...prev,
        {
          sender: "You",
          identifier,
          message: sms,
          fileName: file?.fileName || null,
          fileType: file?.fileType || null,
          fileURL,
          timestamp,
        },
      ]);
    });

    socket.on("storedReceiversms", (messageData) => {
      const { identifier, text, file, timestamp } = messageData;
      const sms = decryptMessage(text);
      const fileURL = file?.fileData
        ? `data:${file.fileType};base64,${file.fileData}`
        : null;

      setMessages((prev) => [
        ...prev,
        {
          sender: "Sender",
          identifier,
          message: sms,
          fileName: file?.fileName || null,
          fileType: file?.fileType || null,
          fileURL,
          timestamp,
        },
      ]);
    });

    return () => {
      socket.off("recieve message");
      socket.off("state");
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(secretKey), {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const previewURL = URL.createObjectURL(selectedFile);
      setFilePreview(previewURL);
    }
  };

  const sendMessage = async () => {
    console.log("Send");

    if (!message.trim() && !file) return;
    const sms = encryptMessage(message);
    let fileData;
    let fileType;
    let fileURL;
    let fileName;
    if (file) {
      fileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsArrayBuffer(file);
      });
      fileName = file.name;
      fileType = file.type;
      fileURL = URL.createObjectURL(
        new Blob([new Uint8Array(fileData)], { type: fileType })
      );
    }
    const identifier = uuidv4();
    const sendItem = {
      OwnId,
      OwnName,
      ToId,
      ToName,
      identifier,
      sms,
      fileName,
      fileType,
      fileData,
    };
    if (state === "online") {
      socket.emit("send message", sendItem);
      setMessages((prev) => [
        ...prev,
        { sender: "You", identifier, message, fileName, fileType, fileURL },
      ]);
      setFile(null);
      fileInputRef.current.value = "";
      if (message) setMessage("");
    } else {
      socket.emit("offline_User sms", sendItem);
      console.log("offline");

      setMessages((prev) => [
        ...prev,
        { sender: "You", identifier, message, fileName, fileType, fileURL },
      ]);
      setFile(null);
      fileInputRef.current.value = "";
      if (message) setMessage("");
    }
  };

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

  const openContextMenu = (msg, event) => {
    event.preventDefault();
    const message = msg.message,
      identifier = msg.identifier,
      isOwnMessage = msg.sender === "You",
      delIdentifier = msg.delIdentifier;
    console.log("MSg", msg);

    console.log("delidentifier", delIdentifier);

    const rect = event.target.getBoundingClientRect();

    let positionX = isOwnMessage ? rect.left - 180 : rect.right + 10;
    let positionY = rect.top + window.scrollY;

    const menuHeight = 150; // Approx height of the context menu
    const viewportHeight = window.innerHeight;

    if (rect.top + menuHeight > viewportHeight) {
      // Position upwards if it overflows
      positionY = rect.bottom + window.scrollY - menuHeight;
    }

    if (delIdentifier) {
      setDelFunc(true);
    } else {
      setContextMenu({
        show: true,
        x: positionX,
        y: positionY,
        message: "",
      });
      setDeleteMessage(message);
      document.body.style.overflow = "hidden";
    }
    setIdentifier(identifier);
  };

  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      message,
    });
  };

  const Delete = (sender) => {
    console.log(sender);
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.identifier === identifier) {
          if (sender === "You") {
            console.log(identifier);
            socket.emit("delete-everyone", { OwnId, ToId, identifier });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else if (sender === "Me") {
            console.log("Accurate");
            console.log(identifier);
            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "You",
            });
            return {
              ...msg,
              identifier,
              delIdentifier: "",
              name: "",
              message: "This message was deleted by you",
            };
          } else {
            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "me",
            });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          }
        }
        return msg;
      })
    );
    setDeleteMessage("");
    closeContextMenu();
    setDelFunc(false);
    if (everyone) setEveryone(false);
    socket.on("delete", ({ identifier }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.identifier === identifier
            ? {
                ...msg,
                name: "",
                delIdentifier: "D",
                message: "This message was deleted by sender",
              }
            : msg
        )
      );
    });
  };

  const deleteFunction = () => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.identifier === identifier) {
          if (msg.sender === "You") {
            setEveryone(true);
          } else {
            setEveryone(false);
          }
        }
        return msg;
      })
    );
    closeContextMenu();
    setDelFunc(true);
  };

  const copyFunction = () => {
    setMessages((prevMessages) => {
      const copiedMessage = prevMessages.find(
        (msg) => msg.identifier === identifier
      );

      if (copiedMessage) {
        navigator.clipboard
          .writeText(copiedMessage.message || "")
          .then(() => {
            console.log("Message copied successfully!");
          })
          .catch((err) => {
            console.error("Failed to copy message:", err);
          });
      }

      return prevMessages;
    });

    closeContextMenu();
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // socket.emit("typing-state", ToId);
    const textarea = messageInputRef.current;
    textarea.style.height = "auto"; // Height reset
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"; // Max height 200px
  };

  const createPeerConnection = () => {
    if (!localStream) return;

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    localStream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStream);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate, roomId);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  socket.on("answer", async (answer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  });

  socket.on("offer", async (offer) => {
    if (!peerConnectionRef.current) createPeerConnection();
    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socket.emit("answer", answer, roomId);
  });

  const initiateCall = async () => {
    if (!peerConnectionRef.current) return;
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer, roomId);
  };

  socket.on("ice-candidate", async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
      initiateCall();
    }
  });

  socket.on("joined", () => {
    setIsJoined(true);
    createPeerConnection();
  });

  const videoCallSystem = () => {
    socket.emit("join-room", ToId);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-200 flex-none">
        {/* Left Side: ToName & State */}
        <div className="flex items-center gap-4">
          <img
            src={dp}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-semibold">{ToName}</h2>
            <p className="text-sm text-gray-600">{state}</p>
          </div>
        </div>

        {/* Right Side: Call & Video Call Icons */}
        {/* <div className="flex space-x-4">
          <AiOutlineVideoCamera
            size={24}
            className="text-black cursor-pointer"
          />
          <AiOutlinePhone
            size={24}
            className="text-black cursor-pointer rotate-90"
          />
        </div> */}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-x-hidden overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "You" ? "justify-end" : "justify-start"
            }`}>
            <div
              className="relative"
              onContextMenu={(e) => openContextMenu(msg, e)}>
              {msg.fileURL ? (
                msg.fileType?.startsWith("image/") ? (
                  <img
                    src={msg.fileURL}
                    alt="Sent Image"
                    className="w-40 h-40 object-cover rounded-lg"
                    onClick={() => setSelectedImage(msg.fileURL)}
                  />
                ) : msg.fileType?.startsWith("video/") ? (
                  <video
                    src={msg.fileURL}
                    controls
                    className="w-60 rounded-lg"
                  />
                ) : (
                  <a
                    href={msg.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-3 py-2 rounded-lg min-w-[100px] max-w-[60%] break-words">
                    📄 {msg.fileName}
                  </a>
                )
              ) : null}

              {msg.message && (
                <span className="inline-block font-mono bg-black text-white px-3 py-2 rounded-lg min-w-[100px] max-w-[60%] break-words mt-2">
                  {msg.message}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {contextMenu.show && (
        <div
          ref={contextRef}
          className="absolute rounded-lg shadow-lg bg-slate-100 text-black"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            position: "absolute",
            zIndex: 10,
          }}>
          <div className="flex flex-col w-44 rounded-lg overflow-hidden">
            <div
              className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2"
              onClick={() => {
                copyFunction();
              }}>
              <FiCopy size={16} />
              <span>Copy</span>
            </div>
            <div className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2">
              <FiStar size={16} />
              <span>Star</span>
            </div>
            <div
              className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2"
              onClick={() => {
                deleteFunction();
              }}>
              <FiTrash2 size={16} />
              <span>Delete</span>
            </div>
              
          </div>
        </div>
      )}
      {delFunc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-64">
            <p className="text-center mb-3 text-gray-800">
              Delete this message?
            </p>

            {everyone ? (
              <>
                <button
                  className="w-full py-2 text-red-600 hover:bg-gray-200 rounded"
                  onClick={() => Delete("You")}>
                  Delete for everyone
                </button>
                <button
                  className="w-full py-2 text-gray-800 hover:bg-gray-200 rounded"
                  onClick={() => Delete("Me")}>
                  Delete for me
                </button>
              </>
            ) : (
              <button
                className="w-full py-2 text-gray-800 hover:bg-gray-200 rounded"
                onClick={() => Delete("Me1")}>
                Delete for me{" "}
              </button>
            )}
            <button
              className="w-full py-2 text-gray-500 hover:bg-gray-200 rounded mt-2"
              onClick={() => setDelFunc(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setSelectedImage(null)}>
          <img
            src={selectedImage}
            alt="Full Size"
            className="max-w-full max-h-full"
          />
        </div>
      )}

      {/* Footer - Input & Send Button */}
      <div className="p-3 bg-white flex-none flex items-center border-t">
        {file && (
          <div className="flex items-center p-2 bg-gray-100 rounded-lg mb-2">
            <img
              src={filePreview}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-lg"
            />
            <span className="truncate">{file.name}</span>
            <button
              onClick={() => {
                setFile(null);
                setFilePreview(null);
              }}
              className="ml-2">
              <FiX size={20} className="text-gray-600 hover:text-red-500" />
            </button>
          </div>
        )}

        {/* File Upload Icon */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-200 transition">
          <FiPaperclip size={24} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Message Input */}
        <textarea
          ref={messageInputRef}
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          className="w-full px-3 py-2 border rounded-lg resize-none overflow-x-hidden overflow-y-hidden max-h-52"
          rows={1}
          style={{ minHeight: "40px" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {/* Send Button Icon */}
        <button
          onClick={sendMessage}
          className="p-2 rounded-full hover:bg-gray-200 transition">
          <FiSend size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;

// import { useLocation } from "react-router-dom";
// import CryptoJS from "crypto-js";
// import socket from "../socket.js";
// import { AiOutlinePhone, AiOutlineVideoCamera } from "react-icons/ai";
// import { FiSend, FiPaperclip, FiX } from "react-icons/fi";
// import { v4 as uuidv4 } from "uuid";
// import { FiCopy, FiTrash2, FiStar } from "react-icons/fi"; // Import icons

// // import { useNavigate } from "react-router-dom";

// const configuration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// const ChatPage = () => {
//   const [state, setState] = useState("offline");
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [file, setFile] = useState(null);
//   const location = useLocation();
//   const OwnId = location.state?.userId;
//   const OwnName = location.state?.userName;
//   const reciever = location.state?.user;
//   const ToId = reciever?._id;
//   const ToName = reciever?.fullName;
//   const dp = reciever?.avatar;
//   const secretKey = "0123456789abcdef0123456789abcdef";
//   const iv = "abcdef9876543210abcdef9876543210";
//   const chatContainerRef = useRef(null);
//   const messageInputRef = useRef(null);
//   const [deleteMessage, setDeleteMessage] = useState();
//   const [identifier, setIdentifier] = useState("");
//   let deletesms = false;
//   const [delFunc, setDelFunc] = useState(false);
//   const [everyone, setEveryone] = useState(false);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [isJoined, setIsJoined] = useState(false);
//   const [roomId, setRoomId] = useState("abcd");
//   const contextRef = useRef(null);
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();
//   const peerConnectionRef = useRef(null);
//   const [receivedFile, setReceivedFile] = useState(null);
//   const fileInputRef = useRef(null);
//   const [filePreview, setFilePreview] = useState(null);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [contextMenu, setContextMenu] = useState({
//     show: false,
//     x: 0,
//     y: 0,
//     message: "",
//   });

//   useEffect(() => {
//     socket.emit("reciever-add", { OwnId, ToId });

//     function decryptMessage(encryptedText) {
//       const bytes = CryptoJS.AES.decrypt(
//         encryptedText,
//         CryptoJS.enc.Hex.parse(secretKey),
//         {
//           iv: CryptoJS.enc.Hex.parse(iv),
//           mode: CryptoJS.mode.CBC,
//           padding: CryptoJS.pad.Pkcs7,
//         }
//       );
//       return bytes.toString(CryptoJS.enc.Utf8);
//     }

//     socket.on("receive message", (data) => {
//       const { identifier, fileName, fileType, fileData, sms } = data;

//       let message =
//         typeof sms === "string" && !sms.startsWith("http")
//           ? decryptMessage(sms)
//           : sms;
//       let uint8Array;
//       let blob;
//       let fileURL;

//       if (fileData) {
//         // Convert ArrayBuffer to Uint8Array before creating blob
//         uint8Array = new Uint8Array(fileData);
//         blob = new Blob([uint8Array], { type: fileType });
//         fileURL = URL.createObjectURL(blob);
//       }
//       setMessages((prev) => [
//         ...prev,
//         { sender: "Sender", identifier, message, fileName, fileType, fileURL },
//       ]);
//     });

//     socket.on("state", (state) => setState(state));

//     return () => {
//       socket.off("recieve message");
//       socket.off("state");
//     };
//   }, []);

//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop =
//         chatContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   function encryptMessage(message) {
//     return CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(secretKey), {
//       iv: CryptoJS.enc.Hex.parse(iv),
//       mode: CryptoJS.mode.CBC,
//       padding: CryptoJS.pad.Pkcs7,
//     }).toString();
//   }

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       // Create preview URL
//       const previewURL = URL.createObjectURL(selectedFile);
//       setFilePreview(previewURL);
//     }
//   };

//   const sendMessage = async () => {
//     if (!message.trim() && !file) return;

//     const sms = encryptMessage(message);
//     let fileData;
//     let fileType;
//     let fileURL;
//     let fileName;
//     if (file) {
//       fileData = await new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result);
//         reader.readAsArrayBuffer(file);
//       });
//       fileName = file.name;
//       fileType = file.type;
//       fileURL = URL.createObjectURL(
//         new Blob([new Uint8Array(fileData)], { type: fileType })
//       );
//     }
//     const identifier = uuidv4();
//     const sendItem = {
//       OwnId,
//       OwnName,
//       ToId,
//       ToName,
//       identifier,
//       sms,
//       fileName,
//       fileType,
//       fileData,
//     };
//     if (state === "online") {
//       socket.emit("send message", sendItem);
//       setMessages((prev) => [
//         ...prev,
//         { sender: "You", identifier, message, fileName, fileType, fileURL },
//       ]);
//       setFile(null);
//       fileInputRef.current.value = "";
//       if (message) setMessage("");
//     } else {
//       socket.emit("offline_User sms", sendItem);
//       console.log("offline");

//       setMessages((prev) => [
//         ...prev,
//         { sender: "You", identifier, message, fileName, fileType, fileURL },
//       ]);
//       setFile(null);
//       fileInputRef.current.value = "";
//       if (message) setMessage("");
//     }
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (contextRef.current && !contextRef.current.contains(event.target)) {
//         closeContextMenu();
//       }
//     };

//     if (contextMenu.show) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [contextMenu.show]);

//   const openContextMenu = (msg, event) => {
//     event.preventDefault();
//     const message = msg.message,
//       identifier = msg.identifier,
//       isOwnMessage = msg.sender === "You",
//       delIdentifier = msg.delIdentifier;
//     console.log("MSg", msg);

//     console.log("delidentifier", delIdentifier);

//     const rect = event.target.getBoundingClientRect();

//     let positionX = isOwnMessage ? rect.left - 180 : rect.right + 10;
//     let positionY = rect.top + window.scrollY;

//     const menuHeight = 150; // Approx height of the context menu
//     const viewportHeight = window.innerHeight;

//     if (rect.top + menuHeight > viewportHeight) {
//       // Position upwards if it overflows
//       positionY = rect.bottom + window.scrollY - menuHeight;
//     }

//     if (delIdentifier) {
//       setDelFunc(true);
//     } else {
//       setContextMenu({
//         show: true,
//         x: positionX,
//         y: positionY,
//         message: "",
//       });
//       setDeleteMessage(message);
//       document.body.style.overflow = "hidden";
//     }
//     setIdentifier(identifier);
//   };

//   const closeContextMenu = () => {
//     setContextMenu({
//       show: false,
//       x: 0,
//       y: 0,
//       message,
//     });
//   };

//   const Delete = (sender) => {
//     console.log(sender);
//     setMessages((prevMessages) =>
//       prevMessages.map((msg) => {
//         if (msg.identifier === identifier) {
//           if (sender === "You") {
//             console.log(identifier);
//             socket.emit("delete-everyone", { OwnId, ToId, identifier });
//             return {
//               ...msg,
//               identifier,
//               delIdentifier: "D",
//               name: "",
//               message: "This message was deleted by you",
//             };
//           } else if (sender === "Me") {
//             console.log("Accurate");
//             console.log(identifier);
//             socket.emit("delete-me", {
//               OwnId,
//               ToId,
//               identifier,
//               sender: "You",
//             });
//             return {
//               ...msg,
//               identifier,
//               delIdentifier: "",
//               name: "",
//               message: "This message was deleted by you",
//             };
//           } else {
//             socket.emit("delete-me", {
//               OwnId,
//               ToId,
//               identifier,
//               sender: "me",
//             });
//             return {
//               ...msg,
//               identifier,
//               delIdentifier: "D",
//               name: "",
//               message: "This message was deleted by you",
//             };
//           }
//         }
//         return msg;
//       })
//     );
//     setDeleteMessage("");
//     closeContextMenu();
//     setDelFunc(false);
//     if (everyone) setEveryone(false);
//     socket.on("delete", ({ identifier }) => {
//       setMessages((prevMessages) =>
//         prevMessages.map((msg) =>
//           msg.identifier === identifier
//             ? {
//                 ...msg,
//                 name: "",
//                 delIdentifier: "D",
//                 message: "This message was deleted by sender",
//               }
//             : msg
//         )
//       );
//     });
//   };

//   const deleteFunction = () => {
//     setMessages((prevMessages) =>
//       prevMessages.map((msg) => {
//         if (msg.identifier === identifier) {
//           if (msg.sender === "You") {
//             setEveryone(true);
//           } else {
//             setEveryone(false);
//           }
//         }
//         return msg;
//       })
//     );
//     closeContextMenu();
//     setDelFunc(true);
//   };

//   const copyFunction = () => {
//     setMessages((prevMessages) => {
//       const copiedMessage = prevMessages.find(
//         (msg) => msg.identifier === identifier
//       );

//       if (copiedMessage) {
//         navigator.clipboard
//           .writeText(copiedMessage.message || "")
//           .then(() => {
//             console.log("Message copied successfully!");
//           })
//           .catch((err) => {
//             console.error("Failed to copy message:", err);
//           });
//       }

//       return prevMessages;
//     });

//     closeContextMenu();
//   };

//   const handleChange = (e) => {
//     setMessage(e.target.value);
//     // socket.emit("typing-state", ToId);
//     const textarea = messageInputRef.current;
//     textarea.style.height = "auto"; // Height reset
//     textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"; // Max height 200px
//   };

//   const createPeerConnection = () => {
//     if (!localStream) return;

//     peerConnectionRef.current = new RTCPeerConnection(configuration);

//     localStream.getTracks().forEach((track) => {
//       peerConnectionRef.current.addTrack(track, localStream);
//     });

//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", event.candidate, roomId);
//       }
//     };

//     peerConnectionRef.current.ontrack = (event) => {
//       setRemoteStream(event.streams[0]);
//       remoteVideoRef.current.srcObject = event.streams[0];
//     };
//   };

//   socket.on("answer", async (answer) => {
//     if (peerConnectionRef.current) {
//       await peerConnectionRef.current.setRemoteDescription(answer);
//     }
//   });

//   socket.on("offer", async (offer) => {
//     if (!peerConnectionRef.current) createPeerConnection();
//     await peerConnectionRef.current.setRemoteDescription(offer);
//     const answer = await peerConnectionRef.current.createAnswer();
//     await peerConnectionRef.current.setLocalDescription(answer);
//     socket.emit("answer", answer, roomId);
//   });

//   const initiateCall = async () => {
//     if (!peerConnectionRef.current) return;
//     const offer = await peerConnectionRef.current.createOffer();
//     await peerConnectionRef.current.setLocalDescription(offer);
//     socket.emit("offer", offer, roomId);
//   };

//   socket.on("ice-candidate", async (candidate) => {
//     if (peerConnectionRef.current) {
//       await peerConnectionRef.current.addIceCandidate(candidate);
//       initiateCall();
//     }
//   });

//   socket.on("joined", () => {
//     setIsJoined(true);
//     createPeerConnection();
//   });

//   const videoCallSystem = () => {
//     socket.emit("join-room", ToId);
//   };

//   return (
//     <div className="flex flex-col h-full w-full">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 bg-gray-200 flex-none">
//         {/* Left Side: ToName & State */}
//         <div className="flex items-center gap-4">
//           <img
//             src={dp}
//             alt=""
//             className="w-12 h-12 rounded-full object-cover"
//           />
//           <div className="flex flex-col justify-center">
//             <h2 className="text-lg font-semibold">{ToName}</h2>
//             <p className="text-sm text-gray-600">{state}</p>
//           </div>
//         </div>

//         {/* Right Side: Call & Video Call Icons */}
//         {/* <div className="flex space-x-4">
//           <AiOutlineVideoCamera
//             size={24}
//             className="text-black cursor-pointer"
//           />
//           <AiOutlinePhone
//             size={24}
//             className="text-black cursor-pointer rotate-90"
//           />
//         </div> */}
//       </div>

//       {/* Chat Messages */}
//       <div
//         ref={chatContainerRef}
//         className="flex-1 overflow-x-hidden overflow-y-auto p-4 space-y-2">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex ${
//               msg.sender === "You" ? "justify-end" : "justify-start"
//             }`}>
//             <div
//               className="relative"
//               onContextMenu={(e) => openContextMenu(msg, e)}>
//               {msg.fileURL ? (
//                 msg.fileType?.startsWith("image/") ? (
//                   <img
//                     src={msg.fileURL}
//                     alt="Sent Image"
//                     className="w-40 h-40 object-cover rounded-lg"
//                     onClick={() => setSelectedImage(msg.fileURL)}
//                   />
//                 ) : msg.fileType?.startsWith("video/") ? (
//                   <video
//                     src={msg.fileURL}
//                     controls
//                     className="w-60 rounded-lg"
//                   />
//                 ) : (
//                   <a
//                     href={msg.fileURL}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="bg-black text-white px-3 py-2 rounded-lg min-w-[100px] max-w-[60%] break-words">
//                     📄 {msg.fileName}
//                   </a>
//                 )
//               ) : null}

//               {msg.message && (
//                 <span className="inline-block bg-black text-white px-3 py-2 rounded-lg min-w-[100px] max-w-[60%] break-words mt-2">
//                   {msg.message}
//                 </span>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {contextMenu.show && (
//         <div
//           ref={contextRef}
//           className="absolute rounded-lg shadow-lg bg-slate-100 text-black"
//           style={{
//             left: contextMenu.x,
//             top: contextMenu.y,
//             position: "absolute",
//             zIndex: 10,
//           }}>
//           <div className="flex flex-col w-44 rounded-lg overflow-hidden">
//             <div
//               className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2"
//               onClick={() => {
//                 copyFunction();
//               }}>
//               <FiCopy size={16} />
//               <span>Copy</span>
//             </div>
//             <div className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2">
//               <FiStar size={16} />
//               <span>Star</span>
//             </div>
//             <div
//               className="cursor-pointer p-2 hover:bg-slate-200 flex items-center gap-2"
//               onClick={() => {
//                 deleteFunction();
//               }}>
//               <FiTrash2 size={16} />
//               <span>Delete</span>
//             </div>
//
//           </div>
//         </div>
//       )}
//       {delFunc && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-lg p-4 w-64">
//             <p className="text-center mb-3 text-gray-800">
//               Delete this message?
//             </p>

//             {everyone ? (
//               <>
//                 <button
//                   className="w-full py-2 text-red-600 hover:bg-gray-200 rounded"
//                   onClick={() => Delete("You")}>
//                   Delete for everyone
//                 </button>
//                 <button
//                   className="w-full py-2 text-gray-800 hover:bg-gray-200 rounded"
//                   onClick={() => Delete("Me")}>
//                   Delete for me
//                 </button>
//               </>
//             ) : (
//               <button
//                 className="w-full py-2 text-gray-800 hover:bg-gray-200 rounded"
//                 onClick={() => Delete("Me1")}>
//                 Delete for me{" "}
//               </button>
//             )}
//             <button
//               className="w-full py-2 text-gray-500 hover:bg-gray-200 rounded mt-2"
//               onClick={() => setDelFunc(false)}>
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       {selectedImage && (
//         <div
//           className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80"
//           onClick={() => setSelectedImage(null)}>
//           <img
//             src={selectedImage}
//             alt="Full Size"
//             className="max-w-full max-h-full"
//           />
//         </div>
//       )}

//       {/* Footer - Input & Send Button */}
//       <div className="p-3 bg-white flex-none flex items-center border-t">
//         {file && (
//           <div className="flex items-center p-2 bg-gray-100 rounded-lg mb-2">
//             <img
//               src={filePreview}
//               alt="Preview"
//               className="w-12 h-12 object-cover rounded-lg"
//             />
//             <span className="truncate">{file.name}</span>
//             <button
//               onClick={() => {
//                 setFile(null);
//                 setFilePreview(null);
//               }}
//               className="ml-2">
//               <FiX size={20} className="text-gray-600 hover:text-red-500" />
//             </button>
//           </div>
//         )}

//         {/* File Upload Icon */}
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           className="p-2 rounded-full hover:bg-gray-200 transition">
//           <FiPaperclip size={24} />
//         </button>
//         <input
//           type="file"
//           ref={fileInputRef}
//           className="hidden"
//           onChange={handleFileChange}
//         />

//         {/* Message Input */}
//         <textarea
//           ref={messageInputRef}
//           value={message}
//           onChange={handleChange}
//           placeholder="Type a message..."
//           className="w-full px-3 py-2 border rounded-lg resize-none overflow-x-hidden overflow-y-hidden max-h-52"
//           rows={1}
//           style={{ minHeight: "40px" }}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               sendMessage();
//             }
//           }}
//         />

//         {/* Send Button Icon */}
//         <button
//           onClick={sendMessage}
//           className="p-2 rounded-full hover:bg-gray-200 transition">
//           <FiSend size={24} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;
