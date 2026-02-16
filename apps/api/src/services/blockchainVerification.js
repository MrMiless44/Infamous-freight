// apps/api/src/services/blockchainVerification.js

const crypto = require("crypto");

class BlockchainVerificationService {
  /**
   * Blockchain-based shipment verification and proof of delivery
   * Creates immutable records of transactions
   */

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 4; // Number of leading zeros in hash
  }

  /**
   * Create genesis block
   */
  createGenesisBlock() {
    return new Block(0, "0", new Date(), "Genesis Block", "0");
  }

  /**
   * Add shipment verification to blockchain
   */
  addShipmentRecord(shipmentData) {
    const data = {
      shipmentId: shipmentData.id,
      sender: shipmentData.sender,
      recipient: shipmentData.recipient,
      location: shipmentData.location,
      timestamp: new Date(),
      hash: this.calculateHash(shipmentData),
    };

    this.pendingTransactions.push(data);

    return {
      recorded: true,
      transactionHash: data.hash,
      timestamp: data.timestamp,
      blockHeight: this.chain.length,
    };
  }

  /**
   * Mine new block (proof of work)
   */
  minePendingTransactions() {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const lastBlock = this.chain[this.chain.length - 1];
    const newBlock = new Block(
      this.chain.length,
      lastBlock.hash,
      new Date(),
      this.pendingTransactions,
      "",
    );

    // Proof of work
    while (newBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
      newBlock.nonce++;
      newBlock.hash = newBlock.calculateHash();
    }

    this.chain.push(newBlock);
    this.pendingTransactions = [];

    return newBlock;
  }

  /**
   * Verify shipment delivery
   */
  verifyDelivery(shipmentId) {
    for (const block of this.chain) {
      if (Array.isArray(block.data)) {
        for (const transaction of block.data) {
          if (transaction.shipmentId === shipmentId) {
            return {
              shipmentId,
              verified: true,
              blockHeight: block.index,
              timestamp: block.timestamp,
              proof: block.hash,
            };
          }
        }
      }
    }

    return { shipmentId, verified: false };
  }

  /**
   * Validate blockchain integrity
   */
  validateChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (block.hash !== block.calculateHash()) {
        return { valid: false, error: `Block ${i} hash is invalid` };
      }

      if (block.previousHash !== previousBlock.hash) {
        return { valid: false, error: `Block ${i} previousHash doesn't match` };
      }
    }

    return { valid: true, totalBlocks: this.chain.length };
  }

  /**
   * Get blockchain stats
   */
  getBlockchainStats() {
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((sum, block) => {
        return sum + (Array.isArray(block.data) ? block.data.length : 0);
      }, 0),
      difficulty: this.difficulty,
      chainValid: this.validateChain().valid,
      pendingTransactions: this.pendingTransactions.length,
    };
  }

  /**
   * Calculate hash of data
   */
  calculateHash(data) {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }
}

/**
 * Blockchain Block class
 */
class Block {
  constructor(index, previousHash, timestamp, data, hash) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.nonce = 0;
    this.hash = hash || this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce,
      )
      .digest("hex");
  }
}

module.exports = { BlockchainVerificationService };
