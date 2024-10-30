import { Schema, model } from "mongoose";
const BlacklistTokenSchema = new Schema({
    token: {
        type: Schema.Types.String,
        required: [true, "Blacklist token is required."],
        unique: true,
    },
}, {
    timestamps: true,
});
export default model("Blacklist_Token", BlacklistTokenSchema);
