import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {    // who is subscribing
        type: Schema.Types.ObjectId, 
        ref: "User" 
    }, 
    channel: {   // who is being subscribed to
        type: Schema.Types.ObjectId, 
        ref: "User" 
    },     
},{ timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription