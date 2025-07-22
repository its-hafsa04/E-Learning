import mongoose from "mongoose";
require("dotenv").config();

// Connect to MongoDB
const dburl: string = process.env.MONGO_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dburl).then((data:any)=>{
        console.log(`MongoDB connected with server: ${data.connection.host}`);
    })
    } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};

// Export the connectDB function
export default connectDB;