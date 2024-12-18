import mongoose,{Schema, Types} from "mongoose";

const subcriptionSchema = new Schema({
    subscriber: {
        Types: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        Types: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

export const Subcription = mongoose.model("Subscription",
    subcriptionSchema
)