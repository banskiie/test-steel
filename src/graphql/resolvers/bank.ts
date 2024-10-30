import { IAuthRequest } from "../../interfaces/auth.js"
import { IBank, IBanks, IBankInput } from "../../interfaces/bank.js"
import { PubSub } from "graphql-subscriptions"
import Bank from "../../models/bank.js"
import { GraphQLError } from "graphql"
import Log from "../../models/logs.js"

const pubSub = new PubSub()

export const bankResolvers = {
  Query: {
    bank: async (
      _: any,
      { _id }: IBankInput,
      request: IAuthRequest
    ): Promise<IBank> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const bank = await Bank.findById(_id).populate({ path: "branch" })
        if (!bank)
          throw new GraphQLError("Bank does not exist.", {
            extensions: {
              http: {
                status: 400,
              },
            },
          })
        return bank
      } catch (error) {
        throw error
      }
    },
    banks: async (_: any, i: any, request: IAuthRequest): Promise<IBanks> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const banks = await Bank.find({ status: true }).populate({
          path: "branch",
        })
        if (!banks)
          throw new GraphQLError("Error fetching banks.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return {
          list: banks,
          total: banks.length,
        }
      } catch (error) {
        throw error
      }
    },
    deactivatedBanks: async (
      _: any,
      i: any,
      request: IAuthRequest
    ): Promise<IBanks> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const banks = await Bank.find({ status: false }).populate({
          path: "branch",
        })
        if (!banks)
          throw new GraphQLError("Error fetching banks.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return {
          list: banks,
          total: banks.length,
        }
      } catch (error) {
        throw error
      }
    },
  },
  Mutation: {
    createBank: async (
      _: any,
      { input }: IBankInput,
      request: IAuthRequest
    ): Promise<IBank> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const bank = await Bank.create(input)
        const bankCreated = await Bank.findById(bank._id).populate({
          path: "branch",
        })
        if (!bankCreated)
          throw new GraphQLError("Error fetching branch.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        pubSub.publish("BANK_CREATED", { bankCreated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `New Bank Created: ${bankCreated.name}`,
        })

        return bankCreated
      } catch (error) {
        throw error
      }
    },
    updateBank: async (
      _: any,
      { _id, input }: IBankInput,
      request: IAuthRequest
    ): Promise<IBank> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const bankUpdated = await Bank.findByIdAndUpdate(_id, input, {
          new: true,
          populate: {
            path: "branch",
          },
        })
        if (!bankUpdated)
          throw new GraphQLError("Error fetching branch.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        pubSub.publish("BANK_UPDATED", { bankUpdated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Bank Updated: ${bankUpdated.name}`,
        })

        return bankUpdated
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
    deactivateBank: async (
      _: any,
      { _id }: IBankInput,
      request: IAuthRequest
    ): Promise<IBank> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const bankDeactivated = await Bank.findByIdAndUpdate(
          _id,
          { status: false },
          {
            new: true,
            populate: {
              path: "branch",
            },
          }
        )
        if (!bankDeactivated)
          throw new GraphQLError("Error fetching branch.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        pubSub.publish("BANK_DEACTIVATED", { bankDeactivated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Bank Deactivated: ${bankDeactivated.name}`,
        })

        return bankDeactivated
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
    restoreBank: async (
      _: any,
      { _id }: IBankInput,
      request: IAuthRequest
    ): Promise<IBank> => {
      if (!request.isAuth)
        throw new GraphQLError("Error fetching branch.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const bankRestored = await Bank.findByIdAndUpdate(
          _id,
          { status: true },
          {
            new: true,
            populate: {
              path: "branch",
            },
          }
        )
        if (!bankRestored)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })

        pubSub.publish("BANK_RESTORED", { bankRestored })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Bank Restored: ${bankRestored.name}`,
        })

        return bankRestored
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
    bankCreated: {
      subscribe: () => pubSub.asyncIterator(["BANK_CREATED"]),
    },
    bankUpdated: {
      subscribe: () => pubSub.asyncIterator(["BANK_UPDATED"]),
    },
    bankDeactivated: {
      subscribe: () => pubSub.asyncIterator(["BANK_DEACTIVATED"]),
    },
    bankRestored: {
      subscribe: () => pubSub.asyncIterator(["BANK_RESTORED"]),
    },
  },
}
