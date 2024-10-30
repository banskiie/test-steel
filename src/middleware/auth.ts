import fs from "fs"
import dotenv from "dotenv"
import jose from "node-jose"
import { Response, NextFunction } from "express"
import { IAuthRequest } from "../interfaces/auth.js"
import { JwtPayload } from "jsonwebtoken"
import { IUser } from "../interfaces/user.js"
import BlacklistToken from "../models/blacklistToken.js"

import User from "../models/user.js"
import { GraphQLError } from "graphql"

dotenv.config()

export default async (
  request: IAuthRequest,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const header = request.get("Authorization")
  if (!header) {
    request.isAuth = false
    return next()
  }
  const token = header.split(" ")[1]

  try {
    const isBlacklisted = await BlacklistToken.findOne({ token })
    if (isBlacklisted)
      throw new GraphQLError("Invalid Authentication.", {
        extensions: {
          http: {
            status: 401,
          },
        },
      })
    const path = process.env.PUBLIC_KEY_PATH
    if (!path) {
      request.isAuth = false
      return next()
    }
    const PUBLIC_KEY = fs.readFileSync(path, "utf8")
    const store = jose.JWK.createKeyStore()
    const key = await store.add(PUBLIC_KEY, "pem")

    const result = await jose.JWS.createVerify(key).verify(token)
    const decoded = JSON.parse(result.payload.toString()) as JwtPayload
    const { exp, sub } = decoded

    const now = Math.floor(Date.now() / 1000)
    if (!decoded || (exp && exp < now)) {
      request.isAuth = false
      return next()
    }

    const user = await User.findById<IUser>(sub)
    if (!user) {
      request.isAuth = false
      return next()
    }

    request.userId = sub
    request.userRole = user.role
    request.isAuth = true
    return next()
  } catch (error) {
    request.isAuth = false
    return next()
  }
}
