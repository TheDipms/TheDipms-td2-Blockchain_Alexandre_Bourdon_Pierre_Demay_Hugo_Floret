import { useState, useEffect, useRef } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import ABI from './abi.json'
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID, EXPECTED_NETWORK_NAME } from './config'
import './index.css'
import './styles.css'

const CANDIDATE_NAMES = ['Léon Blum', 'Jacques Chirac', 'François Mitterrand']
const CANDIDATE_INITIALS = ['LB', 'JC', 'FM']
const CANDIDATE_COLORS = ['#6366f1', '#f59e0b', '#ec4899']

const ACCORDION_ITEMS = [
  {
    title: 'Connexion MetaMask',
    icon: '01',
    content:
      "MetaMask est votre identité sur la blockchain. Quand vous cliquez 'Connecter', MetaMask expose votre adresse publique (0x…) à l'application. Cette adresse est votre identifiant unique — il n'y a pas de login, pas de mot de passe, pas de serveur. La clé privée ne quitte jamais MetaMask.",
  },
  {
    title: 'Signer une transaction',
    icon: '02',
    content:
      "Voter = envoyer une transaction à un smart contract. MetaMask calcule le hash de cette transaction, le signe avec votre clé privée (algorithme ECDSA), et diffuse la transaction signée sur le réseau Ethereum. Le réseau vérifie la signature — sans jamais voir votre clé privée — et confirme que c'est bien vous qui avez voté.",
  },
  {
    title: 'Confirmation on-chain',
    icon: '03',
    content:
      "Une fois signée, la transaction entre dans le mempool — la file d'attente des transactions en attente. Un validateur la sélectionne et l'inclut dans un bloc. Sur Ethereum Sepolia, ça prend ~12 secondes. Après ~12,8 minutes (2 époques), le bloc est finalisé : le vote est irréversible, public, et vérifiable par tous sur Etherscan.",
  },
]

function TxStatusBanner({ status }) {
  if (!status) return null
  const steps = {
    1: { icon: '⏳', label: 'Signature dans MetaMask…', cls: 'tx-step-pending' },
    2: { icon: '📡', label: 'Transaction envoyée — hash :', cls: 'tx-step-sent' },
    3: { icon: '⏱', label: 'En attente de confirmation (~12s)…', cls: 'tx-step-waiting' },
    4: { icon: '✅', label: 'Incluse dans le bloc', cls: 'tx-step-confirmed' },
  }
  const m = steps[status.step]
  return (
    <div className={`tx-banner ${m.cls}`}>
      <span className="tx-banner-icon">{m.icon}</span>
      <span className="tx-banner-label">{m.label}</span>
      {(status.step === 2 || status.step === 3) && status.hash && (
        <code className="tx-hash-code">{status.hash}</code>
      )}
      {status.step === 4 && status.blockNumber && (
        <span className="tx-block-num">#{status.blockNumber}</span>
      )}
    </div>
  )
}

function DataRow({ label, value, link, highlight, mono }) {
  return (
    <div className="modal-row">
      <div className="modal-label">{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="modal-value modal-link">
          {value}
        </a>
      ) : (
        <div className={`modal-value${mono ? ' mono' : ''}`} style={highlight ? { color: highlight } : undefined}>
          {value}
        </div>
      )}
    </div>
  )
}

