import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.DB_URI
        const result = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000
        });
        // console.log(result.models)
        console.log(`✅ DB Connected with Atlas`);
    } catch (error) {
        console.log("❌ DB connection failed", error);
    }
};

export default connectDB;
