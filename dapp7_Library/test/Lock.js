const { expect } = require("chai");

describe("Smart contract test",()=>{
  it("first test",async()=>{
    const owners=await ethers.getSigners();
    console.log(owners[0]);
  })
})

//0x5FbDB2315678afecb367f032d93F642f64180aa3