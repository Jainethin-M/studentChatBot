import { mergeResolvers } from "@graphql-tools/merge";
import chatResolver from "./chat.resolver.js";

const mergedResolvers = mergeResolvers([chatResolver])

export default mergedResolvers;