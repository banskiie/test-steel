import { Schema, model } from "mongoose"
import { IBranch } from "../interfaces/branch.js"

const BranchSchema = new Schema<IBranch>(
  {
    name: {
      type: Schema.Types.String,
      required: [true, "Branch name is required."],
    },
    status: {
      type: Schema.Types.Boolean,
      required: [true, "Status is required."],
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export default model<IBranch>("Branch", BranchSchema)
