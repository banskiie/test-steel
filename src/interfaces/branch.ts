import { Request } from "express"
import { ObjectId } from "mongoose"

export interface IBranch extends Request {
  name: string
  status: boolean
}

export interface IBranches {
  list: IBranch[]
  total: number
}

export interface IBranchInput {
  _id: ObjectId
  input: {
    name: string
  }
}
