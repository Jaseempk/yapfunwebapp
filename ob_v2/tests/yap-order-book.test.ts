import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { FeeWithdrawalInitiated } from "../generated/schema"
import { FeeWithdrawalInitiated as FeeWithdrawalInitiatedEvent } from "../generated/YapOrderBook/YapOrderBook"
import { handleFeeWithdrawalInitiated } from "../src/yap-order-book"
import { createFeeWithdrawalInitiatedEvent } from "./yap-order-book-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amountWithdrawn = BigInt.fromI32(234)
    let newFeeWithdrawalInitiatedEvent = createFeeWithdrawalInitiatedEvent(
      caller,
      amountWithdrawn
    )
    handleFeeWithdrawalInitiated(newFeeWithdrawalInitiatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("FeeWithdrawalInitiated created and stored", () => {
    assert.entityCount("FeeWithdrawalInitiated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FeeWithdrawalInitiated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "caller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FeeWithdrawalInitiated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amountWithdrawn",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
