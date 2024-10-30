import { Request } from "express"
import { IBranch } from "./branch.js"
import { Document, ObjectId } from "mongoose"

export type TRole =
  | "admin"
  | "accounting"
  | "production_head"
  | "production_staff"
  | "sales"
  | "stock_room"
  | "checker"

export interface IUser extends Document {
  _id: ObjectId
  first_name: string
  last_name: string
  email_address: string
  contact_number: string
  username: string
  password: string
  role: TRole
  department: string
  position: string
  gatepass_username?: string
  branch: IBranch | ObjectId
  status: boolean
}

export interface IUsers {
  list: IUser[]
  total: number
}

export interface IUserInput extends Request {
  _id: ObjectId
  input: {
    first_name: string
    last_name: string
    email_address: string
    contact_number: string
    username: string
    role: TRole
    department: string
    position: string
    gatepass_username?: string
    branch: ObjectId
  }
}
