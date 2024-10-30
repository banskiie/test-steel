const gql = String.raw

export const userSchema = gql`
  #graphql

  enum Role {
    admin
    accounting
    production_head
    production_staff
    sales
    stock_room
    checker
  }

  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    username: String!
    email_address: String!
    contact_number: String
    role: Role
    gatepass_username: String
    department: String!
    position: String!
    branch: Branch
    status: Boolean!
  }

  type UsersResponse {
    list: [User]!
    total: Int!
  }

  input UserInput {
    first_name: String!
    last_name: String!
    username: String!
    email_address: String!
    contact_number: String
    role: Role
    gatepass_username: String
    department: String!
    position: String!
    branch: ID!
  }

  type Query {
    user(_id: ID!): User!
    users: UsersResponse
    deactivatedUsers: UsersResponse
  }

  type Mutation {
    createUser(input: UserInput!): User
    updateUser(_id: ID!, input: UserInput!): User
    deactivateUser(_id: ID!): User
    restoreUser(_id: ID!): User
  }

  type Subscription {
    userCreated: User!
    userUpdated: User!
    userDeactivated: User!
    userRestored: User!
  }
`
