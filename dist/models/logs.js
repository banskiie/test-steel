import { Schema, model } from "mongoose";
const LogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required."],
    },
    role: {
        type: Schema.Types.String,
        required: [true, "Role is required."],
    },
    description: {
        type: Schema.Types.String,
        required: [true, "Description is required."],
    },
}, { timestamps: true });
export default model("Log", LogSchema);
