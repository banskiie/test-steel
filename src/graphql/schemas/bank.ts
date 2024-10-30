const gql = String.raw

export const bankSchema = gql`
  #graphql

  type Bank {
    _id: ID!
    name: String!
    account_name: String!
    account_number: String!
    branch: Branch!
    status: Boolean!
  }

  type BanksResponse {
    list: [Bank]!
    total: Int!
  }

  input BankInput {
    name: String!
    account_name: String!
    account_number: String!
    branch: ID!
  }

  type Query {
    bank(_id: ID!): Bank!
    banks: BanksResponse
    deactivatedBanks: BanksResponse
  }

  type Mutation {
    createBank(input: BankInput!): Bank
    updateBank(_id: ID!, input: BankInput!): Bank
    deactivateBank(_id: ID!): Bank
    restoreBank(_id: ID!): Bank
  }

  type Subscription {
    bankCreated: Bank!
    bankUpdated: Bank!
    bankDeactivated: Bank!
    bankRestored: Bank!
  }
`
