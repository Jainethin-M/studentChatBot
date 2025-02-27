const chatTypeDefs = `#graphql
    input Chat {
        message: String!
        stid : ID!
    }
    type Query {
        _empty: String
    }
    type Mutation {
        getChat(input : Chat!): String!
    }

`
export default chatTypeDefs;     