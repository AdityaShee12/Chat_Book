import { Router } from "express";
import {
  sendOtp,
  registerUser,
  loginUser,
  logoutUser,
  searchUser,
  profile,
  profilePicChange,
  profileAboutChange,
  userList,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/otp").post(sendOtp);
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/profile").get(profile);
router.post("/profilePicChange", upload.single("avatar"), profilePicChange);
router.post("/profileAboutChange", profileAboutChange);
router.route("/searchUser").get(searchUser);
router.route("/userList").get(userList);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
