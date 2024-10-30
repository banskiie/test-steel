import fs from "fs";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jose from "node-jose";
import { PubSub } from "graphql-subscriptions";
import User from "../../models/user.js";
import Log from "../../models/logs.js";
import { GraphQLError } from "graphql";
import BlacklistToken from "../../models/blacklistToken.js";
dotenv.config();
const pubSub = new PubSub();
export const authResolvers = {
    Query: {
        logout: async (_, { token }, request) => {
            try {
                const isBlacklisted = await BlacklistToken.findOne({ token });
                if (isBlacklisted)
                    throw new GraphQLError("Invalid Authentication.", {
                        extensions: {
                            http: {
                                status: 401,
                            },
                        },
                    });
                await BlacklistToken.create({ token });
                const path = process.env.PUBLIC_KEY_PATH;
                if (!path)
                    throw new GraphQLError("Invalid Authentication.", {
                        extensions: {
                            http: {
                                status: 401,
                            },
                        },
                    });
                const PUBLIC_KEY = fs.readFileSync(path, "utf8");
                const store = jose.JWK.createKeyStore();
                const key = await store.add(PUBLIC_KEY, "pem");
                const result = await jose.JWS.createVerify(key).verify(token);
                const decoded = JSON.parse(result.payload.toString());
                const user = await User.findById(decoded.sub);
                if (!user)
                    throw new GraphQLError("User does not exist.", {
                        extensions: {
                            http: {
                                status: 400,
                            },
                        },
                    });
                await Log.create({
                    user: request.userId,
                    role: request.userRole,
                    description: `User Logged Out: ${user.last_name}, ${user.first_name} (${user.role})`,
                });
                return user;
            }
            catch (error) {
                throw error;
            }
        },
        login: async (_, { username, password }, request) => {
            const user = await User.findOne({ username });
            if (!user)
                throw new GraphQLError("User does not exist.", {
                    extensions: {
                        http: {
                            status: 400,
                        },
                    },
                });
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect)
                throw new GraphQLError("Incorrect Password.", {
                    extensions: {
                        http: {
                            status: 400,
                        },
                    },
                });
            try {
                const path = process.env.PRIVATE_KEY_PATH;
                if (!path)
                    throw new GraphQLError("Invalid Authentication.", {
                        extensions: {
                            http: {
                                status: 401,
                            },
                        },
                    });
                const keyId = process.env.KEY_ID;
                const PRIVATE_KEY = fs.readFileSync(path, "utf8");
                const store = jose.JWK.createKeyStore();
                const key = await store.add(PRIVATE_KEY, "pem");
                const token = await jose.JWS.createSign({
                    format: "compact",
                    fields: {
                        alg: "RS256",
                        typ: "JWT",
                        kid: keyId,
                    },
                }, key)
                    .update(JSON.stringify({
                    sub: user._id.toString(),
                    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
                }))
                    .final();
                await Log.create({
                    user: user._id,
                    role: user.role,
                    description: `User Logged In: ${user.last_name}, ${user.first_name} (${user.role})`,
                });
                return token;
            }
            catch (error) {
                throw error;
            }
        },
        verifyPassword: async (_, { _id, password }, request) => {
            if (!request.isAuth)
                throw new GraphQLError("Invalid Authentication.", {
                    extensions: {
                        http: {
                            status: 401,
                        },
                    },
                });
            try {
                const user = await User.findById(_id);
                if (!user)
                    throw new GraphQLError("User doesnt not exist.", {
                        extensions: {
                            http: {
                                status: 401,
                            },
                        },
                    });
                const isPasswordCorrect = await bcrypt.compare(password, user.password);
                return isPasswordCorrect;
            }
            catch (error) {
                throw error;
            }
        },
        logs: async (_, i, request) => {
            if (!request.isAuth)
                throw new GraphQLError("Invalid Authentication.", {
                    extensions: {
                        http: {
                            status: 401,
                        },
                    },
                });
            try {
                const logs = await Log.find()
                    .populate({
                    path: "user",
                    populate: "branch",
                })
                    .sort({ createdAt: -1 });
                if (!logs)
                    throw new GraphQLError("Error fetching logs.", {
                        extensions: {
                            http: {
                                status: 404,
                            },
                        },
                    });
                return {
                    list: logs,
                    total: logs.length,
                };
            }
            catch (error) {
                throw error;
            }
        },
    },
    Mutation: {
        changePassword: async (_, { _id, password }, request) => {
            if (!request.isAuth)
                throw new GraphQLError("Invalid Authentication.", {
                    extensions: {
                        http: {
                            status: 401,
                        },
                    },
                });
            try {
                const userUpdated = await User.findByIdAndUpdate(_id, { password: await bcrypt.hash(password, 12) }, { new: true, populate: { path: "branch" } });
                if (!userUpdated)
                    throw new GraphQLError("User update error.", {
                        extensions: {
                            http: {
                                status: 401,
                            },
                        },
                    });
                pubSub.publish("USER_UPDATED", { userUpdated });
                await Log.create({
                    user: request.userId,
                    role: request.userRole,
                    description: `User Changed Password: ${userUpdated.last_name}, ${userUpdated.first_name} (${userUpdated.role})`,
                });
                return userUpdated;
            }
            catch (error) {
                throw error;
            }
        },
    },
};
