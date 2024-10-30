import express from "express";
import bodyParser from "body-parser";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { typeDefs } from "./graphql/schemas/index.js";
import { resolvers } from "./graphql/resolvers/index.js";
// Authentication
import auth from "./middleware/auth.js";
dotenv.config();
const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
const MONGODB_URI = "mongodb+srv://root:TQ2Uj6YDd8DJNenJ@test-cluster.qfxx9.mongodb.net/steeldb?retryWrites=true&w=majority&appName=test-cluster";
const IP_ADDRESS = "192.168.6.56";
const PATH = "/graphql";
const PORT = 85;
// Initialize Server
app.use(auth);
app.use(bodyParser.json());
// Handle CORS Policy
// "*" to allow ALL
app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return next();
});
const httpServer = http.createServer(app);
// WebSocket Subscription Server
const wsServer = new WebSocketServer({
    server: httpServer,
    path: PATH,
});
const serverCleanup = useServer({ schema }, wsServer);
// Initialize Apollo Server
const server = new ApolloServer({
    schema,
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});
// Start Server
await server.start();
// Middleware Handling
app.use(PATH, cors(), express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({
        userId: req.userId,
        userRole: req.userRole,
        isAuth: req.isAuth,
    }),
}));
// Connect to MongoDB
mongoose
    .connect(MONGODB_URI)
    .then(() => {
    httpServer.listen(PORT, parseInt(IP_ADDRESS), () => {
        console.log(`🚀 Server ready at http://${IP_ADDRESS}:${PORT}`);
    });
})
    .catch((error) => console.log(error));
