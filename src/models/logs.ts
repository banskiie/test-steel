import { Schema, model } from "mongoose"
import { ILog } from "../interfaces/auth.js"

const LogSchema = new Schema<ILog>(
  {
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
  },
  { timestamps: true }
)

export default model<ILog>("Log", LogSchema)
