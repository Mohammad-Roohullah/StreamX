import mongoose, {Schema} from "mongoose";
import mongooseAggreagePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({

    name:{ 
        type: String, 
        required: true 
    },
    description:{ 
        type: String, 
        required: true 
    },
    videos: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Video" 
        }
    ],
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },

}, {timestamps: true})

const Playlist = mongoose.model("Playlist", playlistSchema)
export default Playlist