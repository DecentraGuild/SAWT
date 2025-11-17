# GraphQL Test Queries for Transactions

Copy and paste these queries into the GraphQL explorer at `https://graph.roguedatahub.xyz/graphql`

## Test 1: Single Account Mint Query
Test if we can query mints for one account:

```graphql
query TestSingleAccountMint {
  allSolanaTokenMints(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      byInstruction
      byProgram
      instruction
      timestamp
      program
      signature
      id
      instructionIdx
      instructionInnerIdx
      mint
      nodeId
    }
    pageInfo {
      endCursor
      hasNextPage
    }
    totalCount
  }
}
```

## Test 2: Multiple Accounts Using Aliases
Test querying multiple accounts in parallel using aliases:

```graphql
query TestMultipleAccountsMints {
  account1: allSolanaTokenMints(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  account2: allSolanaTokenMints(
    condition: { account: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  account3: allSolanaTokenMints(
    condition: { account: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  account4: allSolanaTokenMints(
    condition: { account: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  account5: allSolanaTokenMints(
    condition: { account: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
}
```

## Test 3: Array/IN Condition (if supported)
Test if the API supports filtering by multiple accounts using an array:

```graphql
query TestArrayConditionMints {
  allSolanaTokenMints(
    condition: { 
      account: { in: [
        "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx",
        "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD",
        "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24",
        "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ",
        "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ"
      ]}
    }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

## Test 4: OR Condition (if supported)
Test if the API supports OR conditions:

```graphql
query TestORConditionMints {
  allSolanaTokenMints(
    condition: { 
      or: [
        { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
        { account: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
        { account: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
        { account: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
        { account: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
      ]
    }
    first: 50
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

## Test 5: Burns Query (Single Account)
Test burns for one account:

```graphql
query TestSingleAccountBurn {
  allSolanaTokenBurns(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      id
    }
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

## Test 6: Transfers Query (Single Account)
Test transfers for one account:

```graphql
query TestSingleAccountTransfer {
  allSolanaTokenTransfers(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      id
    }
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

## Test 7: Combined Query - All Transaction Types
Test all three transaction types for one account:

```graphql
query TestAllTransactionTypes {
  mints: allSolanaTokenMints(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  burns: allSolanaTokenBurns(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
    }
    totalCount
  }
  
  transfers: allSolanaTokenTransfers(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
    }
    totalCount
  }
}
```

## Test 8: Extended Multi-Account Query (All Transaction Types)
**COMPREHENSIVE TEST** - Tests all 10 accounts with mints, burns, and transfers (checking both directions for transfers):

```graphql
query TestExtendedMultiAccountAllTransactions {
  # Account 1: 2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx
  account1_mints: allSolanaTokenMints(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account1_burns: allSolanaTokenBurns(
    condition: { account: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account1_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account1_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2AU738YddPhLkJhphStetsmkn7RrwLGFyPdZ8rDLoCqx" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 2: 2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD
  account2_mints: allSolanaTokenMints(
    condition: { account: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account2_burns: allSolanaTokenBurns(
    condition: { account: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account2_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account2_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2GuUkrBfKfKTHgvQ2UuhkQoVqeMrTppufyuQ2EiT72WD" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 3: 2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24
  account3_mints: allSolanaTokenMints(
    condition: { account: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account3_burns: allSolanaTokenBurns(
    condition: { account: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account3_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account3_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2KsAtv6Vqg4t1qq3RLY1p35MU56bWa5bWcVVtMH3tk24" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 4: 2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ
  account4_mints: allSolanaTokenMints(
    condition: { account: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account4_burns: allSolanaTokenBurns(
    condition: { account: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account4_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account4_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2NJEfhgPjMjVjumL37diLJTnXQC7LVTjYJedwgp1ntBZ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 5: 2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ
  account5_mints: allSolanaTokenMints(
    condition: { account: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account5_burns: allSolanaTokenBurns(
    condition: { account: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account5_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account5_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2S3exGdVnjvPCLJ6UbMe55mJZJ9AKPHZHitLPfFKViTJ" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 6: 2VVVvhu72Zzk6ZD3vbhsBUmAS6ZEjMMXgMF23Jnm9LQ6
  account6_mints: allSolanaTokenMints(
    condition: { account: "2VVVvhu72Zzk6ZD3vbhsBUmAS6ZEjMMXgMF23Jnm9LQ6" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account6_burns: allSolanaTokenBurns(
    condition: { account: "2VVVvhu72Zzk6ZD3vbhsBUmAS6ZEjMMXgMF23Jnm9LQ6" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account6_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2VVVvhu72Zzk6ZD3vbhsBUmAS6ZEjMMXgMF23Jnm9LQ6" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account6_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2VVVvhu72Zzk6ZD3vbhsBUmAS6ZEjMMXgMF23Jnm9LQ6" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 7: 2kXFFzjCNQTHa675ZqDkNo79PrWnEJnr16r9b214cs8p
  account7_mints: allSolanaTokenMints(
    condition: { account: "2kXFFzjCNQTHa675ZqDkNo79PrWnEJnr16r9b214cs8p" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account7_burns: allSolanaTokenBurns(
    condition: { account: "2kXFFzjCNQTHa675ZqDkNo79PrWnEJnr16r9b214cs8p" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account7_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2kXFFzjCNQTHa675ZqDkNo79PrWnEJnr16r9b214cs8p" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account7_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2kXFFzjCNQTHa675ZqDkNo79PrWnEJnr16r9b214cs8p" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 8: 2pN5xXuLQuPhZ9wa3EhAn3eNghNc7TRDpkCEK2gQMWSb
  account8_mints: allSolanaTokenMints(
    condition: { account: "2pN5xXuLQuPhZ9wa3EhAn3eNghNc7TRDpkCEK2gQMWSb" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account8_burns: allSolanaTokenBurns(
    condition: { account: "2pN5xXuLQuPhZ9wa3EhAn3eNghNc7TRDpkCEK2gQMWSb" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account8_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2pN5xXuLQuPhZ9wa3EhAn3eNghNc7TRDpkCEK2gQMWSb" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account8_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2pN5xXuLQuPhZ9wa3EhAn3eNghNc7TRDpkCEK2gQMWSb" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 9: 2yoLUqfk6HpxHXzZTUi7i9ACBcyPoW9RskoG37YEW3cw
  account9_mints: allSolanaTokenMints(
    condition: { account: "2yoLUqfk6HpxHXzZTUi7i9ACBcyPoW9RskoG37YEW3cw" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account9_burns: allSolanaTokenBurns(
    condition: { account: "2yoLUqfk6HpxHXzZTUi7i9ACBcyPoW9RskoG37YEW3cw" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account9_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "2yoLUqfk6HpxHXzZTUi7i9ACBcyPoW9RskoG37YEW3cw" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account9_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "2yoLUqfk6HpxHXzZTUi7i9ACBcyPoW9RskoG37YEW3cw" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  # Account 10: 3Bm5DcrJ7zQDm55SxMUncKBWQbiK8F1V4bZ9NUqtHAQq
  account10_mints: allSolanaTokenMints(
    condition: { account: "3Bm5DcrJ7zQDm55SxMUncKBWQbiK8F1V4bZ9NUqtHAQq" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account10_burns: allSolanaTokenBurns(
    condition: { account: "3Bm5DcrJ7zQDm55SxMUncKBWQbiK8F1V4bZ9NUqtHAQq" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      account
      amountRaw
      timestamp
      program
      signature
      mint
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account10_transfers_to: allSolanaTokenTransfers(
    condition: { toAccount: "3Bm5DcrJ7zQDm55SxMUncKBWQbiK8F1V4bZ9NUqtHAQq" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
  
  account10_transfers_from: allSolanaTokenTransfers(
    condition: { fromAccount: "3Bm5DcrJ7zQDm55SxMUncKBWQbiK8F1V4bZ9NUqtHAQq" }
    first: 10
    orderBy: TIMESTAMP_DESC
  ) {
    nodes {
      amountRaw
      timestamp
      program
      signature
      mint
      fromAccount
      toAccount
      byProgram
      byInstruction
    }
    totalCount
  }
}
```

## Test 9: Check Available Fields
Explore what fields are available on the transaction types:

```graphql
query ExploreTransactionFields {
  __type(name: "SolanaTokenMint") {
    fields {
      name
      type {
        name
        kind
      }
    }
  }
  
  __type(name: "SolanaTokenMintCondition") {
    inputFields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

## Instructions:

1. Start with **Test 1** to verify single account queries work
2. Try **Test 3** and **Test 4** to see if batch filtering is supported
3. If batch filtering doesn't work, use **Test 2** (aliases) as your approach
4. Use **Test 7** to get all transaction types at once
5. Use **Test 8** to explore what filtering options are available

## Notes:

- Replace account addresses with your actual account addresses
- Adjust `first` parameter based on how many results you want per page
- Use `pageInfo` to paginate through results if `hasNextPage` is true
- If you get errors, check the GraphQL schema explorer to see what fields/conditions are actually available

