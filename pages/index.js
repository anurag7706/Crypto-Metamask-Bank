import { useState, useEffect } from "react";
import { ethers } from "ethers";
import bank_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";
import styles from "./styles/HomePage.module.css"; // Import the CSS module

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [bank, setBank] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactionHistory, setTransactionHistory] = useState([]);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const bankABI = bank_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts[0]);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts[0]);

    // once the wallet is set, we can get a reference to our deployed contract
    getBankContract();
  };

  const getBankContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const bankContract = new ethers.Contract(contractAddress, bankABI, signer);

    setBank(bankContract);
  };

  const getBalance = async () => {
    if (bank) {
      setBalance((await bank.getBalance()).toNumber());
    }
  };

  const deposit = async () => {
    if (bank) {
      let tx = await bank.deposit(1);
      await tx.wait();
      getBalance();
      addTransactionToHistory("Deposit", 1);
    }
  };

  const withdraw = async () => {
    if (bank) {
      let tx = await bank.withdraw(1);
      await tx.wait();
      getBalance();
      addTransactionToHistory("Withdraw", -1);
    }
  };

  const addTransactionToHistory = (type, amount) => {
    const transaction = {
      type: type,
      amount: amount,
      date: new Date().toLocaleString(),
    };
    setTransactionHistory((prevHistory) => [...prevHistory, transaction]);
  };

  const refreshBalance = () => {
    getBalance();
  };

  const TransactionHistory = ({ history }) => {
    return (
      <div className={styles["history-box"]}>
        <h2 className={styles["transactionHistory-heading"]}>Transaction History</h2>
        <ul className={styles.list}>
          {history.map((transaction, index) => (
            <li className={styles["list-item"]} key={index}>
              {transaction.type} = {transaction.amount} ETH - {transaction.date}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  const initUser = () => {
    // Check to see if the user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if the user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount} className={styles.button}>
          Please connect your Metamask wallet
        </button>
      );
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div className={styles.container}>
        <div className={styles.accountInfo}>
          <p className={styles.paragraph}>Your Account: {account}</p>
          <p className={styles.paragraph}>Your Balance: {balance}</p>
          <div className={styles.buttonGroup}>
            <button onClick={deposit} className={styles.button}>
              Deposit 1 ETH
            </button>
            <button onClick={withdraw} className={styles.button}>
              Withdraw 1 ETH
            </button>
            <button onClick={refreshBalance} className={styles.button}>
              Refresh Balance
            </button>
          </div>
        </div>
        <TransactionHistory history={transactionHistory} />
      </div>
    );
  };

  return (
    <div className={styles["page-wrapper"]}>
      <main className={styles["main-container"]}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Crypto Bank</h1>
        </header>
        {initUser()}
      </main>
    </div>
  );
}
