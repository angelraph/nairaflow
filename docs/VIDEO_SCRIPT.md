# Demo Video Script

Target length: about 5 minutes. Hard cap: 6. Screen recording with your voice over it. Face is optional.

Live site: https://nairaflow-angelraphs-projects.vercel.app

A narrated video of this exact walkthrough, recorded from the live site with real transactions, already exists (`NairaFlow-demo.mp4`). Use this script only if you would rather record it yourself, in your own voice and with your own wallet.

## Before you record

1. **Wallet.** Use the funded wallet `0xE1A19fbc9608Be13B92Da24DD4919589900DB567` in your browser wallet. Add the **Arbitrum Sepolia** and **Robinhood Chain Testnet** networks (the app prompts you to switch).
2. **The agent.** It is run by the maintainers and also has a scheduled GitHub job (Actions, then Agent). GitHub schedules are best effort, so do not rely on a specific timing on camera. Anything it does can be done by hand from the app.
3. **Prepared demo on Arbitrum Sepolia** (all real, already on chain):
   - Circle `0xcc8Aa99Edf0F498FBCC1276d55D3041C70B6DC1b`: two members, 1 hour rounds. Both paid round 0. Once it finishes (around 08:15 UTC on 3 October) both members will have paid every round and the agent will have closed it.
   - Vault `0x8AC9D9e27727eC157C770534B935d134979b7DFC` with the agent authorized. The agent already released from it on its own.
   - Older circle `0x2a67F7654533C9daeaf9134436C9B66fa62D125f`: ended with every member defaulted. It is the example of the pool-recovery fix.
4. **Prepared demo on Robinhood Chain Testnet:** circle `0x81d02f7842F9a50437fab07a9432DFe906a808C5`, vault `0x7eA6F38d082572Cf663867AB7bF658eE5A8432b7`, and an older all-defaulted circle `0x4ca62b3A01a57fFE0112bC91ed0684dD0F513AbF`.
5. **Do not click Withdraw on the finished circles before recording.** Your wallet is owed a payout plus its deposit back. That click is a scene.
6. Browser zoom 110 percent, notifications off, only these tabs open: Home, the finished circle, the vault, Activity, Score, Docs.
7. Do one full dry run without recording, **except** the Withdraw click and the Revoke click.

## The script

Format: **Click** is what your mouse does. **Say** is what you read out loud. Speak slowly and pause after every click until the page settles.

### Scene 1: The problem and the product (0:00 to 0:50)

| | |
|---|---|
| **Screen** | Home page, top. Let the rings turn for a second. |
| **Say** | "Across Nigeria and the whole African diaspora, people save through Ajo or Esusu. A group pays in every round, and one person takes the pot, until everyone has had a turn. It works because of trust, and it breaks when someone stops paying or the person holding the money disappears. NairaFlow puts that exact system on Arbitrum, in stablecoins, so nobody holds the money." |
| **Point at** | The three live numbers under the ticker: circles started, goal vaults, agent actions. |
| **Say** | "These numbers are read live from the blockchain. Nothing here is typed in." |
| **Click** | Scroll to the **Plan a circle** card. |
| **Say** | "Before anyone signs anything, you can see what a circle does." |
| **Click** | Set **People** to 5 and **Each pays** to 100. |
| **Say** | "Five people, a hundred each. Whoever's turn it is takes five hundred. Everyone has had a turn after thirty five days. And if somebody skips a round, their deposit covers it." |

### Scene 2: Start a circle for real (0:50 to 1:50)

| | |
|---|---|
| **Click** | **Start this circle** on the planner. |
| **Say** | "The planner carries my numbers straight into the form, so I don't type them twice." |
| **Click** | **Connect Wallet**, connect. Use the network button to switch to **Robinhood Chain Testnet**. |
| **Say** | "This runs on Robinhood Chain's testnet. The same contracts are also live on Arbitrum Sepolia." |
| **Point at** | The **Need test tokens?** card on the right. |
| **Click** | **Get 1,000 mUSDC**, confirm in the wallet. |
| **Say** | "It's a testnet, so everything is play money. One click and I have tokens." |
| **Click** | In **Stablecoin** pick **mUSDC**. Leave 5 members, 100 each, 7 days, deposit 1. |
| **Point at** | The right card: "You lock now as a deposit" and "Everyone has had a turn after". |
| **Click** | **Create circle and join**, confirm both wallet prompts (approve, then create). |
| **Say** | "Two confirmations. The circle is its own contract with its own address. I'm already member number one." |
| **Point at** | The new circle page: status **Filling up**, the members list with your address and the **you** tag. |
| **Say** | "When the fifth person joins, it starts by itself. Nobody presses start." |

### Scene 3: A circle that ran to the end (1:50 to 3:00)

