const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');



const addresses = ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2"]
const leaves = addresses.map(x => keccak256(x))
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
const buf2hex = x => '0x' + x.toString('hex')

console.log("Root",buf2hex(tree.getRoot()));

const leaf = keccak256("0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2") // address from wallet using walletconnect/metamask
const proof = tree.getProof(leaf).map(x => buf2hex(x.data));
console.log("Proof: ",proof);
 //PRESLAE FUNCTION BANA HAI INDIVISUAL