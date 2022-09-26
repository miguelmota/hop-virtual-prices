const { providers, Contract, utils } = window.ethers

const swapAbi = [
  {
    "inputs": [],
    "name": "getVirtualPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
]

async function getBlockNumberFromDate (chain, timestamp) {
  const provider = new providers.StaticJsonRpcProvider(window.networks[chain].publicRpcUrl)
  const blockDater = new window.BlockDater(provider)
  const date = window.luxon.DateTime.fromSeconds(timestamp).toJSDate()
  const info = await blockDater.getDate(date)
  if (!info) {
    throw new Error('could not retrieve block number')
  }

  return info.block
}

document.querySelector('#date').addEventListener('change', (event) => {
  const date = event.target.value
  const dt = window.luxon.DateTime.fromFormat(date, 'yyyy-MM-dd')
  getVirtualPrices(Math.floor(dt.toSeconds()))
})

async function getVirtualPrices(timestamp) {
  document.querySelector('#output').innerHTML = 'fetching...'
  let html = '<ul>'
  const cache = {}
  for (const token in window.addresses.bridges) {
    for (const chain in window.addresses.bridges[token]) {
      if (chain === 'ethereum') {
        continue
      }
      const address = window.addresses.bridges[token][chain].l2SaddleSwap

      try {
        const provider = new providers.StaticJsonRpcProvider(window.networks[chain].publicRpcUrl)
        const contract = new Contract(address, swapAbi, provider)
        const blockTag = cache[chain] || await getBlockNumberFromDate(chain, timestamp)
        cache[chain] = blockTag
        const virtualPrice = await contract.getVirtualPrice({ blockTag })
        const vp = utils.formatUnits(virtualPrice, 18)
        console.log(token, chain, address, vp)
        html += `<li>${token} pool on ${chain} virtual price at block ${blockTag}: <code>${vp}</code></li>`
        document.querySelector('#output').innerHTML = html
      } catch (err) {
        console.error(err)
      }
    }
  }

  html += '</ul>'
  document.querySelector('#output').innerHTML = html
}
