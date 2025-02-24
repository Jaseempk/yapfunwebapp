import { useState } from "react";
import { BrowserProvider, JsonRpcSigner, Contract, ethers } from "ethers";
import {
  AllowanceProvider,
  AllowanceTransfer,
  PERMIT2_ADDRESS,
  MaxAllowanceTransferAmount,
  PermitSingle,
} from "@uniswap/permit2-sdk";

// Create a compatibility layer for ethers v5 Provider methods that Permit2 SDK expects
class ProviderAdapter {
  private provider: BrowserProvider;

  constructor(provider: BrowserProvider) {
    this.provider = provider;
  }

  async getNetwork() {
    const network = await this.provider.getNetwork();
    return { chainId: network.chainId };
  }

  async getGasPrice() {
    return this.provider.getFeeData().then((data) => data.gasPrice!);
  }

  async getStorageAt(address: string, position: number) {
    return this.provider.getStorage(address, position);
  }

  async getBlockWithTransactions(blockHashOrBlockTag: string | number) {
    return this.provider.getBlock(blockHashOrBlockTag, true);
  }

  // Add other required methods
  _isProvider = true;

  // Proxy all other calls to the underlying provider
  async send(method: string, params: Array<any>): Promise<any> {
    return this.provider.send(method, params);
  }
}

interface Permit2Config {
  tokenAddress: string;
  spenderAddress: string;
  chainId: number;
}

export interface Permit2State {
  isLoading: boolean;
  error: string | null;
  isApproved: boolean;
}

const PERMIT_EXPIRATION = 1000 * 60 * 60 * 24 * 30; // 30 days
const PERMIT_SIG_EXPIRATION = 1000 * 60 * 30; // 30 minutes

export function usePermit2({
  tokenAddress,
  spenderAddress,
  chainId,
}: Permit2Config) {
  const [state, setState] = useState<Permit2State>({
    isLoading: false,
    error: null,
    isApproved: false,
  });

  /**
   * Converts an expiration (in milliseconds) to a deadline (in seconds) suitable for the EVM.
   */
  const toDeadline = (expiration: number): number =>
    Math.floor((Date.now() + expiration) / 1000);

  const getProvider = async (): Promise<{
    provider: BrowserProvider;
    signer: JsonRpcSigner;
  }> => {
    if (!window.ethereum) throw new Error("No ethereum provider found");
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return { provider, signer };
  };

  const checkPermit2Allowance = async (
    userAddress: string
  ): Promise<boolean> => {
    try {
      console.log("ibde ibde");
      const { provider: browserProvider } = await getProvider();
      const provider = new ProviderAdapter(browserProvider);
      const allowanceProvider = new AllowanceProvider(
        provider as any,
        PERMIT2_ADDRESS
      );
      const { amount: permitAmount, expiration } =
        await allowanceProvider.getAllowanceData(
          userAddress,
          tokenAddress,
          spenderAddress
        );

      // Check if we have sufficient allowance and it hasn't expired
      return (
        permitAmount >= MaxAllowanceTransferAmount &&
        expiration > Math.floor(Date.now() / 1000)
      );
    } catch (error) {
      console.error("Error checking Permit2 allowance:", error);
      return false;
    }
  };

  const getPermitSignature = async (
    userAddress: string,
    amount: string
  ): Promise<{ signature: string; permitSingle: PermitSingle } | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { provider: browserProvider, signer } = await getProvider();
      const provider = new ProviderAdapter(browserProvider);
      const allowanceProvider = new AllowanceProvider(
        provider as any,
        PERMIT2_ADDRESS
      );

      // Get the next valid nonce
      const { nonce } = await allowanceProvider.getAllowanceData(
        userAddress,
        tokenAddress,
        spenderAddress
      );

      // Construct the PermitSingle object
      const permitSingle: PermitSingle = {
        details: {
          token: tokenAddress,
          amount: MaxAllowanceTransferAmount,
          expiration: toDeadline(PERMIT_EXPIRATION),
          nonce,
        },
        spender: spenderAddress,
        sigDeadline: toDeadline(PERMIT_SIG_EXPIRATION),
      };

      // Get the permit data for signing
      const { domain, types, values } = AllowanceTransfer.getPermitData(
        permitSingle,
        PERMIT2_ADDRESS,
        chainId
      );

      // Sign the permit data using ethers v6 signTypedData
      // Convert domain to match ethers v6 TypedDataDomain format
      const signature = await signer.signTypedData(
        {
          name: domain.name,
          version: domain.version,
          chainId: chainId,
          verifyingContract: domain.verifyingContract as string,
        },
        types,
        values
      );

      setState((prev) => ({ ...prev, isApproved: true }));
      return { signature, permitSingle };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setState((prev) => ({ ...prev, error: errorMessage }));
      return null;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const executePermitTransfer = async (
    contractAddress: string,
    contractAbi: any,
    permitSingle: PermitSingle,
    signature: string,
    amount: string
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { signer } = await getProvider();

      // Create contract instance with minimal ABI
      const demoAbi = [
        "function permitAndTransferToMe(tuple(tuple(address token, uint160 amount, uint48 expiration, uint48 nonce) details, address spender, uint256 sigDeadline) calldata permitSingle, bytes calldata signature, uint160 amount)",
      ];
      const contract = new Contract(contractAddress, demoAbi, signer);

      // Execute the permitAndTransferToMe function
      const tx = await contract.permitAndTransferToMe(
        permitSingle,
        signature,
        amount
      );
      await tx.wait();

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {
    state,
    checkPermit2Allowance,
    getPermitSignature,
    executePermitTransfer,
  };
}
