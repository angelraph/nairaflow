# Demo Video Script

Target length: about 4.5 minutes. Hard cap: 5. Record the screen with your voice over it, face optional.

Live site: https://nairaflow-angelraphs-projects.vercel.app

## Read this first: three things you cannot film live

Some steps take longer than a video should. Do these BEFORE you hit record, then show the finished result on screen.

1. **A circle round cannot finish on camera.** The contract's minimum round length is 1 hour and the form's minimum is 1 day. You will show a circle being created and joined live, and show a different, already-resolved circle for the payout.
2. **The agent's vault release is not instant.** The agent waits up to 10 minutes for a cheap gas price before it acts. Prepare the vault ahead of time and show the finished release in Activity.
3. **The agent runs on your machine.** It must be running during the prep or nothing gets released. Start it with `npm start` inside the `agent` folder and leave it open.

Nothing here is faked. You are only moving the waiting out of the video.

## Prep checklist (do 30 to 60 minutes before recording)

- [ ] Two browser profiles, each with its own wallet. Call them **Wallet A** (owner, the funded `0xe1a1...b567` account) and **Wallet B** (second member). Both need Arbitrum Sepolia ETH for gas. Both need Circle USDC from faucet.circle.com.
- [ ] Agent running: `npm start` in `agent`, log window visible.
- [ ] **Prepared vault:** with Wallet A create a vault on Arbitrum Sepolia, unlock date far in the future, allowance ON (say 5 per 1 day), deposit 10 USDC, click **Authorize agent**. Wait until the agent releases it. Confirm it appears in **Activity** as "Agent: Vault release".
- [ ] **Prepared circle:** a 1 hour circle with 2 members, created and joined by both wallets, both contributed, resolved by the agent. This has to be made with `cast` because the form does not allow 1 hour. Ask me and I will run it for you. Confirm it shows **Finished** or a payout owed.
- [ ] Open these tabs in order, so you never hunt for a link mid-take: home, Circles, a blank New circle form, Vaults, the prepared vault, the prepared circle, Activity, and the Arbiscan page of the AgentExecutor.
- [ ] Set browser zoom to 110 percent. Close every other tab and notification.
- [ ] Do one full dry run without recording.

## The script

Format: **Click** is what your mouse does. **Say** is what you read out loud. Speak slowly. Pause after every click until the page settles.

### Scene 1: The problem (0:00 to 0:30)

| | |
|---|---|
| **Screen** | Home page, top of page |
| **Say** | "In Nigeria and across West Africa, millions of people save through Ajo or Esusu. A group puts money in every week and one person takes the whole pot each round. It works because of trust, and it breaks when one person disappears or the person holding the money runs off. NairaFlow puts that exact system on Arbitrum, in stablecoins, with no one holding the money." |
| **Click** | Slowly scroll down to the two cards, Savings Circles and Goal Vaults |
| **Say** | "There are two products. Savings circles for groups. Goal vaults for one person saving toward something." |

### Scene 2: Create a circle (0:30 to 1:20)

| | |
|---|---|
| **Click** | Top nav: **Circles**, then **Start a savings circle** (or go to the New circle page) |
| **Say** | "I'm on Arbitrum Sepolia. I'll start a circle." |
| **Click** | Stablecoin dropdown, pick **USDC** |
| **Say** | "This is Circle's real USDC on this network." |
| **Click** | Contribution 5, Round length 7 days, Members 2, Security deposit 1 |
| **Say** | "Five dollars each round. Two members. Every member also locks a security deposit equal to one contribution." |
| **Point at** | The small text under Security deposit |
| **Say** | "This is the trick that makes it safe. If someone misses a round, their deposit covers it, so the group never gets shortchanged." |
| **Click** | **Create circle & join as member 1**, approve the two wallet prompts |
| **Say** | "Two transactions. One approves the deposit, one creates the circle. It's its own contract with its own address." |

When the circle page opens, point at the address at the top and the status badge.

### Scene 3: Second member joins and the circle starts (1:20 to 2:00)

| | |
|---|---|
| **Click** | Switch to the Wallet B browser profile. Paste the circle link. |
| **Click** | **Join circle**, approve the wallet prompts |
| **Say** | "A second person joins from a completely different wallet. The moment the last seat fills, the circle starts by itself. Nobody has to press start." |
| **Point at** | Status badge now **Active**, and the Members list with two addresses |
| **Click** | **Contribute this round**, approve |
| **Say** | "Each member contributes. You can see it flip to contributed next to their address." |

### Scene 4: Payout and defaults (2:00 to 2:40)

