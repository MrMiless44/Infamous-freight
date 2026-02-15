/**
 * Blockchain Audit Service - Phase 4
 * Immutable transaction ledger, smart contract simulation, distributed verification
 */

const crypto = require("crypto");
const logger = require("../middleware/logger");

class BlockchainAuditService {
    constructor() {
        this.chain = []; // blockchain of blocks
        this.pendingTransactions = [];
        this.escrowContracts = new Map();
        this.nodes = new Set(); // distributed nodes
        this.difficulty = 3; // proof of work difficulty
        this.nonce = 0;
    }

    /**
     * Initialize blockchain
     * @returns {Object}
     */
    initialize() {
        try {
            // Create genesis block
            const genesisBlock = this.createBlock(0, "0", []);

            this.chain.push(genesisBlock);

            logger.info("Blockchain initialized", {
                genesisHash: genesisBlock.hash,
            });

            return {
                success: true,
                chain: [genesisBlock],
                genesisHash: genesisBlock.hash,
            };
        } catch (err) {
            logger.error("Blockchain initialization failed", { err });
            throw err;
        }
    }

    /**
     * Record transaction to blockchain
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async recordTransaction(transaction) {
        try {
            const tx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: transaction.type, // payment, shipment, escrow, etc.
                timestamp: new Date(),
                sender: transaction.sender,
                receiver: transaction.receiver,
                amount: transaction.amount,
                loadId: transaction.loadId,
                status: transaction.status || "pending",
                signature: this.signTransaction(transaction),
                hash: null,
            };

            // Calculate hash
            tx.hash = this.hashTransaction(tx);

            // Add to pending transactions
            this.pendingTransactions.push(tx);

            logger.info("Transaction recorded", {
                txId: tx.id,
                type: tx.type,
                amount: tx.amount,
            });

            return {
                success: true,
                transactionId: tx.id,
                hash: tx.hash,
                status: "pending",
                blockHeight: null,
            };
        } catch (err) {
            logger.error("Transaction recording failed", { err });
            throw err;
        }
    }

    /**
     * Mine new block with pending transactions
     * @returns {Promise<Object>}
     */
    async mineBlock() {
        try {
            if (this.pendingTransactions.length === 0) {
                logger.warn("No transactions to mine");
                return {
                    success: false,
                    message: "No pending transactions",
                };
            }

            const previousBlock = this.chain[this.chain.length - 1];
            const transactions = this.pendingTransactions.splice(0, 100); // batch of max 100

            const block = this.createBlock(
                this.chain.length,
                previousBlock.hash,
                transactions,
            );

            // Proof of work
            const startTime = Date.now();
            while (!this.isValidProof(block.hash)) {
                block.nonce++;
                block.hash = this.hashBlock(block);
            }
            const miningTime = Date.now() - startTime;

            // Add to chain
            this.chain.push(block);

            logger.info("Block mined", {
                blockHeight: block.height,
                transactionCount: transactions.length,
                miningTime,
                nonce: block.nonce,
            });

            return {
                success: true,
                block: {
                    height: block.height,
                    hash: block.hash,
                    timestamp: block.timestamp,
                    transactionCount: transactions.length,
                    miningTime,
                },
                transactionsIncluded: transactions.map((tx) => tx.id),
            };
        } catch (err) {
            logger.error("Block mining failed", { err });
            throw err;
        }
    }

    /**
     * Create escrow smart contract
     * @param {Object} contract
     * @returns {Promise<Object>}
     */
    async createEscrowContract(contract) {
        try {
            const escrow = {
                id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                shipper: contract.shipper,
                driver: contract.driver,
                amount: contract.amount,
                loadId: contract.loadId,
                status: "locked", // locked, pending_confirmation, released, dispute
                createdAt: new Date(),
                releaseCondition: contract.releaseCondition || "delivery_confirmed",
                disputeReason: null,
                transactionHash: null,
            };

            // Record escrow creation transaction
            const tx = await this.recordTransaction({
                type: "escrow_creation",
                sender: contract.shipper,
                receiver: "escrow_contract",
                amount: contract.amount,
                loadId: contract.loadId,
                status: "confirmed",
            });

            escrow.transactionHash = tx.hash;
            this.escrowContracts.set(escrow.id, escrow);

            logger.info("Escrow contract created", {
                escrowId: escrow.id,
                amount: escrow.amount,
            });

            return {
                success: true,
                escrowId: escrow.id,
                status: escrow.status,
                amount: escrow.amount,
                transactionHash: tx.hash,
            };
        } catch (err) {
            logger.error("Escrow contract creation failed", { err });
            throw err;
        }
    }

    /**
     * Confirm delivery and release escrow
     * @param {string} escrowId
     * @param {Object} confirmationData
     * @returns {Promise<Object>}
     */
    async confirmDeliveryAndRelease(escrowId, confirmationData) {
        try {
            const escrow = this.escrowContracts.get(escrowId);
            if (!escrow) throw new Error("Escrow contract not found");

            // Verify delivery confirmation
            if (confirmationData.proofOfDelivery && confirmationData.driverSignature) {
                escrow.status = "pending_confirmation";

                // Record delivery confirmation transaction
                const tx = await this.recordTransaction({
                    type: "delivery_confirmed",
                    sender: confirmationData.driver,
                    receiver: escrow.shipper,
                    amount: 0,
                    loadId: escrow.loadId,
                    status: "confirmed",
                });

                // Release escrow funds
                const releaseTx = await this.recordTransaction({
                    type: "escrow_release",
                    sender: "escrow_contract",
                    receiver: escrow.driver,
                    amount: escrow.amount,
                    loadId: escrow.loadId,
                    status: "confirmed",
                });

                escrow.status = "released";

                logger.info("Escrow released", {
                    escrowId,
                    amount: escrow.amount,
                    receiver: escrow.driver,
                });

                return {
                    success: true,
                    escrowId,
                    status: "released",
                    amount: escrow.amount,
                    receiver: escrow.driver,
                    transactionHash: releaseTx.hash,
                };
            } else {
                throw new Error("Invalid delivery confirmation");
            }
        } catch (err) {
            logger.error("Escrow release failed", { escrowId, err });
            throw err;
        }
    }

