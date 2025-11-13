import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Message } from "../models/Message.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { transporter } from "../sendOTP.js";
import { v4 as uuidv4 } from "uuid";
import { Status } from "../models/Status.model.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("Emails", email);

  if (!email) return res.status(400).json({ message: "Email is required!" });
  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  const otp = generateOTP();
  const mailOptions = {
    from: `"Chat Book" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}.`,
  };
  console.log("Work1");
  try {
    transporter.sendMail(mailOptions);
    console.log("Work2");
    const responseData = {
      message: `OTP sent successfully to ${email}`,
      otp,
      email,
    };
    console.log("✅ Response Data:", responseData); // Debugging
    return res
      .status(201)
      .json(new ApiResponse(200, responseData, "Send otp successfully"));
  } catch (error) {
    console.log(error);
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password, about } = req.body;
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  console.log(userName);

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("Avatar", avatarLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("AvatarURL", avatar);

  const googleId = uuidv4();

  const user = await User.create({
    googleId,
    fullName,
    email,
    avatar: avatar?.url || "",
    about,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // const isPasswordValid = await user.isPasswordCorrect(password);
  // if (!isPasswordValid) {
  //   throw new ApiError(401, "Invalid user credentials");
  // }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  if (!accessToken || !refreshAccessToken)
    throw new ApiError(400, "Accesstoken and refreshtoken did'nt generate");
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const statusUpload = asyncHandler(async (req, res) => {
  const { userId, userName } = req.body;
  console.log("Username",userName);
  
  const statusLocalPath = req.files?.status?.[0]?.path;

  const status = await uploadOnCloudinary(statusLocalPath);
  if (!status?.url) {
    throw new ApiError(400, "Failed to upload status file");
  }

  let existingStatus = await Status.findOne({ "uploader.id": userId });

  if (existingStatus) {
    existingStatus.status.push({
      file: status.url,
      timestamp: new Date(),
    });
    await existingStatus.save();
  } else {
    existingStatus = await Status.create({
      uploader: { id: userId, name: userName },
      status: [{ file: status.url, timestamp: new Date() }],
    });
  }

  const userData = existingStatus.status.map((s) => s.file);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userData,
        existingStatus
          ? "All status files fetched successfully"
          : "Status uploaded successfully"
      )
    );
});

const statusShow = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }
  const userStatuses = await Status.find({ "uploader.id": userId }).lean();
  const usersData = userStatuses.flatMap((item) =>
    item.status.map((s) => s.file)
  );
  const friendsData = user?.otherUsers?.length
    ? await Promise.all(
        user.otherUsers.map(async (friend) => {
          const friendStatuses = await Status.find({
            "uploader.id": friend.id,
          }).lean();
          if (!friendStatuses.length) return null;
          const name = friendStatuses[0].uploader.name;
          const files = friendStatuses.flatMap((item) =>
            item.status.map((s) => s.file)
          );
          return {
            friendName: name,
            statuses: files,
          };
        })
      )
    : [];
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { usersData, friendsData },
        "User and friends' statuses"
      )
    );
});

const setPassword = asyncHandler(async (req, res) => {
  const { password, email } = req.body;
  const user = await User.findOneAndUpdate(
    { email: email },
    { $set: { password: password } },
    { new: true, select: "_id fullName avatar about" } // updated document return
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password was change"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const profilePicChange = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID missing" });
  const profileData = await User.findById(userId);
  if (!profileData) throw new ApiError(404, "User not found");
  // If avatar provided, upload it
  const avatarLocalPath = req.file?.path;
  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) throw new ApiError(500, "Avatar upload failed");
    profileData.avatar = avatar.url;
  }
  await profileData.save();
  return res
    .status(200)
    .json(new ApiResponse(200, profileData, "Profile updated successfully"));
});

const profileAboutChange = asyncHandler(async (req, res) => {
  const { userId, about } = req.body;

  if (!userId) return res.status(400).json({ message: "User ID missing" });

  const profileData = await User.findById(userId);
  if (!profileData) throw new ApiError(404, "User not found");

  if (about) {
    profileData.about = about;
  }

  await profileData.save();
  return res
    .status(200)
    .json(new ApiResponse(200, profileData, "Profile updated successfully"));
});

// It is handle fetching users those names are metch with searching query
const searchUser = asyncHandler(async (req, res) => {
  try {
    const { query, userId } = req.query;
    if (!query) return res.json([]);
    const users = await User.find({
      fullName: { $regex: query, $options: "i" },
      _id: { $ne: userId },
    });

    let userData = [];

    if (users.length > 0) {
      let userIds = users.map((user) => user._id);
      const chatRooms = await Message.find({
        "users.id": userId,
        "users.id": { $in: userIds },
        "messages.0": { $exists: true },
      }).sort({ "messages.timestamp": -1 });
      let processedUserIds = new Set();

      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (
            user.id.toString() !== userId &&
            !processedUserIds.has(user.id.toString())
          ) {
            processedUserIds.add(user.id.toString());

            const lastMessage = chat.messages[chat.messages.length - 1];
            userData.push({
              _id: user.id,
              fullName: user.fullName,
              avatar: user.avatar || "",
              lastMessage: {
                text: lastMessage?.text || null,
                file: lastMessage?.file || null,
                timestamp: lastMessage?.timestamp || null,
              },
            });
          }
        });
      });
      users.forEach((user) => {
        if (!processedUserIds.has(user._id.toString())) {
          userData.push({
            _id: user._id,
            fullName: user.fullName,
            avatar: user.avatar || "",
          });
        }
      });
    }
    console.log("Users", userData);
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// It is fetch all previous users those was chatting with user
const userList = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const chatRooms = await Message.find({
      "users.id": userId,
      "messages.0": { $exists: true },
    }).sort({ "messages.timestamp": -1 });
    let userData = [];
    if (chatRooms.length > 0) {
      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (user.id.toString() !== userId) {
            const lastMessage = chat.messages[chat.messages.length - 1];
            let chatter;
            if (user.id === lastMessage.sender.id) {
              chatter = "reciever";
            } else {
              chatter = "sender";
            }
            userData.push({
              _id: user.id,
              fullName: user.name,
              avatar: user.avatar || "",
              lastMessage: {
                text: lastMessage?.text || null,
                file: lastMessage?.file || null,
                chatter,
                timestamp: lastMessage?.timestamp || null,
              },
            });
          }
        });
      });
    }
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (incomingRefreshToken) console.log(incomingRefreshToken);
  else throw new ApiError("Did not find refreshtoken ");
  console.log("Work", incomingRefreshToken);

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  sendOtp,
  loginUser,
  logoutUser,
  setPassword,
  profilePicChange,
  profileAboutChange,
  searchUser,
  userList,
  statusUpload,
  statusShow,
  refreshAccessToken,
};
