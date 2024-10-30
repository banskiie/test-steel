import { mergeTypeDefs } from "@graphql-tools/merge";
import { authSchema } from "./auth.js";
import { userSchema } from "./user.js";
import { branchSchema } from "./branch.js";
import { bankSchema } from "./bank.js";
export const typeDefs = mergeTypeDefs([
    authSchema,
    userSchema,
    branchSchema,
    bankSchema,
]);
