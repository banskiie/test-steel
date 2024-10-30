import { mergeResolvers } from "@graphql-tools/merge";
import { authResolvers } from "./auth.js";
import { userResolvers } from "./user.js";
import { branchResolvers } from "./branch.js";
import { bankResolvers } from "./bank.js";
export const resolvers = mergeResolvers([
    authResolvers,
    userResolvers,
    branchResolvers,
    bankResolvers,
]);
