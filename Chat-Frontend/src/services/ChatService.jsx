import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import socket from "../socket.js";
import { AiOutlinePhone, AiOutlineVideoCamera } from "react-icons/ai";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import { FiCopy, FiTrash2, FiStar } from "react-icons/fi";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5"; // or FaArrowLeft, MdArrowBack etc.
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useSelector } from "react-redux";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const ChatPage = () => {
  const [state, setState] = useState("offline");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const {
    userId,
    userName,
    userAvatar,
    selectUser: { receiverId, receiverName, receiverAvatar, receiverAbout },
  } = useSelector((state) => state.user);
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const [deleteMessage, setDeleteMessage] = useState();
  const [identifier, setIdentifier] = useState("");
  const [delFunc, setDelFunc] = useState(false);
  const [everyone, setEveryone] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
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
  const [isVideo, setIsVideo] = useState(false);
  let offset = { x: 0, y: 0 };
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [localVideoPos, setLocalVideoPos] = useState({ x: 20, y: 20 });
  const dragRef = useRef(null);
  const [isSwapped, setIsSwapped] = useState(false);
  let pressTimer = null;
  const [profileDetails, setproFileDetails] = useState(false);
  const profileRef = useRef(null);
  const [about, setAbout] = useState("");
  const [phoneNumber, setPhoneNumber] = useState();
  const [activeSection, setActiveSection] = useState("profile");
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomcontext = useRef(null);
  const [menuAnimation, setMenuAnimation] = useState(false);
  const [requestState, setRequestState] = useState("");

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Zoom in and zoom out by scrole wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  // Moving image by drag after Click mouse button
  const handleMouseDown1 = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  };

  // Dragging move stop
  const handleMouseUp1 = () => {
    setIsDragging(false);
  };

  // touch
  const startDrag = (e) => {
    e.preventDefault();
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    offset = {
      x: clientX - localVideoPos.x,
      y: clientY - localVideoPos.y,
    };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  };
  // touch
  const onDrag = (e) => {
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    setLocalVideoPos({
      x: clientX - offset.x,
      y: clientY - offset.y,
    });
  };
  // touch
  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const x = e.clientX - dragStart.current.x;
      const y = e.clientY - dragStart.current.y;
      setTranslate({ x, y });
    } else return;
  };

  const handleMouseUp = () => {
    clearTimeout(pressTimer);
  };

  // Handling state online or offline
  useEffect(() => {
    const recieverFunction = async () => {
      try {
        console.log("on1");
        socket.emit("reciever add", {
          userId,
          userName,
          receiverId,
          receiverName,
        });
      } catch (error) {
        console.log("RA Err", error);
      }
    };
    recieverFunction();

    socket.on("state", (state) => setState(state));
    socket.on("checkDisconnect", (state) => {
      setState(state);
      setTimeout(() => {
        socket.emit("check after reload", { userId, receiverId });
      }, 2000);
    });

    socket.on("storedSendersms", (message) => {
      const { sender, relation, identifier, text, file, timestamp } = message;
      let sms;
      let fileURL = null;
      let fileName = null;
      let fileType = null;
      let user;
      console.log("SI", sender, sender.id);

      if (relation === "sent") {
        if (sender.id === userId) {
          user = "You";
          sms = "You sent friend request to " + receiverName;
        } else {
          user = "Sender";
          sms = receiverName + "sent friend request to you";
        }
      } else if (relation === "accept") {
        if (sender.id === userId) {
          user = "You";
          sms = "You accepted friend request of " + receiverName;
        } else {
          user = "Sender";
          sms = receiverName + "accepted your friend request";
        }
      } else if (relation === "reject") {
        if (sender.id === userId) {
          user = "You";
          sms = "You rejected friend request of " + receiverName;
        } else {
          user = "Sender";
          sms = receiverName + "rejected your friend request";
        }
      } else {
        if (text) {
          sms = decryptMessage(text);
        }
        if (sender.id === userId) {
          user = "You";
        } else {
          user = "Sender";
        }

        if (file && file.fileData && file.fileType) {
          // For images, videos, pdf, etc.
          fileURL = `data:${file.fileType};base64,${file.fileData}`;
          fileName = file.fileName || null;
          fileType = file.fileType || null;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: user,
          identifier,
          message: sms,
          fileName,
          fileType,
          fileURL,
          timestamp,
        },
      ]);
    });

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
        {
          sender: "Sender",
          identifier,
          message,
          fileName,
          fileType,
          fileURL,
        },
      ]);
    });

    return () => {
      socket.off("state");
      socket.off("receive message");
      socket.off("storedSendersms");
    };
  }, []);

  function decryptMessage(encryptedText) {
    if (encryptMessage) {
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
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  function encryptMessage(message) {
    if (message) {
      return CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(secretKey), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();
    }
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
    console.log(identifier);
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.identifier === identifier) {
          if (sender === "You") {
            console.log("delete everyone");
            socket.emit("delete-everyone", { OwnId, ToId, identifier });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else if (sender === "Me") {
            console.log("delete me");

            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "You",
            });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else if (sender === "Me1") {
            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "me",
            });
            return {
              ...msg,
              identifier: "",
              delIdentifier: "D",
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
              identifier: "",
              delIdentifier: "",
              name: "",
              message: "",
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
  };

  socket.on("delete", (identifier) => {
    console.log("DelIdentiF");
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

  const getStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const createPeerConnection = async () => {
    let stream = localStream;
    if (!stream) stream = await getStream();
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate, receiverId);
      } else {
        console.log("Candidate not work");
      }
    };
    peerConnectionRef.current.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log("Succes");
      } else {
        console.log("not success");
      }
    };
    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      console.log("G");
    }
  };

  const createOffer = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer, receiverId);
  };

  useEffect(() => {
    socket.on("offer", async (offer) => {
      setIsVideo(true);
      // Peer connection তৈরি না থাকলে নতুন বানাও
      if (!peerConnectionRef.current) {
        await createPeerConnection(); // getStream() এর ভেতরেও await আছে
      }
      const pc = peerConnectionRef.current;
      // Remote Description set করা (safe check সহ)
      if (
        pc.signalingState === "stable" ||
        pc.signalingState === "have-local-offer"
      ) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ Remote offer set");
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", answer, receiverId);
      } else {
        console.warn(
          "⚠ Cannot set offer, invalid signaling state:",
          pc.signalingState
        );
        return;
      }
    });

    const handleAnswer = async (answer) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      console.log("Before setting answer, signalingState:", pc.signalingState);

      if (
        pc.signalingState === "have-local-offer" &&
        pc.remoteDescription === null
      ) {
        try {
          await pc.setRemoteDescription(answer);
          console.log("✅ Remote answer set successfully");
        } catch (err) {
          console.error("❌ Error setting remote answer:", err);
        }
      } else {
        console.warn("⚠ Skipping answer: Already stable or answer set");
      }
    };

    socket.on("ice-candidate", async (candidate) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ ICE candidate added");
        } catch (error) {
          console.error("❌ Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("answer", handleAnswer);
    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const videoCallSystem = async () => {
    setIsVideo(true);
    await getStream();
    await createPeerConnection();
    await createOffer();
  };

  const closeZoom = () => {
    setIsZoomed(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (zoomcontext.current && !zoomcontext.current.contains(event.target)) {
        closeZoom();
      }
    };
    if (isZoomed) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isZoomed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        closeprofileContext();
      }
    };

    if (profileDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDetails]);

  const openProfileContext = (e) => {
    e.preventDefault();
    setproFileDetails(true);
    setMenuAnimation(false);
    setTimeout(() => setMenuAnimation(true), 300);
  };

  useEffect(() => {
    console.log("profile", profileDetails);
  }, [profileDetails]);

  const closeprofileContext = () => {
    setproFileDetails(false);
    setMenuAnimation(false);
  };

  const overview = (e) => {
    e.preventDefault();
    setActiveSection("profile");
  };

  const media = (e) => {
    e.preventDefault();
    setActiveSection("media");
  };

  const files = (e) => {
    e.preventDefault();
    setActiveSection("files");
  };

  const links = (e) => {
    e.preventDefault();
    setActiveSection("links");
  };

  const groups = (e) => {
    e.preventDefault();
    setActiveSection("groups");
  };

  useEffect(() => {
    const profile = async () => {
      console.log("receiverProfile", receiverId, receiverName, receiverAvatar);
      try {
        const response = await axios.get(
          `/api/v1/users/profile?userId=${receiverId}`
        );
        console.log("Res", response);
        setAbout(response.data.data.about);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    profile();
  }, [activeSection]);

  // Code of sending Message
  const sendMessage = async () => {
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
      userId,
      userName,
      userAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
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
    socket.on("friends", (data) => {
      const { requestState } = data;
      console.log(requestState);
      setTimeout(() => {
        if (requestState === "reject") {
          setRequestState("reject");
        } else if (requestState === "sent") {
          setRequestState("sent");
        } else if (requestState === "friend") {
          setRequestState("friend");
        } else {
          setRequestState("noFriend");
        }
      }, 100);
    });
    return () => {
      socket.off("friends");
    };
  }, []);

  useEffect(() => {
    console.log("REQS", requestState);
  }, [requestState]);

  // Code for sending request
  const sendRequest = () => {
    const identifier = uuidv4();
    socket.emit("sendRequest", {
      userId,
      userName,
      userAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
      identifier,
    });
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        identifier,
        message: "You sent friendrequest to " + receiverName,
      },
    ]);
    setRequestState("sent");
  };

  //  Code for accept or reject requests
  const replyRequest = async (accept) => {
    const identifier = uuidv4();
    // Code for accept request
    if (accept) {
      socket.emit("acceptRequest", {
        userId,
        userName,
        userAvatar,
        receiverId,
        receiverName,
        receiverAvatar,
        identifier,
        accept,
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "sender",
          identifier,
          message: `You accepted ${receiverName}'s request`,
        },
      ]);
      setRequestState("friend");
    }
    // Code for reject request
    else {
      socket.emit("acceptRequest", {
        userId,
        userName,
        userAvatar,
        receiverId,
        receiverName,
        receiverAvatar,
        identifier,
        accept,
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "sender",
          identifier,
          message: "You rejected friendrequest of " + receiverName,
        },
      ]);
    }
  };

  // Code for accept or reject reply
  socket.on("requestReply", (accept) => {
    console.log("Accept",accept);
    
    if (accept) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "sender",
          identifier,
          message: `${receiverName} accepted your request`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: "sender",
          identifier,
          message: `${receiverName} rejected your request`,
        },
      ]);
    }
  });

  return (
    <div className="flex flex-col items-center justify-between mt-[0.7rem] pl-[0.9rem] pr-[0.9rem]">
      {/* profile */}
      <div
        className="flex justify-between items-center w-full rounded-lg bg-gray-200 h-[4rem] cursor-pointer"
        onClick={(e) => openProfileContext(e)}>
        {/* profile pic, name and state */}
        <div className="flex items-center gap-4">
          {" "}
          <img
            src={receiverAvatar}
            alt=""
            className="w-12 h-12 rounded-full object-cover ml-[0.4rem]"
          />
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-semibold">{receiverName}</h2>
            <p className="text-sm text-gray-600">{state}</p>
          </div>
        </div>
        {/* VideoCamera */}
        <div>
          <AiOutlineVideoCamera
            size={27}
            className="mr-[0.5rem]"
            onClick={videoCallSystem}
          />
        </div>
      </div>
      {profileDetails && (
        <div
          ref={profileRef}
          className={`absolute z-10 w-[30rem] h-[29rem] rounded-lg shadow-md bg-slate-200 mt-[4rem]`}>
          <div className="flex h-full">
            {/* left side */}
            <div className="flex flex-col pt-3 pl-5 gap-4 bg-slate-300 w-[8rem] ">
              <div onClick={(e) => overview(e)} className="cursor-pointer">
                Overview
              </div>
              <div onClick={(e) => media(e)} className="cursor-pointer">
                Media
              </div>
              <div onClick={(e) => files(e)} className="cursor-pointer">
                Links
              </div>
              <div onClick={(e) => links(e)} className="cursor-pointer">
                Files
              </div>
              <div onClick={(e) => groups(e)} className="cursor-pointer">
                Groups
              </div>
            </div>
            {/* right side */}
            <div>
              {activeSection === "profile" && (
                <div>
                  <div className="flex flex-col items-center p-4 rounded-lg overflow-hidden">
                    {/* Profile Picture Section */}
                    <div
                      className={`${
                        isZoomed
                          ? "fixed bg-black flex justify-center items-center inset-0 z-50 "
                          : "relative w-28 h-28"
                      }`}>
                      <div
                        className={`${
                          isZoomed
                            ? "absolute z-50 left-7 top-7 text-white"
                            : "hidden"
                        }`}
                        onClick={() => {
                          setIsZoomed(false);
                        }}>
                        <IoArrowBack size={24} className="cursor-pointer" />
                      </div>
                      {isZoomed ? (
                        <TransformWrapper
                          initialScale={1}
                          wheel={{ step: 0.1 }}
                          pinch={{ step: 5 }}
                          doubleClick={{ disabled: true }}>
                          {" "}
                          <TransformComponent>
                            <img
                              src={receiverAvatar}
                              alt="profile"
                              className="w-[48vw] h-[95vh]"
                            />{" "}
                          </TransformComponent>
                        </TransformWrapper>
                      ) : (
                        <img
                          src={receiverAvatar}
                          alt=""
                          onClick={() => setIsZoomed(true)}
                          className=" 
                          absolute w-28 h-28 rounded-full cursor-pointer"
                        />
                      )}
                    </div>
                    <h2 className="text-xl font-bold mt-3">{receiverName}</h2>
                    <div className="flex justify-center gap-10 py-5 w-full">
                      <div className="bg-slate-100 w-[9rem] h-[4rem] px-[3.5rem] py-[0.5rem] cursor-pointer">
                        <AiOutlineVideoCamera
                          size={27}
                          className="mr-[0.5rem] "
                          onClick={videoCallSystem}
                        />
                        <p>Video</p>
                      </div>
                      <div className="bg-slate-100 w-[9rem] h-[4rem] px-[3.5rem] py-[0.5rem] cursor-pointer">
                        <AiOutlinePhone
                          size={27}
                          className="mr-[0.5rem] rotate-90"
                          onClick={videoCallSystem}
                        />
                        <p>Video</p>
                      </div>
                    </div>
                  </div>
                  {/* Name */}

                  <div className="pl-[0.9rem] mb-[1rem]">
                    About
                    <p>{receiverAbout}</p>
                  </div>
                  <div className="pl-[0.9rem]  mb-[1rem]">
                    Phone number
                    <p>{phoneNumber}</p>
                  </div>
                  <div className="flex justify-between px-[0.9rem] h-[2.5rem]">
                    <div className="bg-slate-100  flex justify-center items-center w-[9rem] cursor-pointer">
                      Block
                    </div>
                    <div className="bg-slate-100 flex justify-center items-center w-[9rem] cursor-pointer">
                      Report contact
                    </div>
                  </div>
                </div>
              )}
              {activeSection === "media" && <MediaComponent />}
              {activeSection === "files" && <FilesComponent />}
              {activeSection === "links" && <LinksComponent />}
              {activeSection === "groups" && <GroupsComponent />}
            </div>
          </div>
        </div>
      )}
      {/* Video Call System */}
      {isVideo && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center transition-all duration-300 ${
            isFullScreen
              ? "w-full h-full"
              : "w-[300px] h-[300px] rounded-lg overflow-hidden"
          }`}
          onClick={() => setIsFullScreen(!isFullScreen)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}>
          {/* Big Video (can be remote or local based on swap) */}
          <video
            ref={isSwapped ? localVideoRef : remoteVideoRef}
            autoPlay
            muted={isSwapped} // Only mute if local is big
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Small Draggable Video (can be remote or local based on swap) */}
          <div
            ref={dragRef}
            className="absolute w-[120px] h-[120px] border-2 border-white rounded-lg overflow-hidden cursor-move"
            style={{
              top: localVideoPos.y,
              left: localVideoPos.x,
            }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}>
            <video
              ref={isSwapped ? remoteVideoRef : localVideoRef}
              autoPlay
              muted={!isSwapped}
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      {/* Message section */}
      <div className="flex flex-col w-full">
        {/* Showing Message */}
        <div
          ref={chatContainerRef}
          className="lg:h-[73vh] h-[78.5vh] overflow-y-auto p-4 ">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex w-full ${
                msg.sender === "You" ? "justify-end" : "justify-start"
              }`}>
              <div
                className={`relative flex flex-col ${
                  msg.sender === "You" ? "items-end" : "items-start"
                }`}
                onContextMenu={(e) => openContextMenu(msg, e)}
                style={{ width: "fit-content", maxWidth: "60%" }}>
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
                      className="bg-black text-white px-3 py-2 rounded-lg min-w-[80px] max-w-full break-words block">
                      📄 {msg.fileName}
                    </a>
                  )
                ) : null}
                {msg.message && (
                  <div
                    className="font-mono bg-black text-white px-3 py-2 rounded-lg min-w-[80px] max-w-full break-words whitespace-pre-line mt-2 block"
                    style={{
                      wordBreak: "break-word",
                      minWidth: "80px",
                      maxWidth: "100%",
                      whiteSpace: "pre-line",
                    }}>
                    {msg.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Context Menu */}
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
        {/* Delete Confirmation */}
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
        {/* Full Image Preview */}
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
        {/* Footer */}
        {/* No friend */}
        {requestState === "noFriend" && (
          <div>
            If you want chatting with {receiverName} then first you need to send
            request
            <button onClick={sendRequest}>Send Request</button>
          </div>
        )}{" "}
        {/* Sending request */}
        {requestState === "sent" && (
          <div>
            {messages.map((msg, index) =>
              msg.sender === "You" ? (
                <div key={index}>You sent friendrequest to {receiverName}</div>
              ) : (
                <div key={index}>
                  <div>{receiverName} sent friendrequest to you</div>
                  <div className="flex px-5 py-3 text-4xl">
                    <button
                      onClick={() => {
                        const accept = 1;
                        replyRequest(accept);
                      }}>
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        const accept = 0;
                        replyRequest(accept);
                      }}>
                      Reject
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
        {/* Rejection code */}
        {requestState === "reject" && (
          <div>
            {messages.map((msg, index) => {
              {
                msg.sender === "You" ? (
                  <div>
                    {" "}
                    <div>You rejected friendrequest of {receiverName}</div>
                    <div>
                      If you want chatting with {receiverName} then first you
                      need to send request
                      <button onClick={sendRequest}>Send Request</button>
                    </div>
                  </div>
                ) : (
                  <div>{receiverName} rejected your friendrequest</div>
                );
              }
            })}
          </div>
        )}
        {/* Friend */}
        {/* Type bar for sending sms*/}
        {requestState === "friend" && (
          <div className="relative flex items-center h-[4rem]">
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute pl-[0.7rem] rounded-full hover:bg-gray-200 transition">
              <FiPaperclip size={20} />
            </button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleChange}
              placeholder="Type a message..."
              className="bg-slate-200 w-full h-[3.5rem] leading-[3.5rem] rounded-3xl pl-[2.7rem] text-[1.3rem] "
              rows={1}
              style={{ minHeight: "40px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="p-1 rounded-full hover:bg-gray-200 transition">
              <FiSend size={30} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