function BlockModal({ data, loading, onClose, onNavigate, voteBlocks }) {
  const [showExtra, setShowExtra] = useState(false)
  const [slideDir, setSlideDir] = useState(null)
  if (!data) return null
  const { event, block } = data
  const fmt = (ts) => (ts != null ? new Date(ts * 1000).toLocaleString('fr-FR') : '—')
  const fmtNum = (n) => (n != null ? Number(n).toLocaleString('fr-FR') : '—')
  const sortedBlocks = [...voteBlocks].sort((a, b) => b - a)
  const currentIdx = block?.number != null ? sortedBlocks.indexOf(block.number) : -1
  const canPrev = currentIdx > 0
  const canNext = currentIdx !== -1 && currentIdx < sortedBlocks.length - 1

  const handleNav = (targetBlock, dir) => {
    setSlideDir(dir)
    onNavigate(targetBlock)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Bloc #{block?.number ?? '…'}</div>
          <div className="modal-header-actions">
            {block?.number != null && (
              <a
                href={`https://sepolia.etherscan.io/block/${block.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Etherscan
              </a>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
        <div
          className="modal-body"
          style={loading ? { opacity: 0.4, pointerEvents: 'none' } : {}}
        >
          <div key={block?.number} className={slideDir ? `slide-${slideDir}` : ''}>
            {event ? (
              <>
                <DataRow label="Transaction Hash" value={event.hash ?? '—'} link={event.hash ? `https://sepolia.etherscan.io/tx/${event.hash}` : null} mono />
                <DataRow label="Votant" value={event.voter ?? '—'} mono />
                <DataRow label="Candidat voté" value={event.candidateName ?? '—'} highlight="var(--accent)" />
                <DataRow label="Gas (tx)" value={event.gasUsed != null ? `${fmtNum(event.gasUsed)} unités` : '—'} />
              </>
            ) : (
              <p className="modal-empty">Aucun vote enregistré dans ce bloc.</p>
            )}
            <DataRow label="Numéro de bloc" value={block?.number != null ? `#${block.number}` : '—'} />
            <DataRow label="Timestamp" value={fmt(block?.timestamp)} />
            <DataRow label="parentHash" value={block?.parentHash ?? '—'} mono />

            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setShowExtra((s) => !s)}>
              {showExtra ? '▴ Masquer' : "▾ Plus d'infos"}
            </button>

            {showExtra && (
              <>
                <DataRow label="gasLimit (bloc)" value={block?.gasLimit != null ? `${fmtNum(block.gasLimit)} unités` : '—'} />
                <DataRow label="gasUsed (bloc)" value={block?.gasUsedBlock != null ? `${fmtNum(block.gasUsedBlock)} unités` : '—'} />
                <DataRow label="Validateur" value={block?.miner ?? '—'} mono />
              </>
            )}

            <div className="info-box" style={{ marginTop: 20 }}>
              Le parentHash est le hash du bloc précédent. Ce lien cryptographique rend la blockchain immuable : modifier un bloc changerait son hash, invalidant le parentHash du bloc suivant.
            </div>
          </div>
        </div>
        <div className="modal-nav">
          <button className="btn btn-outline" onClick={() => canPrev && handleNav(sortedBlocks[currentIdx - 1], 'left')} disabled={!canPrev}>
            ← Précédent
          </button>
          <button className="btn btn-outline" onClick={() => canNext && handleNav(sortedBlocks[currentIdx + 1], 'right')} disabled={!canNext}>
            Suivant →
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [provider, setProvider] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [isVoting, setIsVoting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [error, setError] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txGasUsed, setTxGasUsed] = useState(null)
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [explorerEvents, setExplorerEvents] = useState([])
  const [explorerLoading, setExplorerLoading] = useState(false)
  const [openAccordions, setOpenAccordions] = useState({})
  const [modalData, setModalData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const connectRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return
      try {
        const p = new BrowserProvider(window.ethereum)
        setProvider(p)
        await loadCandidates(p)
      } catch { /* silent */ }
    }
    init()
  }, [])

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask n'est pas installé.")
        return
      }
      const _provider = new BrowserProvider(window.ethereum)
      await _provider.send('eth_requestAccounts', [])
      const network = await _provider.getNetwork()
      if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
        setError(`Mauvais réseau — connectez MetaMask sur ${EXPECTED_NETWORK_NAME}.`)
        return
      }
      const signer = await _provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)
      setProvider(_provider)
      setError(null)
      await loadCandidates(_provider)
      try {
        const bal = await _provider.getBalance(address)
        setBalance((Number(bal) / 1e18).toFixed(4))
      } catch { /* silent */ }
    } catch {
      setError('Connexion refusée.')
    }
  }

  useEffect(() => {
    if (!window.ethereum) return
    const handler = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null)
        setBalance(null)
      } else {
        setAccount(accounts[0])
      }
    }
    window.ethereum.on('accountsChanged', handler)
    return () => window.ethereum.removeListener('accountsChanged', handler)
  }, [])

  const loadCandidates = async (_provider) => {
    const c = new Contract(CONTRACT_ADDRESS, ABI, _provider)
    const count = await c.getCandidatesCount()
    const list = []
    for (let i = 0; i < Number(count); i++) {
      const [name, voteCount] = await c.getCandidate(i)
      list.push({ id: i, name, votes: Number(voteCount) })
    }
    setCandidates(list)
  }

  const loadExplorerEvents = async (_provider) => {
    const p = _provider || provider
    if (!p) return
    setExplorerLoading(true)
    try {
      const ec = new Contract(CONTRACT_ADDRESS, ABI, p)
      const raw = await ec.queryFilter(ec.filters.Voted(), 0)
      const all = raw.slice().reverse()
      const enriched = await Promise.all(
        all.map(async (e) => {
          let timestamp = null, parentHash = null, gasUsed = null
          let gasLimit = null, miner = null, gasUsedBlock = null
          const idx = Number(e.args.candidateIndex)
          const candidateName = CANDIDATE_NAMES[idx] ?? `Candidat #${idx}`
          try {
            const block = await p.getBlock(e.blockNumber)
            timestamp = block?.timestamp ?? null
            parentHash = block?.parentHash ?? null
            gasLimit = block?.gasLimit != null ? Number(block.gasLimit) : null
            miner = block?.miner ?? null
            gasUsedBlock = block?.gasUsed != null ? Number(block.gasUsed) : null
          } catch { /* silent */ }
          try {
            const receipt = await p.getTransactionReceipt(e.transactionHash)
            gasUsed = receipt?.gasUsed != null ? Number(receipt.gasUsed) : null
          } catch { /* silent */ }
          return { hash: e.transactionHash, blockNumber: e.blockNumber, voter: e.args.voter, candidateIndex: idx, candidateName, timestamp, parentHash, gasUsed, gasLimit, miner, gasUsedBlock }
        })
      )
      setExplorerEvents(enriched)
    } catch {
      setExplorerEvents([])
    } finally {
      setExplorerLoading(false)
    }
  }

  const vote = async (candidateId) => {
    try {
      setIsVoting(true)
      setError(null)
      setTxStatus({ step: 1 })
      const signer = await provider.getSigner()
      const voteContract = new Contract(CONTRACT_ADDRESS, ABI, signer)
      const secondsLeft = Number(await voteContract.getTimeUntilNextVote(account))
      if (secondsLeft > 0) {
        setCooldownSeconds(secondsLeft)
        setIsVoting(false)
        setTxStatus(null)
        return
      }
      const tx = await voteContract.vote(candidateId)
      setTxHash(tx.hash)
      setTxStatus({ step: 2, hash: tx.hash })
      setTxStatus({ step: 3, hash: tx.hash })
      const receipt = await tx.wait()
      setTxGasUsed(Number(receipt.gasUsed))
      setTxStatus({ step: 4, hash: tx.hash, blockNumber: receipt.blockNumber })
      await loadCandidates(provider)
      if (explorerOpen) loadExplorerEvents()
      setCooldownSeconds(3 * 60)
    } catch (err) {
      setTxStatus(null)
      setError(err.code === 4001 ? 'Transaction annulée.' : 'Erreur : ' + err.message)
    } finally {
      setIsVoting(false)
    }
  }

  useEffect(() => {
    if (!provider) return
    let listenContract
    try {
      listenContract = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const handler = (voter, candidateIndex) => {
        const idx = Number(candidateIndex)
        setLastEvent({
          voter: voter.slice(0, 6) + '…' + voter.slice(-4),
          candidateName: CANDIDATE_NAMES[idx] ?? `Candidat #${idx}`,
        })
        loadCandidates(provider)
      }
      listenContract.on('Voted', handler)
      return () => { listenContract.off('Voted', handler) }
    } catch (err) {
      console.warn('Impossible d\'écouter les events :', err.message)
    }
  }, [provider])

  useEffect(() => {
    if (explorerOpen && provider) loadExplorerEvents()
  }, [explorerOpen])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const openModal = (event) => {
    setModalData({
      event,
      block: {
        number: event.blockNumber,
        parentHash: event.parentHash,
        timestamp: event.timestamp,
        gasLimit: event.gasLimit,
        miner: event.miner,
        gasUsedBlock: event.gasUsedBlock,
      },
    })
  }

  const navigateModal = async (targetNum) => {
    setModalLoading(true)
    try {
      const block = await provider.getBlock(targetNum)
      const matchingEvent = explorerEvents.find((e) => e.blockNumber === targetNum) || null
      setModalData({
        event: matchingEvent,
        block: {
          number: block.number,
          parentHash: block.parentHash,
          timestamp: block.timestamp,
          gasLimit: block.gasLimit != null ? Number(block.gasLimit) : null,
          miner: block.miner ?? null,
          gasUsedBlock: block.gasUsed != null ? Number(block.gasUsed) : null,
        },
      })
    } catch { /* silent */ } finally {
      setModalLoading(false)
    }
  }

  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0)
  const toggleAccordion = (i) => setOpenAccordions((prev) => ({ ...prev, [i]: !prev[i] }))
  const fmt = (ts) => (ts != null ? new Date(ts * 1000).toLocaleString('fr-FR') : '—')
  const voteBlocks = explorerEvents.map((e) => e.blockNumber)

  return (
    <div className="app">
      {/* Decorative blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-brand">
          <span className="brand-icon">&#x2B22;</span>
          <span className="brand-text">dApp<span className="brand-dot">.</span>Vote</span>
        </div>
        <div className="nav-right">
          <span className="network-badge">
            <span className="network-dot" />
            Sepolia
          </span>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-tag">Live on Ethereum Sepolia</div>
        <h1 className="hero-title">
          Vote décentralisé<br />
          <span className="hero-gradient">sans intermédiaire</span>
        </h1>
        <p className="hero-sub">
          Chaque vote est une transaction signée sur la blockchain Ethereum.
          <br />
          Transparent, immuable, vérifiable par tous.
        </p>

        <p style={{
          marginTop: '10px',
          fontSize: '14px',
          opacity: 0.7,
          letterSpacing: '1px'
        }}>
        👨‍💻 Groupe : Pierre · Alexandre · Hugo
        </p>
      </header>

      {/* Wallet Connection */}
      <section className="glass-card" ref={connectRef}>
        <div className="card-header">
          <span className="card-accent" />
          <h2 className="card-label">Wallet</h2>
        </div>
        {!account ? (
          <button className="btn btn-primary btn-connect" onClick={connectWallet}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            Connecter MetaMask
          </button>
        ) : (
          <div className="wallet-info">
            <div className="wallet-address">
              <span className="pulse-dot" />
              <code>{account}</code>
            </div>
            {balance && (
              <div className="wallet-balance">{balance} SepoliaETH</div>
            )}
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      {/* Smart Contract Info */}
      <section className="glass-card">
        <div className="card-header">
          <span className="card-accent" />
          <h2 className="card-label">Smart Contract</h2>
        </div>
        <code className="contract-addr">{CONTRACT_ADDRESS}</code>
        <div className="contract-links">
          <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            Voir le contrat
          </a>
          <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#transactions`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            Transactions
          </a>
          <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#events`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            Events
          </a>
        </div>
        <p className="card-desc">
          Ce contrat est déployé de façon permanente sur Ethereum Sepolia. Son code ne peut plus être modifié — c'est l'immuabilité de la blockchain. Chaque vote appelle <code>vote(candidateIndex)</code> qui vérifie le cooldown, incrémente le compteur et émet un event <code>Voted</code>.
        </p>
      </section>

      {/* Accordion - How it works */}
      <section className="glass-card">
        <div className="card-header">
          <span className="card-accent" />
          <h2 className="card-label">Comment fonctionne le vote on-chain ?</h2>
        </div>
        <div className="accordion">
          {ACCORDION_ITEMS.map((item, i) => (
            <div key={i} className={`accordion-item${openAccordions[i] ? ' open' : ''}`}>
              <button className="accordion-trigger" onClick={() => toggleAccordion(i)}>
                <span className="accordion-num">{item.icon}</span>
                <span className="accordion-title">{item.title}</span>
                <span className="accordion-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              <div className="accordion-body">
                <p className="accordion-content">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Candidates */}
      {candidates.length > 0 && (
        <section className="glass-card">
          <div className="card-header">
            <span className="card-accent" />
            <h2 className="card-label">Candidats</h2>
            <span className="card-badge">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>

          <div className="candidates-grid">
            {candidates.map((c) => {
              const pct = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
              return (
                <div key={c.id} className="candidate-card" style={{ '--candidate-color': CANDIDATE_COLORS[c.id] }}>
                  <div className="candidate-avatar">
                    <span>{CANDIDATE_INITIALS[c.id]}</span>
                  </div>
                  <h3 className="candidate-name">{c.name}</h3>
                  <div className="candidate-votes">{c.votes}</div>
                  <div className="candidate-label">votes</div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="progress-pct">{pct}%</div>

                  {!account ? (
                    <button
                      className="btn btn-ghost btn-sm btn-full"
                      onClick={() => connectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    >
                      Connectez-vous pour voter
                    </button>
                  ) : cooldownSeconds === 0 ? (
                    <button className="btn btn-vote btn-full" onClick={() => vote(c.id)} disabled={isVoting}>
                      {isVoting ? 'En cours…' : 'Voter'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>

          {txStatus && (isVoting || txStatus.step === 4) && <TxStatusBanner status={txStatus} />}

          {txStatus?.step === 4 && txStatus.blockNumber && (
            <div className="info-box" style={{ marginTop: 16 }}>
              Votre transaction est dans le bloc <strong>#{txStatus.blockNumber}</strong>. Elle est permanente sur Ethereum Sepolia.
              {txGasUsed != null && (
                <> Gas utilisé : <strong>{txGasUsed.toLocaleString('fr-FR')} unités</strong>.</>
              )}
            </div>
          )}

          {txStatus?.step === 4 && <div className="alert alert-success">Vote enregistré sur la blockchain Ethereum</div>}

          {cooldownSeconds > 0 && (
            <div className="cooldown">
              <div className="cooldown-label">Prochain vote disponible dans</div>
              <div className="cooldown-timer">
                {String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}:
                {String(cooldownSeconds % 60).padStart(2, '0')}
              </div>
              <div className="cooldown-hint">Cooldown vérifié on-chain via block.timestamp</div>
            </div>
          )}

          {txStatus?.step === 4 && txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="etherscan-link"
            >
              Voir la transaction sur Etherscan →
            </a>
          )}

          {lastEvent && (
            <div className="event-pill">
              <span className="event-flash" />
              <span>
                <strong>{lastEvent.voter}</strong> a voté pour{' '}
                <strong>{lastEvent.candidateName}</strong>
              </span>
            </div>
          )}
        </section>
      )}

      {/* Blockchain Explorer */}
      <section className="glass-card">
        <div className="card-header">
          <span className="card-accent" />
          <h2 className="card-label">Blockchain Explorer</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setExplorerOpen((o) => !o)}>
            {explorerOpen ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        <div className={`explorer-collapse${explorerOpen ? ' open' : ''}`}>
          <div className="info-box" style={{ marginBottom: 16 }}>
            Historique immuable des transactions on-chain. Chaque ligne est un vote inclus dans un bloc Ethereum. Le parentHash relie chaque bloc au précédent — modifier un bloc invaliderait toute la chaîne.
          </div>

          {explorerLoading ? (
            <div className="explorer-loading">
              <span className="spinner" /> Chargement des données on-chain…
            </div>
          ) : explorerEvents.length === 0 ? (
            <div className="explorer-empty">Aucun vote enregistré sur la blockchain.</div>
          ) : (
            <div className="table-scroll">
              <table className="explorer-table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Bloc</th>
                    <th>Votant</th>
                    <th>Candidat</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {explorerEvents.map((e, i) => (
                    <tr key={i} onClick={() => openModal(e)}>
                      <td className="td-hash">{e.hash}</td>
                      <td>{e.blockNumber}</td>
                      <td className="td-voter">{e.voter.slice(0, 10)}…{e.voter.slice(-6)}</td>
                      <td className="td-candidate">{e.candidateName}</td>
                      <td className="td-time">{fmt(e.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <span className="footer-contract">{CONTRACT_ADDRESS}</span>
        <span className="footer-sep">·</span>
        <span>Ethereum Sepolia</span>
      </footer>



      <BlockModal
        data={modalData}
        loading={modalLoading}
        onClose={() => { setModalData(null); setModalLoading(false) }}
        onNavigate={navigateModal}
        voteBlocks={voteBlocks}
      />
    </div>
  )
}

export default App
