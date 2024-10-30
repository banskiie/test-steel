const gql = String.raw;
export const branchSchema = gql `
  #graphql

  type Branch {
    _id: ID!
    name: String!
    status: Boolean!
  }

  type Branches {
    list: [Branch]!
    total: Int!
  }

  input BranchInput {
    name: String!
  }

  type Query {
    branch(_id: ID!): Branch!
    branches: Branches
    deactivatedBranches: Branches
  }

  type Mutation {
    createBranch(input: BranchInput!): Branch
    updateBranch(_id: ID!, input: BranchInput!): Branch
    deactivateBranch(_id: ID!): Branch
    restoreBranch(_id: ID!): Branch
  }

  type Subscription {
    branchCreated: Branch!
    branchUpdated: Branch!
    branchDeactivated: Branch!
    branchRestored: Branch!
  }
`;
