import { Schema, model } from "mongoose"
import { IUser } from "../interfaces/user.js"
import { Roles } from "./enums/index.js"

const UserSchema = new Schema<IUser>(
  {
    first_name: {
      type: Schema.Types.String,
      required: [true, "First name is required."],
    },
    last_name: {
      type: Schema.Types.String,
      required: [true, "Last name is required."],
    },
    username: {
      type: Schema.Types.String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [4, "Username have atleast 4 characters."],
    },
    password: {
      type: Schema.Types.String,
      required: true,
      minlength: [4, "Pasword have atleast 4 characters."],
    },
    email_address: {
      type: Schema.Types.String,
      required: [true, "Email Address is required."],
      unique: true,
      validate: {
        validator: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(value)
        },
        message: "Please provide a valid email address",
      },
    },
    contact_number: {
      type: Schema.Types.String,
      unique: true,
    },
    role: {
      type: Schema.Types.String,
      require: true,
      enum: {
        values: Object.values(Roles),
        message: "Please select a valid role.",
      },
    },
    gatepass_username: {
      type: Schema.Types.String,
      unique: true,
    },
    department: {
      type: Schema.Types.String,
      required: [true, "Department is required."],
    },
    position: {
      type: Schema.Types.String,
      required: [true, "Position is required."],
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required."],
    },
    status: {
      type: Schema.Types.Boolean,
      required: [true, "Status is required."],
      default: true,
    },
  },
  { timestamps: true }
)

export default model<IUser>("User", UserSchema)
