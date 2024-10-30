import { IAuthRequest } from "../../interfaces/auth.js"
import { IBranch, IBranches, IBranchInput } from "../../interfaces/branch.js"
import { PubSub } from "graphql-subscriptions"
import Branch from "../../models/branch.js"
import { GraphQLError } from "graphql"
import Log from "../../models/logs.js"

const pubSub = new PubSub()

export const branchResolvers = {
  Query: {
    branch: async (
      _: any,
      { _id }: IBranchInput,
      request: IAuthRequest
    ): Promise<IBranch> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const branch = await Branch.findById(_id)
        if (!branch)
          throw new GraphQLError("Branch does not exist.", {
            extensions: {
              http: {
                status: 400,
              },
            },
          })
        return branch
      } catch (error) {
        throw error
      }
    },
    branches: async (
      _: any,
      i: any,
      request: IAuthRequest
    ): Promise<IBranches> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const branches = await Branch.find({ status: true })
        if (!branches)
          throw new GraphQLError("Error fetching branches.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return {
          list: branches,
          total: branches.length,
        }
      } catch (error) {
        throw error
      }
    },
    deactivatedBranches: async (
      _: any,
      i: any,
      request: IAuthRequest
    ): Promise<IBranches> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })
      try {
        const branches = await Branch.find({ status: false })
        if (!branches)
          throw new GraphQLError("Error fetching branches.", {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        return {
          list: branches,
          total: branches.length,
        }
      } catch (error) {
        throw error
      }
    },
  },
  Mutation: {
    createBranch: async (
      _: any,
      { input }: IBranchInput,
      request: IAuthRequest
    ): Promise<IBranch> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const branchCreated = await Branch.create(input)
        pubSub.publish("BRANCH_CREATED", { branchCreated })

        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `New Branch Created: ${branchCreated.name}`,
        })

        return branchCreated
      } catch (error) {
        throw error
      }
    },
    updateBranch: async (
      _: any,
      { _id, input }: IBranchInput,
      request: IAuthRequest
    ): Promise<IBranch> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const branchUpdated = await Branch.findByIdAndUpdate(_id, input, {
          new: true,
        })
        if (!branchUpdated)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })

        pubSub.publish("BRANCH_UPDATED", { branchUpdated })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Branch Updated: ${branchUpdated.name}`,
        })

        return branchUpdated
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
    deactivateBranch: async (
      _: any,
      { _id }: IBranchInput,
      request: IAuthRequest
    ): Promise<IBranch> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const branchDeactivated = await Branch.findByIdAndUpdate(
          _id,
          { status: false },
          { new: true }
        )
        if (!branchDeactivated)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })

        pubSub.publish("BRANCH_DEACTIVATED", { branchDeactivated })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Branch Deactivated: ${branchDeactivated.name}`,
        })

        return branchDeactivated
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
    restoreBranch: async (
      _: any,
      { _id }: IBranchInput,
      request: IAuthRequest
    ): Promise<IBranch> => {
      if (!request.isAuth)
        throw new GraphQLError("Invalid Authentication.", {
          extensions: {
            http: {
              status: 401,
            },
          },
        })

      try {
        const branchRestored = await Branch.findByIdAndUpdate(
          _id,
          { status: true },
          { new: true }
        )
        if (!branchRestored)
          throw new GraphQLError("Invalid Authentication.", {
            extensions: {
              http: {
                status: 401,
              },
            },
          })

        pubSub.publish("BRANCH_RESTORED", { branchRestored })
        await Log.create({
          user: request.userId,
          role: request.userRole,
          description: `Branch Restored: ${branchRestored.name}`,
        })

        return branchRestored
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
    branchCreated: {
      subscribe: () => pubSub.asyncIterator(["BRANCH_CREATED"]),
    },
    branchUpdated: {
      subscribe: () => pubSub.asyncIterator(["BRANCH_UPDATED"]),
    },
    branchDeactivated: {
      subscribe: () => pubSub.asyncIterator(["BRANCH_DEACTIVATED"]),
    },
    branchRestored: {
      subscribe: () => pubSub.asyncIterator(["BRANCH_RESTORED"]),
    },
  },
}
