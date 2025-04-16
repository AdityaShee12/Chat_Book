import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Google authentication failed" });

    // Send JWT token in HTTP-only cookie
    res.cookie("token", req.user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect(process.env.CLIENT_URL);
  }
);

export default router;
