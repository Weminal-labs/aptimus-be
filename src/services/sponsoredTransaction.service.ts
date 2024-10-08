import {
  Account,
  Aptos,
  AptosConfig,
  Deserializer,
  Ed25519PrivateKey,
  Network,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import {
  CreateSponsoredTransactionRequest,
  CreateSponsoredTransactionResponse,
} from "../types";
import { fromB64, toB64 } from "../utils";

class SponsoredTransactionService {
  // The sponsor server gets the serialized transaction to sign as the fee payer
  static createSponsorTransaction = async ({
    transactionBytesBase64,
    // sender,
    // allowedAddresses,
    // allowedMoveCallTargets,
    network = Network.TESTNET,
  }: CreateSponsoredTransactionRequest): Promise<CreateSponsoredTransactionResponse> => {
    try {
      const aptosConfig = new AptosConfig({ network });
      const aptos = new Aptos(aptosConfig);

      const privateKeyString = process.env.SPONSOR_ACCOUNT_PRIVATE_KEY;
      if (!privateKeyString) {
        throw new Error('SPONSOR_ACCOUNT_PRIVATE_KEY environment variable is not set');
      }
      const privateKey = new Ed25519PrivateKey(privateKeyString);
      const sponsor = Account.fromPrivateKey({
        privateKey
      });
      console.log(`Sponsor's address is: ${sponsor.accountAddress}`);

      // deserialize raw transaction
      const deserializer = new Deserializer(fromB64(transactionBytesBase64));
      const transaction = SimpleTransaction.deserialize(deserializer);

      // Sponsor signs
      const sponsorAuth = aptos.transaction.signAsFeePayer({
        signer: sponsor,
        transaction,
      });

      const sponsorAuthBytes = sponsorAuth.bcsToBytes();
      const sponsorAuthBytesBase64 = toB64(sponsorAuthBytes);

      const sponsorSignedTransactionBytesBase64 = toB64(transaction.bcsToBytes());

      return {
        sponsorAuthBytesBase64,
        sponsorSignedTransactionBytesBase64,
      };
    } catch (error) {
      throw error;
    }
  };
}

export default SponsoredTransactionService;
