import express from "express";
import http from "http";
import cors from "cors";
import { configDotenv } from "dotenv";
import path from "path";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import { connectDB } from "./db/connectDB.js";

configDotenv()

const __dirname = path.resolve();
const app = express();
const httpServer = http.createServer(app);
// console.log(process.env.HMONGODB_URI);
// ✅ Connect to MongoDB
await connectDB();




// ✅ Middleware Configuration
app.use(
  cors({
    origin: ["https://experience.elluciancloud.com" , '/graphql'],
    credentials: true,
	  
  })
);
app.use(express.json());




// ✅ GraphQL Schema
const schema = makeExecutableSchema({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
});

// ✅ WebSocket Server (for Subscriptions)
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    schema,
    context: (ctx, msg, args) => {
      return { ctx };
    },
  },
  wsServer
);

// ✅ Apollo Server with WebSockets Support
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

await server.start();

// ✅ Apply Apollo Middleware
app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req, res }) => ({ req, res }),
  })
);

// ✅ Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }); 
}

// ✅ Start Server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 WebSocket Subscriptions ready at ws://localhost:${PORT}/graphql`);
  
});
// await askQuestion('department',"67bffe6d84ff963737ab96af");
