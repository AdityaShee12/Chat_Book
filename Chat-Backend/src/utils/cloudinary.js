import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "drargfdfb",
  api_key: "876421259555577",
  api_secret: "kmHqL8MT1qDDCI8dL5Y79YfLo94",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("Localfilepath", localFilePath);

    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("Response", response);

    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
