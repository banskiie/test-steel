import { Schema, model } from "mongoose"

// Used for filtering logged out users
interface IBlacklistToken {
  token: string
}

const BlacklistTokenSchema = new Schema<IBlacklistToken>(
  {
    token: {
      type: Schema.Types.String,
      required: [true, "Blacklist token is required."],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

export default model<IBlacklistToken>("Blacklist_Token", BlacklistTokenSchema)
