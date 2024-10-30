const gql = String.raw;
export const authSchema = gql `
  #graphql

  type Log {
    user: User!
    role: String!
    description: String!
  }

  type Logs {
    list: [Log]!
    total: Int!
  }

  type Query {
    login(username: String!, password: String!): String
    logout(token: String!): User!
    verifyPassword(_id: ID!, password: String!): Boolean!
    logs: Logs
  }

  type Mutation {
    changePassword(_id: ID!, password: String!): User
  }
`;
