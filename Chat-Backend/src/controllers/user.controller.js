import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Message } from "../models/Message.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { transporter } from "../sendOTP.js";
import { v4 as uuidv4 } from "uuid";

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
  console.log(email);

  if (!email) return res.status(400).json({ message: "Email is required!" });
  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  const otp = generateOTP();
  const mailOptions = {
    from: `"A Tech" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}.`,
  };
  console.log("✅ Sending OTP to:", email); // Debugging
  console.log("✅ Generated OTP:", otp);
  transporter.sendMail(mailOptions);
  const responseData = {
    message: `OTP sent successfully to ${email}`,
    otp,
    email,
  };
  console.log("✅ Response Data:", responseData); // Debugging
  return res
    .status(201)
    .json(new ApiResponse(200, responseData, "Send otp successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password, about } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log(avatar);

  const googleId = uuidv4();

  const user = await User.create({
    googleId,
    fullName,
    email,
    avatar: avatar?.url || "",
    about,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }
  const fullName = username;
  const user = await User.findOne({
    $or: [{ fullName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
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

// const searchUser = asyncHandler(async (req, res) => {
//   try {
//     const { query, userId } = req.query;
//     if (!query) return res.json([]); // Empty query dile empty result dibe

//     // First e oi alphabet diye start howa name gulo dibe, tarpor sequence anujayi baki gulo
//     const users = await User.find({
//       fullName: { $regex: query, $options: "i" },
//       _id: { $ne: userId },
//     });

//     // Alphabet first e thakle priority dibe
//     const sortedUsers = users.sort((a, b) => {
//       const aIndex = a.fullName.toLowerCase().indexOf(query.toLowerCase());
//       const bIndex = b.fullName.toLowerCase().indexOf(query.toLowerCase());
//       return aIndex - bIndex;
//     });
//     console.log("US", sortedUsers);

//     res.json(sortedUsers);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// const searchUser = asyncHandler(async (req, res) => {
//   try {
//     const { query } = req.query;
//     if (!query) return res.json([]); // Empty query dile empty result dibe

//     // Query to match fullName starting with input letters (e.g., "ad" → "Aditya", "Adnan")
//     // const regexPattern = `^${query}`;
//     const regexPattern = `${query}`;
//     const users = await User.find({
//       fullName: { $regex: regexPattern, $options: "i" },
//     });

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// const userList = asyncHandler(async (req, res) => {
//   try {
//     console.log("work");
//     const { userId } = req.query;
// console.log(userId);

//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     // Find chats where userId is in users array and messages exist
//     const chatRooms = await Message.aggregate([
//       {
//         $match: {
//           "users.id": new mongoose.Types.ObjectId(userId),
//           "messages.0": { $exists: true },
//         },
//       },
//       { $addFields: { lastMessage: { $arrayElemAt: ["$messages", -1] } } }, // Get last message
//       { $sort: { "lastMessage.timestamp": -1 } }, // Sort by latest message timestamp
//     ]);
// console.log(chatRooms);

//     let userData = [];

//     if (chatRooms.length > 0) {
//       let userIds = new Set();

//       chatRooms.forEach((chat) => {
//         chat.users.forEach((user) => {
//           if (user.id.toString() !== userId) {
//             userIds.add(user.id.toString());
//           }
//         });
//       });

//       const users = await User.find({ _id: { $in: [...userIds] } });

//       // Combine users with their last message
//       users.forEach((user) => {
//         const chat = chatRooms.find((c) =>
//           c.users.some((u) => u.id.toString() === user._id.toString())
//         );
//         if (chat) {
//           userData.push({
//             _id: user._id,
//             name: user.name,
//             lastMessage: chat.lastMessage, // Attach last message
//           });
//         }
//       });
//     }
//     console.log(userData);

//     res.json(userData);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

const profile = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  // console.log("AS");

  if (!userId) return res.json([]);
  const profileData = await User.findById(userId).select(
    "-password -refreshToken"
  );
  if (!profileData) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  console.log(profileData);

  return res
    .status(200)
    .json(new ApiResponse(200, profileData, "User fetched Successfully"));
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

const searchUser = asyncHandler(async (req, res) => {
  try {
    const { query, userId } = req.query;
    if (!query) return res.json([]); // Empty query হলে খালি array রিটার্ন করবে

    // Query অনুযায়ী ইউজারদের খুঁজে বের করা (নিজেকে বাদ দিয়ে)
    const users = await User.find({
      fullName: { $regex: query, $options: "i" },
      _id: { $ne: userId },
    });

    let userData = [];

    if (users.length > 0) {
      let userIds = users.map((user) => user._id.toString());

      // userId এবং userIds তালিকায় থাকা ইউজারদের সাথে মেসেজ আছে কিনা চেক করা
      const chatRooms = await Message.find({
        "users.id": userId,
        "messages.0": { $exists: true },
        "users.id": { $in: userIds },
      }).sort({ "messages.timestamp": -1 });

      // মেসেজ থাকা ইউজারদের প্রোসেস করা
      let processedUserIds = new Set();

      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (
            user.id.toString() !== userId &&
            !processedUserIds.has(user.id.toString())
          ) {
            processedUserIds.add(user.id.toString());

            const lastMessage = chat.messages[chat.messages.length - 1]; // সর্বশেষ মেসেজ
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

      // যাদের মেসেজ নেই তাদের শুধু _id এবং fullName সহ সংযোজন করা
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

    console.log("US", userData);
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const userList = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find chats where userId is in users array and message exists
    const chatRooms = await Message.find({
      "users.id": userId,
      "messages.0": { $exists: true },
    }).sort({ "messages.timestamp": -1 });

    let userData = [];

    if (chatRooms.length > 0) {
      let userIds = new Set();

      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (user.id.toString() !== userId) {
            userIds.add(user.id.toString());
          }
        });
      });

      const users = await User.find({ _id: { $in: [...userIds] } });

      users.forEach((user) => {
        const chat = chatRooms.find((c) =>
          c.users.some((u) => u.id.toString() === user._id.toString())
        );

        if (chat) {
          const lastMessage = chat.messages[chat.messages.length - 1]; // Get last message
          userData.push({
            _id: user._id,
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
    }
    console.log("UD", userData);

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

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

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  sendOtp,
  loginUser,
  logoutUser,
  profile,
  profilePicChange,
  profileAboutChange,
  searchUser,
  userList,
  refreshAccessToken,
};
