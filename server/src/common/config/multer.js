import multer from 'multer';
import path from 'path';


// const storage=multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,"server/src/public")
//     },
//     filename:(req,file,cd)=>{
//         const uniqueName = Date.now() + "-" + file.originalname;
//     }
// });

// const fileFilter = (req, file, cb) => {
//     const allowedTypes = [
//         "image/jpeg",
//         "image/png",
//         "application/pdf"
//     ];

//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only JPG, PNG, and PDF files allowed"), false);
//     }
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: {
//         fileSize: 10 * 1024 * 1024 // 10MB
//     }
// });

let fileName;

const storage = multer.memoryStorage();
// const storage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,"uploads/")
//     },
//     filename:(req,file,cb)=>{
//         const orignalfilename=file.originalname;
//         const extension= path.extname(orignalfilename);
//         fileName= Date.now() + extension;
//         console.log("File name is : ",fileName)
//         cb(null,fileName);
//     }
// })

const upload = multer({
   storage: storage,
   limits: {
       fileSize: 10 * 1024 * 1024 // 10MB
   }
});
export default upload;