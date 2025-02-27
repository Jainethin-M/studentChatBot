const chatTypeDefs = `#graphql
    input Chat {
        message: String!
        stid : ID!
    }
    type Query {
        getChat(input : Chat!): String!
    }

`
export default chatTypeDefs;     