| | |
|---|---|
| **Click** | Open the prepared, already resolved circle |
| **Say** | "I can't wait a full round on camera, so this is a circle I ran earlier. Once the round ended, the agent resolved it and paid the winner." |
| **Point at** | The **Withdraw** button or the **owed** amount next to a member |
| **Say** | "The winner's money is waiting to withdraw. It's pull based, so nobody can block a payout by being a bad recipient." |
| **Point at** | Any member marked **defaulted** if the prepared circle has one |
| **Say** | "If a member skips a round, they are marked defaulted and their deposit pays the recipient instead. The circle keeps going." |

### Scene 5: Goal vault and the agent (2:40 to 3:40)

This is your strongest moment. Slow down here.

| | |
|---|---|
| **Click** | Nav **Vaults**, open the prepared vault |
| **Say** | "Now the second product. A goal vault. This is locked until a date I chose, but I allowed a small weekly allowance." |
| **Point at** | Locked badge, Unlocks date, Available now |
| **Click** | Scroll to **Agent policy** |
| **Say** | "This is the part I care most about. I've let an automated agent release my allowance for me. But look at what it is allowed to do." |
| **Point at** | Per-tx limit and Per-period limit |
| **Say** | "A spending limit per transaction and per period. It can only send to the destination I set. It never holds my money and it has no allowance over my funds. The vault pays me directly." |
| **Click** | **Activity** in the nav |
| **Point at** | The "Agent: Vault release" row and its gas price line |
| **Say** | "Here is what the agent did on its own. That row is read straight from the blockchain. It also records the gas price at the moment it acted, because it waits for a cheaper moment before spending. You can check that claim yourself." |
| **Click** | The transaction link if shown, or open the AgentExecutor on Arbiscan |
| **Say** | "And here it is on the explorer, a real transaction." |
| **Click** | Back to the vault, click **Revoke agent access**, approve |
| **Say** | "And I can take it all back in one click. The moment I revoke, the agent's next attempt fails on chain." |
| **Screen** | Optional: the terminal showing the agent log, or the reverted call with the message **policy inactive** |
| **Say** | "That message, policy inactive, comes from the contract. I'm not trusting the agent to stop. The contract stops it." |

### Scene 6: The bug I found (3:40 to 4:05)

| | |
|---|---|
| **Screen** | docs/DEPLOYMENTS.md on GitHub, scrolled to "Bug found and fixed via live testnet operation" |
| **Say** | "One more thing. Running this for real, I found a bug my tests missed. If every member of a finished circle had defaulted, the leftover funds could never be claimed. I fixed it, wrote a test that reproduces it, redeployed both networks, and I've kept the stuck test funds in the old circle visible instead of hiding them." |

### Scene 7: Close (4:05 to 4:25)

| | |
|---|---|
| **Screen** | Home page |
| **Say** | "NairaFlow runs on Arbitrum Sepolia and Robinhood Chain testnet. Every contract is verified and every transaction you saw is real. Savings circles and goal vaults, non-custodial, with an agent that can only do what you allow. Thank you." |

## Words to avoid saying out loud

- "Revolutionary", "seamless", "leverage", "cutting edge", "game changer", "unlock the power". Say what it does instead.
- "Trustless" on its own. Say "no one holds the money".
- Do not say the agent is "AI". It is a rule-following automation. Calling it AI overclaims and a judge will notice.

## If something goes wrong on camera

- **A wallet prompt does not appear:** click the wallet extension icon, approve manually, and keep talking. Cut it in editing.
- **A page shows Loading:** wait 5 seconds, the data refreshes every 8 seconds.
- **Wrong network:** click the wallet button in the top right and switch to Arbitrum Sepolia.
- **A transaction fails:** do not hide it. Say "that one failed, here is why" and show the reason. It reads as honest, and honesty is a selling point in this project.

## Recording tips

- Record at 1080p, cursor visible, one take per scene, then join the scenes.
- Record your voice last if you stumble. Playing the scene back and talking over it is fine.
- Put the live site link and the GitHub link in the video description, not just on screen.
- Second video option: a 60 second cut of only Scenes 2, 5 and 7 for social posts.

## Submission form answers to have ready

- **One line:** Non-custodial savings circles and goal vaults in stablecoins, with an agent that can only act inside limits you set and can be revoked instantly.
- **Networks:** Arbitrum Sepolia and Robinhood Chain testnet.
- **What is real:** Every transaction. USDC on Sepolia is Circle's official token. On Robinhood Chain the stablecoins are labeled test tokens (mUSDC, mUSDG) because no official one could be confirmed there. See docs/DEPLOYMENTS.md.
- **Contract addresses and explorer links:** docs/DEPLOYMENTS.md.
- **How it differs from similar projects:** docs/ARCHITECTURE.md.
