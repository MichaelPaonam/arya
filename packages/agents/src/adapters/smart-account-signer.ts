import { ethers } from "ethers";

const SMART_ACCOUNT_ABI = [
  "function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory)",
];

export class SmartAccountSigner extends ethers.AbstractSigner<ethers.JsonRpcProvider> {
  private sessionKeyWallet: ethers.Wallet;
  private smartAccountAddress: string;
  private iface: ethers.Interface;

  constructor(
    sessionKeyWallet: ethers.Wallet,
    smartAccountAddress: string,
    provider: ethers.JsonRpcProvider,
  ) {
    super(provider);
    this.sessionKeyWallet = sessionKeyWallet;
    this.smartAccountAddress = smartAccountAddress;
    this.iface = new ethers.Interface(SMART_ACCOUNT_ABI);
  }

  async getAddress(): Promise<string> {
    return this.smartAccountAddress;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this.sessionKeyWallet.signMessage(message);
  }

  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, unknown>,
  ): Promise<string> {
    return this.sessionKeyWallet.signTypedData(domain, types, value);
  }

  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    const wrappedTx = this.wrapInExecute(tx);
    return this.sessionKeyWallet.signTransaction(wrappedTx);
  }

  async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    const wrappedTx = this.wrapInExecute(tx);
    return this.sessionKeyWallet.sendTransaction(wrappedTx);
  }

  connect(provider: ethers.JsonRpcProvider): SmartAccountSigner {
    const wallet = this.sessionKeyWallet.connect(provider);
    return new SmartAccountSigner(wallet as ethers.Wallet, this.smartAccountAddress, provider);
  }

  private wrapInExecute(tx: ethers.TransactionRequest): ethers.TransactionRequest {
    const executeCalldata = this.iface.encodeFunctionData("execute", [
      tx.to ?? ethers.ZeroAddress,
      tx.value ?? 0n,
      tx.data ?? "0x",
    ]);

    return {
      to: this.smartAccountAddress,
      data: executeCalldata,
      value: 0n,
      gasLimit: tx.gasLimit,
      chainId: tx.chainId,
    };
  }
}
