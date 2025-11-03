import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: "",
  userName: "",
  userAvatar: "",
  userAbout: "",
  selectUser: {
    receiverId: "",
    receiverName: "",
    receiverAvatar: "",
    receiverAbout: "",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload.userId;
    },
    setUserName: (state, action) => {
      state.userName = action.payload.userName;
    },
    setUserAvatar: (state, action) => {
      state.userAvatar = action.payload.userAvatar;
    },
    setUserAbout: (state, action) => {
      state.userAbout = action.payload.userAbout;
    },
    setSelectUser: (state, action) => {
      state.selectUser.receiverId = action.payload.receiverId;
      state.selectUser.receiverName = action.payload.receiverName;
      state.selectUser.receiverAvatar = action.payload.receiverAvatar;
      state.selectUser.receiverAbout = action.payload.receiverAbout;
    },
    clearUser: (state) => {
      state.userId = "";
      state.userName = "";
      state.userAvatar = "";
      state.userAbout = "";
      state.selectUser.receiverId = "";
      state.selectUser.receiverName = "";
      state.selectUser.receiverAvatar = "";
    },
  },
});

export const {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
  setSelectUser,
  clearUser,
} = userSlice.actions;
export default userSlice.reducer;
