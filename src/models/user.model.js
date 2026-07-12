import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    password:{
        type:String,
        required: [true, "Password is required"]
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudanary url
        required:true
    },
    coverImage:{
        type:String, 
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,    
            ref:"Video"
        }
    ],
    refreshToken:{
        type:String,
    }
}, {timestamps:true})

userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            username: this.username
        }, 
        process.env.ACCESS_TOKEN_SECRET, 
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRATION}
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            userId: this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET, 
        {expiresIn:process.env.REFRESH_TOKEN_EXPIRATION}
    )
}

export const User = mongoose.model("User", userSchema);