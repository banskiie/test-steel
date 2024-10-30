import { Schema, model } from "mongoose"
import { IBank } from "../interfaces/bank.js"

const BankSchema = new Schema<IBank>(
  {
    name: {
      type: Schema.Types.String,
      required: [true, "Bank Name is required."],
    },
    account_name: {
      type: Schema.Types.String,
      required: [true, "Account Name is required."],
    },
    account_number: {
      type: Schema.Types.String,
      required: [true, "Account Number is required."],
      unique: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required."],
    },
    status: { type: Schema.Types.Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

export default model<IBank>("Bank", BankSchema)