| | |
|---|---|
| **Click** | Nav **Circles**, open the prepared circle `0xcc8A…DC1b` on Arbitrum Sepolia (switch network if needed). |
| **Say** | "Here is a circle that already ran all the way through, on real transactions." |
| **Point at** | Status **Finished**, **Rounds completed 2 of 2**, both members marked **paid**. |
| **Say** | "Two members, two rounds, everyone paid. Round one paid the first member. Round two paid the second." |
| **Point at** | The **owed** amount next to your address and the **Withdraw** button. |
| **Say** | "My payout and my deposit are waiting here. Payouts are collected by the member, never pushed, so one broken wallet can never block a round for everyone else." |
| **Click** | **Withdraw**, confirm. |
| **Say** | "And it's in my wallet." |
| **Click** | Nav **Score**, click **Check score** (your address is filled in). |
| **Say** | "This is the savings score. It reads public events and shows how reliably a wallet pays in: here every contribution was paid, so one hundred percent, Reliable. Nothing is stored by us and nobody can edit it. For people with no bank history, this is the start of a credit record." |

### Scene 4: The agent and the vault (3:00 to 4:20)

This is the strongest moment. Slow down.

| | |
|---|---|
| **Click** | Nav **Vaults**, open `0x8AC9…7DFC`. |
| **Say** | "The second product is a goal vault. Money locked until a date I chose, with a small daily allowance." |
| **Point at** | The **Locked** pill, **Unlocks** date, **Available now**. |
| **Click** | Scroll to **Agent policy**. |
| **Say** | "I let an automated agent release my allowance. Look at what it is allowed to do." |
| **Point at** | **Agent authorized**, **Per transaction**, **Per period**, **Expires**. |
| **Say** | "A limit per transaction, a limit per period, an expiry date. It can only send to the destination I set. It holds no money and has no allowance over my tokens. The vault pays me directly." |
| **Click** | Nav **Activity**, then the **Agent** filter. |
| **Point at** | The **Agent: Vault release** row and its line **Gas price when it acted**. |
| **Say** | "This is what the agent did on its own, read from the chain. It also records the gas price at that moment, because it waits for a cheaper moment before acting. You can check that claim yourself." |
| **Click** | **View tx** on that row. |
| **Say** | "A real transaction on the explorer." |
| **Click** | Back to the vault. Press **Revoke agent access**, confirm. |
| **Say** | "One click takes it all back. From now on, the agent's next attempt fails on chain with the message policy inactive. The contract stops it, not the agent." |
| **Optional** | Show a terminal or the Actions log where the agent reports the revert. Skip if short on time. |

### Scene 5: Docs and FAQ (4:20 to 4:40)

| | |
|---|---|
| **Click** | Nav **Docs**. Scroll quickly past the contents list, then to **Contracts**. |
| **Say** | "Everything is written down: the exact rules, and every contract address on both networks, source-verified on the explorer." |
| **Click** | Nav **FAQ**, open **Can the agent take my money?** |
| **Say** | "And plain answers, including what you still have to trust." |

### Scene 6: What I found by running it (4:40 to 5:15)

| | |
|---|---|
| **Screen** | `docs/DEPLOYMENTS.md` on GitHub, scrolled to **Bugs found and fixed**. |
| **Say** | "I found three real bugs by running this for real and reviewing it. First, if every member of a circle defaulted, the leftover money could never be claimed. Second, my agent policy screen saved the wrong destination, so every release would have failed. Third, and this is the one that mattered: anyone could set an agent policy on someone else's vault and lock them out of revoking it. No funds were at risk, but it was an authorization hole. I fixed it in the contract, wrote tests that fail without the fix, redeployed both networks, and left the old evidence visible instead of hiding it." |

### Scene 7: Close (5:15 to 5:35)

| | |
|---|---|
| **Screen** | Home page. |
| **Say** | "NairaFlow runs on Arbitrum Sepolia and Robinhood Chain testnet. Twenty three tests, a funds-conservation invariant, no high or medium findings from Slither, every contract verified, and an agent that can only do what you allow. Save, rotate, grow. Thank you." |

## Words to avoid saying out loud

- "Revolutionary", "seamless", "leverage", "game changer", "unlock the power". Say what it does.
- "Trustless" on its own. Say "nobody holds the money".
- Do not call the agent "AI". It follows fixed rules, and calling it AI overclaims.
- Do not say "audited". It has tests and static analysis, not a professional audit.

## If something goes wrong on camera

- **A wallet prompt does not show:** open the wallet extension and approve by hand. Cut it in editing.
- **A page says Loading:** public RPCs can be slow. Wait five seconds, the app retries on its own.
- **Wrong network:** use the network button in the top bar.
- **A transaction fails:** do not hide it. Say what failed and why. Honesty is part of this project's story.

## Recording tips

- 1080p, cursor visible, one take per scene, then join them.
- Put the live link and the GitHub link in the video description.
- Add a 60 second cut of Scenes 1, 4 and 7 for social posts.
- The submission answers are ready to paste from [SUBMISSION.md](SUBMISSION.md).
