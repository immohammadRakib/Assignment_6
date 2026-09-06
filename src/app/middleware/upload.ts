import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary'; // 👈 সরাসরি cloudinary লাইব্রেরি ইম্পোর্ট করুন
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config'; // 👈 আপনার এই কনফিগ ফাইলটি ইম্পোর্ট করা হলো (পাথ ঠিক দেখে নিবেন)

// ১. আপনার কনফিগ অবজেক্টের ডেটা দিয়ে ক্লাউডিনারি কনফিগার করা হলো
cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// ২. ক্লাউডিনারি স্টোরেজ সেটআপ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // 👈 কনফিগার করা cloudinary অবজেক্ট
  params: async (req: any, file: any) => {
    return {
      folder: 'app_uploads', 
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.').slice(0, -1).join('.')}`,
    };
  },
});

// সিঙ্গেল ইমেজ আপলোডের জন্য মিডলওয়্যার
export const uploadSingle = multer({ storage }).single('profileImage');

// একাধিক ইমেজ আপলোডের মিডলওয়্যার
export const uploadMultiple = multer({ storage }).array('images', 5);
