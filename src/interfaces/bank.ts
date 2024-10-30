import { Request } from "express"
import { Document, ObjectId } from "mongoose"
import { IBranch } from "./branch"

export interface IBank extends Document {
  name: string
  account_name: string
  account_number: string
  branch: IBranch | ObjectId
  status: boolean
}

export interface IBanks {
  list: IBank[]
  total: number
}

export interface IBankInput extends Request {
  _id: ObjectId
  input: {
    name: string
    account_name: string
    account_number: string
    branch: ObjectId
    status: boolean
  }
}
