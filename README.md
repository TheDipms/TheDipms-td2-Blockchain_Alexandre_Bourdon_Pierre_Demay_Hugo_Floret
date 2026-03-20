#  dApp Vote Web3

##  Description

Ce projet est une application décentralisée (dApp) permettant de voter pour des candidats via la blockchain Ethereum (réseau Sepolia).

Les votes sont enregistrés on-chain, ce qui les rend :
- publics
- immuables
- vérifiables par tous

---

##  Groupe

Pierre    
Alexandre  
Hugo

---

##  Fonctionnalités

- Lecture des résultats sans connexion
- Connexion avec MetaMask
- Vote via transaction blockchain
- Cooldown de 3 minutes entre deux votes
- Affichage du hash de transaction
- Affichage du bloc de confirmation
- Mise à jour en temps réel via les events
- Explorer blockchain intégré

---

##  Technologies utilisées

- React (Vite)
- Ethers.js v6
- MetaMask
- Ethereum Sepolia

---

##  Lancer le projet

1. Installer les dépendances :
npm install

2. Lancer le serveur :
npm run dev

3. Ouvrir dans le navigateur :
http://localhost:5173

---

##  Prérequis

- MetaMask installé
- Réseau Sepolia activé
- ETH de test (faucet)

---

##  Concepts utilisés

- Smart Contract (lecture / écriture)
- Transactions blockchain
- Signature cryptographique
- Events on-chain
- Immutabilité de la blockchain

---

##  Contrat utilisé

Adresse :
0x291Ac3C6a92dF373dEa40fee62Ad39831B8A1DDC

Lien Etherscan :
https://sepolia.etherscan.io/address/0x291Ac3C6a92dF373dEa40fee62Ad39831B8A1DDC

---

##  Réponses aux questions de compréhension

### 1. Pourquoi les scores s'affichent sans MetaMask ?

Les scores s'affichent sans connexion car les données de la blockchain sont publiques.  
N'importe qui peut lire l'état d'un smart contract gratuitement sans signer de transaction.  
Cette propriété est due à la transparence de la blockchain.

---

### 2. Si quelqu’un connaît votre adresse Ethereum, peut-il voter à votre place ?

Non. L'adresse publique seule ne suffit pas.  
Pour voter, il faut signer une transaction avec la clé privée, qui est stockée dans MetaMask et jamais partagée.  
Donc personne ne peut voter à votre place sans votre clé privée.

---

### 3. Qui vérifie le cooldown (frontend ou smart contract) ?

C’est le smart contract qui vérifie le cooldown.  
Même si quelqu’un modifie le frontend ou appelle directement la fonction vote(), le contrat refusera si le délai n’est pas respecté.  
Le frontend sert uniquement à afficher l’information à l’utilisateur.

---

### 4. Pourquoi ne pas utiliser `Date.now()` au lieu de `block.timestamp` ?

Date.now() dépend de l’ordinateur de l’utilisateur et peut être modifié.  
block.timestamp est défini par la blockchain et validé par le réseau, donc fiable et sécurisé.  
Utiliser Date.now() permettrait de tricher.

---

### 5. Pourquoi faut-il se désabonner avec `contract.off()` ?

Si on ne se désabonne pas, les événements s’accumulent en mémoire.  
Après plusieurs connexions, le même événement serait déclenché plusieurs fois.  
Cela peut provoquer des bugs et des fuites mémoire.

---

### 6. Pourquoi la blockchain est immuable avec le parentHash ?

Chaque bloc contient le hash du bloc précédent (parentHash).  
Si on modifie un bloc, son hash change, ce qui casse toute la chaîne suivante.  
Cela rend toute modification détectable et pratiquement impossible.

---