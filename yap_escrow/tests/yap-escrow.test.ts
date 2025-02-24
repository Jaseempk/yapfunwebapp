import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { OrderFulFilled } from "../generated/schema"
import { OrderFulFilled as OrderFulFilledEvent } from "../generated/YapEscrow/YapEscrow"
import { handleOrderFulFilled } from "../src/yap-escrow"
import { createOrderFulFilledEvent } from "./yap-escrow-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let marketAddy = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let makerOrTakerAddy = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amountFilled = BigInt.fromI32(234)
    let newOrderFulFilledEvent = createOrderFulFilledEvent(
      marketAddy,
      makerOrTakerAddy,
      amountFilled
    )
    handleOrderFulFilled(newOrderFulFilledEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("OrderFulFilled created and stored", () => {
    assert.entityCount("OrderFulFilled", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "OrderFulFilled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "marketAddy",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderFulFilled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "makerOrTakerAddy",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "OrderFulFilled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amountFilled",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
