import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary'; 
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config'; 

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary, 
  params: async (req: any, file: any) => {
    return {
      folder: 'app_uploads', 
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.').slice(0, -1).join('.')}`,
    };
  },
});

export const uploadSingle = multer({ storage }).single('profileImage');

export const uploadMultiple = multer({ storage }).array('images', 5);
