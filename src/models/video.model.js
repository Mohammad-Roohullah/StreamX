import mongoose from "mongoose";
import mongooseAggreagePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String, // cloudanary url
        required:true
    },
    thumbnail:{
        type:String, // cloudanary url
        required:true
    },
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
}, {timestamps:true})

videoSchema.plugin(mongooseAggreagePaginate);


const Video = mongoose.model("Video", videoSchema);
export default Video;