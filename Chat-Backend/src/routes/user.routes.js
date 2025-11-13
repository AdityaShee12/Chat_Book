import { Router } from "express";
import {
  sendOtp,
  registerUser,
  loginUser,
  logoutUser,
  searchUser,
  setPassword,
  profilePicChange,
  profileAboutChange,
  userList,
  statusUpload,
    statusShow,
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
router.route("/passwordChange").post(setPassword);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/status").post(
  upload.fields([
    {
      name: "status",
      maxCount: 1,
    },
  ]),
  statusUpload
);
router.post("/profilePicChange", upload.single("avatar"), profilePicChange);
router.post("/profileAboutChange", profileAboutChange);
router.route("/searchUser").get(searchUser);
router.route("/userList").get(userList);
router.route("/statusShow").post(statusShow);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
