import { Request } from "express"
import { ObjectId } from "mongoose"
import { IUser } from "./user"

export interface IAuthRequest extends Request {
  userId?: string
  userRole?: string
  isAuth?: boolean
}

export interface IAuth {
  password: string
}

export interface IAuthInput extends IAuth {
  username: string
}

export interface IPasswordInput {
  _id: ObjectId
  password: string
}

export interface ILog {
  user: ObjectId | IUser
  role: string
  description: string
}

export interface ILogs {
  list: ILog[]
  total: number
}
