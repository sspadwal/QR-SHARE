import mongoose from "mongoose";


const dbConnect = async(uri)=>{
    try {
        const connection = await mongoose.connect(uri);
        console.log("Database connected...")
    } catch (error) {
        console.log("Database Connection Failed",error)
    }
}



export default dbConnect;