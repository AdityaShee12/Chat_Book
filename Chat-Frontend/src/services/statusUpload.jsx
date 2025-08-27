import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";

const StatusUpload = () => {
  const [statuses, setStatuses] = useState([]);
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userId } = useSelector((state) => state.user);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handlePreviewClick = () => {
    if (file) setIsModalOpen(true);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("status", file);
    formData.append("userId", userId);

    try {
      const response = await axios.post("/api/v1/users/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log("status res", response);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    }
  };

  useEffect(() => {
    const statusShow = async () => {
      const response = await axios.get("/api/v1/users/statusShow",userId);
      console.log(response);     
    };
    statusShow();
  }, []);

  return (
    <div className="mt-4 px-4">
      {/* Modal for preview */}
      {isModalOpen ? (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          <TransformWrapper>
            <TransformComponent>
              {file.type.startsWith("video/") ? (
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-[40rem]  rounded-lg"
                />
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-[30rem] h-[35rem] rounded-lg"
                />
              )}
            </TransformComponent>
          </TransformWrapper>

          {/* Nicher camera icon for new upload */}
          <label htmlFor="status" className="cursor-pointer">
            <AiOutlineCamera size={30} color="white" />
            <input
              type="file"
              id="status"
              accept="image/,video/"
              onChange={(e) => {
                handleFileChange(e);
                setIsModalOpen(false);
              }}
              className="hidden"
            />
          </label>

          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setIsModalOpen(false)}>
            <AiOutlineClose size={40} color="white" />
          </button>
        </div>
      ) : (
        <div className="flex gap-4 ">
          <label htmlFor="status">
            <div
              className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden cursor-pointer"
              onClick={handlePreviewClick}>
              {file ? (
                file.type.startsWith("video/") ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-14 h-14 object-cover rounded-full"
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-14 h-14 object-cover rounded-full"
                  />
                )
              ) : (
                <input
                  type="file"
                  id="status"
                  accept="image/,video/"
                  onChange={handleFileChange}
                  className="hidden"
                />
              )}
            </div>
          </label>

          {file && (
            <div
              className="w-20 h-7 rounded-lg mt-[0.7rem] ml-[0.3rem] text-green-600 text-xl cursor-pointer flex items-center justify-center"
              onClick={handleUpload}>
              Upload
            </div>
          )}
        </div>
      )}

      <div className="py-[1.3rem]">Recent updates</div>

      {statuses.map((status, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-2 hover:bg-gray-100 cursor-pointer">
          {status.file.endsWith(".mp4") || status.file.includes("video") ? (
            <video
              src={status.file}
              className="w-12 h-12 rounded-full border-2 border-green-500 object-cover"
              controls
            />
          ) : (
            <img
              src={status.file}
              alt="status"
              className="w-12 h-12 rounded-full border-2 border-green-500 object-cover"
            />
          )}
          <div>
            <p className="font-medium">User</p>
            <p className="text-sm text-gray-500">Just now</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusUpload;