    /**
     * Dispute escrow (for issues/damage)
     * @param {string} escrowId
     * @param {Object} dispute
     * @returns {Promise<Object>}
     */
    async disputeEscrow(escrowId, dispute) {
        try {
            const escrow = this.escrowContracts.get(escrowId);
            if (!escrow) throw new Error("Escrow not found");

            escrow.status = "dispute";
            escrow.disputeReason = dispute.reason;

            // Record dispute transaction
            const tx = await this.recordTransaction({
                type: "dispute_initiated",
                sender: dispute.initiator,
                receiver: dispute.respondent,
                amount: 0,
                loadId: escrow.loadId,
                status: "pending_review",
            });

            logger.info("Escrow dispute initiated", {
                escrowId,
                reason: dispute.reason,
                initiator: dispute.initiator,
            });

            return {
                success: true,
                escrowId,
                status: "dispute",
                reason: dispute.reason,
                transactionHash: tx.hash,
                requiresArbitration: true,
            };
        } catch (err) {
            logger.error("Dispute initiation failed", { escrowId, err });
            throw err;
        }
    }

    /**
     * Verify audit trail for transaction
     * @param {string} transactionId
     * @returns {Promise<Object>}
     */
    async verifyAuditTrail(transactionId) {
        try {
            let txBlock = null;
            let blockIndex = -1;

            // Find transaction in chain
            for (let i = 0; i < this.chain.length; i++) {
                const tx = this.chain[i].transactions.find((t) => t.id === transactionId);
                if (tx) {
                    txBlock = this.chain[i];
                    blockIndex = i;
                    break;
                }
            }

            if (!txBlock) {
                // Check pending transactions
                const pendingTx = this.pendingTransactions.find((t) => t.id === transactionId);
                if (pendingTx) {
                    return {
                        success: true,
                        transactionId,
                        status: "pending",
                        block: null,
                        verified: false,
                    };
                }
                throw new Error("Transaction not found");
            }

            // Verify chain integrity
            let isValidChain = true;
            for (let i = 1; i < this.chain.length; i++) {
                if (this.chain[i].previousHash !== this.chain[i - 1].hash) {
                    isValidChain = false;
                    break;
                }
            }

            logger.info("Audit trail verified", {
                transactionId,
                blockHeight: blockIndex,
                chainValid: isValidChain,
            });

            return {
                success: true,
                transactionId,
                block: {
                    height: blockIndex,
                    hash: txBlock.hash,
                    timestamp: txBlock.timestamp,
                    transactionCount: txBlock.transactions.length,
                },
                verified: isValidChain,
                chainLength: this.chain.length,
                confirmations: this.chain.length - blockIndex,
            };
        } catch (err) {
            logger.error("Audit trail verification failed", { transactionId, err });
            throw err;
        }
    }

    /**
     * Export blockchain state for distributed nodes
     * @returns {Object}
     */
    exportChainState() {
        try {
            return {
                chain: this.chain,
                pendingTransactions: this.pendingTransactions,
                height: this.chain.length,
                lastBlockHash: this.chain[this.chain.length - 1]?.hash,
                difficulty: this.difficulty,
                timestamp: new Date(),
            };
        } catch (err) {
            logger.error("Chain export failed", { err });
            throw err;
        }
    }

    /**
     * Get blockchain statistics
     * @returns {Object}
     */
    getStatistics() {
        try {
            const totalTransactions = this.chain.reduce(
                (sum, block) => sum + block.transactions.length,
                0,
            );
            const pendingTransactions = this.pendingTransactions.length;

            const chainSize = JSON.stringify(this.chain).length;

            return {
                chainHeight: this.chain.length,
                totalTransactions,
                pendingTransactions,
                escrowContracts: this.escrowContracts.size,
                chainSize,
                difficulty: this.difficulty,
                nodeCount: this.nodes.size,
            };
        } catch (err) {
            logger.error("Statistics retrieval failed", { err });
            return {};
        }
    }

    // Helper methods

    createBlock(height, previousHash, transactions) {
        return {
            height,
            hash: null,
            previousHash,
            timestamp: new Date(),
            transactions,
            nonce: 0,
            miner: "system",
        };
    }

    hashBlock(block) {
        const blockData = JSON.stringify({
            height: block.height,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            transactions: block.transactions,
            nonce: block.nonce,
        });

        return crypto.createHash("sha256").update(blockData).digest("hex");
    }

    hashTransaction(tx) {
        const txData = JSON.stringify({
            type: tx.type,
            sender: tx.sender,
            receiver: tx.receiver,
            amount: tx.amount,
            timestamp: tx.timestamp,
        });

        return crypto.createHash("sha256").update(txData).digest("hex");
    }

    signTransaction(transaction) {
        const message = JSON.stringify(transaction);
        return crypto
            .createHash("sha256")
            .update(message + Date.now())
            .digest("hex");
    }

    isValidProof(hash) {
        const prefix = "0".repeat(this.difficulty);
        return hash.startsWith(prefix);
    }
}

module.exports = new BlockchainAuditService();
