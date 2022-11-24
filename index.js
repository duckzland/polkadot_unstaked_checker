var { ApiPromise, WsProvider } = require('@polkadot/api')
var util = require('@polkadot/util')

async function main() {
    const provider = new WsProvider('wss://rpc.polkadot.io', false)
    provider.connect()
    const api = await ApiPromise.create({ provider })

    // 1 Era = 1 day, unstaking has 28 lockup period
    let limitEra = 29;
    let currentEra = await api.query.staking.currentEra()
    let storageKey = ''
    let total = util.BN_ZERO
    let eras = []

    while (true) {
        let stakingEntries = await api.query.staking.ledger.entriesPaged({ args: [ ], pageSize: 1000, startKey: storageKey })

        if (stakingEntries.length == 0) {
            break
        }

        for (entry of stakingEntries) {
            storageKey = entry[0]
            for (item of entry[1].unwrap().unlocking) {
                let n = item.era.toNumber()
                if (n >= currentEra - limitEra) {
                    eras.push(n)
                    total = total.add(item.value.toBn())
                }
            }
        }

        // console.log('Processed entries:', stakingEntries.length)
        // console.log('Total:', total.toString().substring(0, total.toString().length-10), 'DOT')
        // console.log('Storage key:', storageKey.toString())
     }

     console.log('From era:', Math.min(...eras), 'to:', Math.max(...eras))
     console.log('Total unstaking in process:', parseInt(total.toString().substring(0, total.toString().length-10)).toLocaleString('en-US'), 'DOT')

     provider.disconnect()

 }

 main().catch(console.error).finally(() => process.exit())
