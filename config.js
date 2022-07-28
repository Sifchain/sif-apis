const { env } = process

const config = {
  host: env.API_HOST || 'http://localhost:8080',
  hasura: {
    url: env.HASURA_URL,
    // password: HASURA_PASSWORD,
  },
  testlcd: {
    url: 'https://api-testnet.sifchain.finance',
  },
  lcd: {
    url: env.LCD_SERVER_URL,
  },
  /*mongo: {
    url: env.MONGO_URL,
  },
  */
  infura: {
    url: env.INFURA_URL, // includes secret
  },
  eRowan: {
    contractAddress: '0x07bac35846e5ed502aa91adf6a9e7aa210f2dcbe',
    abi: `[{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType"
      :"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view",
      "type":"function"}]`,
  },
  tests: {
    marginOfError: env.MARGIN_OF_ERROR || 0.5,
  },
  girls: [
    { name: 'jenna', validatorAddress: 'sifvaloper1fy8xewt2xkyrnym2x36qfzwrtqf3z40cyqwzxj' },
    { name: 'alice', validatorAddress: 'sifvaloper1cvqeau8z7um5vnl78ueqyvfl26jcjpunjm68yj' },
    { name: 'mary', validatorAddress: 'sifvaloper1vktf7skpeyc3mq8fdg59nyyg57a053p96nh7d0' },
    { name: 'lisa', validatorAddress: 'sifvaloper1reedn7lzr06smmckgn52mpppca3aepraetyjfy' },
    { name: 'jane', validatorAddress: 'sifvaloper165f2082xga5a3chux9lcf97ty9fa9jfd8mc7cj' },
    { name: 'elizabeth', validatorAddress: 'sifvaloper12ffxzle0x5093ysnpatrjy7rsduj2u2vuqvzh4' },
    { name: 'sophie', validatorAddress: 'sifvaloper1gaej9rvg99xnn8zecznj2vf2tnf87gx6x49ujd' },
    { name: 'ambre', validatorAddress: 'sifvaloper1kxyjwd9clrnntuxdrtejwdrgvatarftzg99dpq' },
  ],
  testAmountRowan: '70558842600761131819410639',
  bridgeBankAddress: 'sif1l3dftf499u4gvdeuuzdl2pgv4f0xdtnuuwlzp8',
  genesisAccountNew: 'sif1zyz5r5v0fzye6sv2n3m4l5gnm3szfzmfxmtp4u',
  genesisAccount: 'sif1ct2s3t8u2kffjpaekhtngzv6yc4vm97xajqyl3',
  genesisAccountNewNew: 'sif16vsc4m2pwys7rwmu9yg8u229dpl4vh7trmlulk',
}


module.exports = config
