import { Schema, model } from "mongoose";
const BranchSchema = new Schema({
    name: {
        type: Schema.Types.String,
        required: [true, "Branch name is required."],
    },
    status: {
        type: Schema.Types.Boolean,
        required: [true, "Status is required."],
        default: true,
    },
}, {
    timestamps: true,
});
export default model("Branch", BranchSchema);
