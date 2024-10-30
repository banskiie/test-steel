import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import { IAuthRequest } from "../../interfaces/auth.js"
import { IUser, IUserInput, IUsers } from "../../interfaces/user.js"
import { PubSub } from "graphql-subscriptions"
import User from "../../models/user.js"
import { GraphQLError } from "graphql"
import Log from "../../models/logs.js"

dotenv.config()
const pubSub = new PubSub()

export const userResolvers = {
  Query: {
    user: async (
      _: any,
      { _id }: IUserInput,
      request: IAuthRequest
    ): Promise<IUser> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const user = await User.findById(_id).populate({ path: "branch" })
        if (!user)
          throw new GraphQLError("User does not exist.", {
            extensions: {
              http: {
                status: 400,
              },
            },
          })
        return user
      } catch (error) {
        throw error
      }
    },
    users: async (_: any, i: any, request: IAuthRequest): Promise<IUsers> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const users = await User.find({ status: true }).sort({ createdAt: -1 })
        if (!users)
          throw new GraphQLError("Error fetching users.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return {
          list: users,
          total: users.length,
        }
      } catch (error) {
        throw error
      }
    },
    deactivatedUsers: async (
      _: any,
      i: any,
      request: IAuthRequest
    ): Promise<IUsers> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const users = await User.find({ status: false })
        if (!users)
          throw new GraphQLError("Error fetching deactivated users.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return { list: users, total: users.length }
      } catch (error) {
        throw error
      }
    },
  },
  Mutation: {
    createUser: async (
      _: any,
      { input }: IUserInput,
      request: IAuthRequest
    ): Promise<IUser> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const hashedPassword = await bcrypt.hash(
          `${input.username}.${input.role}`,
          12
        )
        const user = await User.create({ ...input, password: hashedPassword })

        const userCreated = await User.findById(user._id).populate("branch")
        if (!userCreated)
          throw new GraphQLError("Error fetching user.", {
            extensions: {
              http: {
                status: 400,
              },
            },
          })
        pubSub.publish("USER_CREATED", { userCreated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `New User Created: ${userCreated.last_name}, ${userCreated.first_name} (${userCreated.role})`,
        })

        return userCreated
      } catch (error: any) {
        if (error.name === "ValidationError") {
          const validationErrors = Object.values(error.errors).map(
            (err: any) => ({
              path: err.path,
              message: err.message,
            })
          )

          throw new GraphQLError("Validation failed", {
            extensions: {
              http: {
                status: 400,
              },
              errors: validationErrors,
            },
          })
        }
        throw error
      }
    },
    updateUser: async (
      _: any,
      { _id, input }: IUserInput,
      request: IAuthRequest
    ): Promise<IUser> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const userUpdated = await User.findByIdAndUpdate(_id, input, {
          new: true,
        })
        if (!userUpdated)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        pubSub.publish("USER_UPDATED", { userUpdated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `User Updated: ${userUpdated.last_name}, ${userUpdated.first_name} (${userUpdated.role})`,
        })

        return userUpdated
      } catch (error: any) {
        if (error.name === "ValidationError") {
          const validationErrors = Object.values(error.errors).map(
            (err: any) => ({
              path: err.path,
              message: err.message,
            })
          )

          throw new GraphQLError("Validation failed", {
            extensions: {
              http: {
                status: 400,
              },
              errors: validationErrors,
            },
          })
        }
        throw error
      }
    },
    deactivateUser: async (
      _: any,
      { _id }: IUserInput,
      request: IAuthRequest
    ): Promise<IUser> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      if (request.userId == _id.toString()) {
        throw new GraphQLError("You can deactivate yourself.", {
          extensions: {
            http: {
              status: 400,
            },
          },
        })
      }

      try {
        const userDeactivated = await User.findByIdAndUpdate(
          _id,
          { status: false },
          { new: true, populate: { path: "branch" } }
        )
        if (!userDeactivated)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })

        pubSub.publish("USER_DEACTIVATED", { userDeactivated })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `User Deactivated: ${userDeactivated.last_name}, ${userDeactivated.first_name} (${userDeactivated.role})`,
        })

        return userDeactivated
      } catch (error: any) {
        if (error.name === "ValidationError") {
          const validationErrors = Object.values(error.errors).map(
            (err: any) => ({
              path: err.path,
              message: err.message,
            })
          )

          throw new GraphQLError("Validation failed", {
            extensions: {
              http: {
                status: 400,
              },
              errors: validationErrors,
            },
          })
        }
        throw error
      }
    },
    restoreUser: async (
      _: any,
      { _id }: IUserInput,
      request: IAuthRequest
    ): Promise<IUser> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const userRestored = await User.findByIdAndUpdate(
          _id,
          { status: true },
          { new: true, populate: { path: "branch" } }
        )
        if (!userRestored)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        pubSub.publish("USER_RESTORED", { userRestored })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `User Restored: ${userRestored.last_name}, ${userRestored.first_name} (${userRestored.role})`,
        })

        return userRestored
      } catch (error: any) {
        if (error.name === "ValidationError") {
          const validationErrors = Object.values(error.errors).map(
            (err: any) => ({
              path: err.path,
              message: err.message,
            })
          )

          throw new GraphQLError("Validation failed", {
            extensions: {
              http: {
                status: 400,
              },
              errors: validationErrors,
            },
          })
        }
        throw error
      }
    },
  },
  Subscription: {
    userCreated: {
      subscribe: () => pubSub.asyncIterator(["USER_CREATED"]),
    },
    userUpdated: {
      subscribe: () => pubSub.asyncIterator(["USER_UPDATED"]),
    },
    userDeactivated: {
      subscribe: () => pubSub.asyncIterator(["USER_DEACTIVATED"]),
    },
    userRestored: {
      subscribe: () => pubSub.asyncIterator(["USER_RESTORED"]),
    },
  },
}
