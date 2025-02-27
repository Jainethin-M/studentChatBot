import { mergeTypeDefs } from "@graphql-tools/merge";
import chatTypeDefs from "./chat.typeDefs.js";


const mergedTypeDefs = mergeTypeDefs([chatTypeDefs])

export default mergedTypeDefs