import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import { CrashedOutKolDataUpdated } from "../generated/schema"
import { CrashedOutKolDataUpdated as CrashedOutKolDataUpdatedEvent } from "../generated/YapOracle/YapOracle"
import { handleCrashedOutKolDataUpdated } from "../src/yap-oracle"
import { createCrashedOutKolDataUpdatedEvent } from "./yap-oracle-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let kolId = BigInt.fromI32(234)
    let rank = BigInt.fromI32(234)
    let mindshareScore = BigInt.fromI32(234)
    let timestamp = BigInt.fromI32(234)
    let newCrashedOutKolDataUpdatedEvent = createCrashedOutKolDataUpdatedEvent(
      kolId,
      rank,
      mindshareScore,
      timestamp
    )
    handleCrashedOutKolDataUpdated(newCrashedOutKolDataUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CrashedOutKolDataUpdated created and stored", () => {
    assert.entityCount("CrashedOutKolDataUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CrashedOutKolDataUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "kolId",
      "234"
    )
    assert.fieldEquals(
      "CrashedOutKolDataUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "rank",
      "234"
    )
    assert.fieldEquals(
      "CrashedOutKolDataUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "mindshareScore",
      "234"
    )
    assert.fieldEquals(
      "CrashedOutKolDataUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timestamp",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
